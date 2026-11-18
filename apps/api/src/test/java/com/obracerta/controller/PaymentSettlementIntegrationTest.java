package com.obracerta.controller;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.obracerta.configuration.security.TokenService;
import com.obracerta.enums.*;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "api.security.token.secret=settlement-test-secret")
@ActiveProfiles("test")
@AutoConfigureMockMvc
class PaymentSettlementIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired TokenService tokens;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseRepository expenses;
    @Autowired ExpenseCategoryRepository categories;
    @Autowired SupplierRepository suppliers;
    @Autowired BudgetRepository budgets;
    @Autowired javax.sql.DataSource dataSource;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager transactionManager;
    User owner;
    Project project;
    Expense expense;
    String token;
    final List<String> userIds = new ArrayList<>();

    @BeforeEach void setup() {
        owner = user();
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        Supplier supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja").build());
        expense = Expense.builder().project(project).user(owner).supplier(supplier)
                .category(categories.findAll().getFirst()).description("Material")
                .purchaseDate(LocalDate.parse("2030-01-02")).totalPrice(new BigDecimal("100.25"))
                .quantity(new BigDecimal("2.00")).unitPrice(new BigDecimal("50.125"))
                .receiptState("UPLOADED").receiptKey("private/receipt.pdf")
                .receiptContentType("application/pdf").receiptSize(3L).paid(false).build();
        expense.setPendingPayment(PendingPayment.builder().expense(expense).status(PaymentStatus.PENDING)
                .dueDate(LocalDate.parse("2030-01-10")).build());
        expense = expenses.saveAndFlush(expense);
        budgets.saveAndFlush(Budget.builder().user(owner).project(project).category(expense.getCategory())
                .estimatedAmount(new BigDecimal("500.00")).build());
        token = tokens.generateToken(owner);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"paymentDate\":null}", "{\"paymentDate\":\"\"}",
            "{\"paymentDate\":\"invalid\"}", "{\"paymentDate\":\"2030-02-30\"}",
            "{\"paymentDate\":\"2030-01-01\"}"})
    void invalidDateReturns400WithoutFinancialChanges(String body) throws Exception {
        var before = snapshot();
        mvc.perform(put(path()).header("Authorization", "Bearer " + token)
                .contentType(APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        assertThat(snapshot()).isEqualTo(before);
    }

    @ParameterizedTest @ValueSource(strings = {"2030-01-02", "2099-12-31"})
    void settlesAtUtcMidnightPreservingHistoryAndAllOtherFields(String date) throws Exception {
        var beforeExpense = jdbc.queryForMap("select * from expenses where id=?", expense.getId());
        var beforePayment = payment();
        var beforeBudgets = jdbc.queryForList("select * from budgets where project_id=?", project.getId());
        settle(date).andExpect(status().isOk()).andExpect(jsonPath("$.paid").value(true))
                .andExpect(jsonPath("$.paidAt").value(date + "T00:00:00Z"))
                .andExpect(jsonPath("$.dueDate").value("2030-01-10"));
        var afterExpense = jdbc.queryForMap("select * from expenses where id=?", expense.getId());
        beforeExpense.remove("paid"); beforeExpense.remove("updated_at");
        afterExpense.remove("paid"); afterExpense.remove("updated_at");
        assertThat(afterExpense).isEqualTo(beforeExpense);
        var afterPayment = payment();
        assertThat(afterPayment.get("status")).isEqualTo("PAID");
        assertThat(jdbc.queryForObject("select paid_at from pending_payments where expense_id=?",
                java.sql.Timestamp.class, expense.getId()).toInstant()).isEqualTo(Instant.parse(date + "T00:00:00Z"));
        beforePayment.remove("status"); beforePayment.remove("paid_at");
        afterPayment.remove("status"); afterPayment.remove("paid_at");
        assertThat(afterPayment).isEqualTo(beforePayment);
        assertThat(jdbc.queryForList("select * from budgets where project_id=?", project.getId())).isEqualTo(beforeBudgets);
        settle("1900-01-01").andExpect(status().isOk()).andExpect(jsonPath("$.paidAt").value(date + "T00:00:00Z"));
        assertThat(jdbc.queryForObject("select count(*) from pending_payments where expense_id=?", Integer.class, expense.getId())).isEqualTo(1);
    }

    @Test void concurrentRequestsReturnTheFirstCommittedDate() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        BlockingQueue<Integer> participants = new LinkedBlockingQueue<>();
        try (var blocker = dataSource.getConnection()) {
            blocker.setAutoCommit(false);
            int blockerPid;
            try (var statement = blocker.createStatement();
                    var result = statement.executeQuery("select pg_backend_pid()")) {
                result.next();
                blockerPid = result.getInt(1);
            }
            try (var statement = blocker.prepareStatement("select id from expenses where id=? for update")) {
                statement.setString(1, expense.getId()); statement.executeQuery().close();
            }
            var first = pool.submit(() -> { start.await(); return settleInIdentifiedTransaction("2030-02-01", participants); });
            var second = pool.submit(() -> { start.await(); return settleInIdentifiedTransaction("2030-03-01", participants); });
            start.countDown();
            Integer firstPid = participants.poll(5, TimeUnit.SECONDS);
            Integer secondPid = participants.poll(5, TimeUnit.SECONDS);
            assertThat(firstPid).as("first request database session").isNotNull();
            assertThat(secondPid).as("second request database session").isNotNull().isNotEqualTo(firstPid);
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
            int waiting;
            do {
                // Follow both hard and queued lock blockers, restricted to these request sessions.
                waiting = jdbc.queryForObject("""
                        with recursive blocked(pid) as (
                            select cast(? as integer)
                            union
                            select activity.pid from pg_stat_activity activity
                            join blocked on blocked.pid = any(pg_blocking_pids(activity.pid))
                            where activity.pid in (?, ?)
                        )
                        select count(*) from pg_stat_activity activity
                        join blocked on blocked.pid = activity.pid
                        where activity.pid in (?, ?) and activity.wait_event_type = 'Lock'
                        """, Integer.class, blockerPid, firstPid, secondPid, firstPid, secondPid);
                if (waiting < 2) Thread.sleep(20);
            } while (waiting < 2 && System.nanoTime() < deadline);
            assertThat(waiting).as("both real transactions must overlap while waiting for the expense lock").isEqualTo(2);
            blocker.commit();
            var a = first.get(15, TimeUnit.SECONDS); var b = second.get(15, TimeUnit.SECONDS);
            assertThat(a.getStatus()).isEqualTo(200); assertThat(b.getStatus()).isEqualTo(200);
            String persisted = json.readTree(a.getContentAsString()).get("paidAt").asText();
            assertThat(persisted).isIn("2030-02-01T00:00:00Z", "2030-03-01T00:00:00Z");
            assertThat(json.readTree(b.getContentAsString()).get("paidAt").asText()).isEqualTo(persisted);
            assertThat(jdbc.queryForObject("select paid_at from pending_payments where expense_id=?",
                    java.sql.Timestamp.class, expense.getId()).toInstant()).isEqualTo(Instant.parse(persisted));
            assertThat(jdbc.queryForObject("select count(*) from pending_payments where expense_id=?", Integer.class, expense.getId())).isEqualTo(1);
        } finally { pool.shutdownNow(); }
    }

    private MockHttpServletResponse settleInIdentifiedTransaction(String date, BlockingQueue<Integer> participants) {
        // Bind PID discovery and the real HTTP/service call to the same physical transaction.
        // The future completes only after TransactionTemplate commits that transaction.
        return new TransactionTemplate(transactionManager).execute(transaction -> {
            participants.add(jdbc.queryForObject("select pg_backend_pid()", Integer.class));
            try {
                return settle(date).andReturn().getResponse();
            } catch (Exception exception) {
                throw new IllegalStateException("Settlement request failed", exception);
            }
        });
    }

    @Test void databaseFailureRollsBackExpenseAndPaymentTogether() throws Exception {
        var before = snapshot();
        String constraint = "settlement_" + UUID.randomUUID().toString().replace("-", "");
        jdbc.execute("alter table pending_payments add constraint " + constraint
                + " check (expense_id <> '" + expense.getId() + "' or paid_at is null) not valid");
        try {
            settle("2030-02-01").andExpect(status().isConflict());
            assertThat(snapshot()).isEqualTo(before);
        } finally { jdbc.execute("alter table pending_payments drop constraint " + constraint); }
    }

    @Test void authorizesBeforeIdempotencyAndRejectsCrossProjectMissingAndDeletedResources() throws Exception {
        settle("2030-02-01").andExpect(status().isOk());
        var before = snapshot();
        token = tokens.generateToken(user());
        settle("2030-02-02").andExpect(status().isNotFound());
        assertThat(snapshot()).isEqualTo(before);
        token = tokens.generateToken(owner);
        String originalProject = project.getId();
        Project other = projects.saveAndFlush(Project.builder().user(owner).name("Outra")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        try {
            mvc.perform(put("/api/projects/" + other.getId() + "/expenses/" + expense.getId() + "/payment")
                    .header("Authorization", "Bearer " + token).contentType(APPLICATION_JSON)
                    .content("{\"paymentDate\":\"2030-02-01\"}")).andExpect(status().isNotFound());
        } finally { projects.deleteById(other.getId()); }
        mvc.perform(put("/api/projects/" + originalProject + "/expenses/" + UUID.randomUUID() + "/payment")
                .header("Authorization", "Bearer " + token).contentType(APPLICATION_JSON)
                .content("{\"paymentDate\":\"2030-02-01\"}")).andExpect(status().isNotFound());
        mvc.perform(put("/api/projects/" + UUID.randomUUID() + "/expenses/" + expense.getId() + "/payment")
                .header("Authorization", "Bearer " + token).contentType(APPLICATION_JSON)
                .content("{\"paymentDate\":\"2030-02-01\"}")).andExpect(status().isNotFound());
        for (String table : List.of("pending_payments", "expenses", "projects")) {
            String id = table.equals("pending_payments") ? expense.getPendingPayment().getId()
                    : table.equals("expenses") ? expense.getId() : project.getId();
            jdbc.update("update " + table + " set deleted_at=now() where id=?", id);
            settle("2030-02-01").andExpect(status().isNotFound());
            jdbc.update("update " + table + " set deleted_at=null where id=?", id);
        }
        assertThat(snapshot()).isEqualTo(before);
    }

    @Test void realSecurityRejectsMissingInvalidAndExpiredJwtWithoutWriting() throws Exception {
        String expired = JWT.create().withIssuer("obra-certa").withSubject(owner.getEmail())
                .withExpiresAt(Instant.now().minusSeconds(60)).sign(Algorithm.HMAC256("settlement-test-secret"));
        var before = snapshot();
        for (String jwt : List.of("", "invalid-token", expired)) {
            var request = put(path()).contentType(APPLICATION_JSON).content("{\"paymentDate\":\"2030-02-01\"}");
            if (!jwt.isEmpty()) request.header("Authorization", "Bearer " + jwt);
            mvc.perform(request).andExpect(status().isUnauthorized());
            assertThat(snapshot()).isEqualTo(before);
        }
    }

    private org.springframework.test.web.servlet.ResultActions settle(String date) throws Exception {
        return mvc.perform(put(path()).header("Authorization", "Bearer " + token).contentType(APPLICATION_JSON)
                .content("{\"paymentDate\":\"" + date + "\"}"));
    }
    private String path() { return "/api/projects/" + project.getId() + "/expenses/" + expense.getId() + "/payment"; }
    private Map<String,Object> payment() { return jdbc.queryForMap("select * from pending_payments where expense_id=?", expense.getId()); }
    private List<Map<String,Object>> snapshot() { return List.of(jdbc.queryForMap("select * from expenses where id=?", expense.getId()), payment()); }
    private User user() {
        User value = users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID()+"@test.local")
                .password("unused").userRole(UserRole.USER).build());
        userIds.add(value.getId()); return value;
    }
    @AfterEach void cleanup() {
        if (project != null) {
            jdbc.update("delete from pending_payments where expense_id in (select id from expenses where project_id=?)", project.getId());
            jdbc.update("delete from expenses where project_id=?", project.getId());
            jdbc.update("delete from budgets where project_id=?", project.getId());
            projects.deleteById(project.getId());
        }
        for (String id : userIds) { jdbc.update("delete from suppliers where user_id=?", id); users.deleteById(id); }
    }
}
