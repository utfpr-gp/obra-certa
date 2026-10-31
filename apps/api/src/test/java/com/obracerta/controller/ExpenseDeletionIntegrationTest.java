package com.obracerta.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.*;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import javax.sql.DataSource;
import java.math.BigDecimal;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;

// Each request owns its transaction; a separate connection proves the commit before storage.
@SpringBootTest @ActiveProfiles("test") @AutoConfigureMockMvc(addFilters=false)
class ExpenseDeletionIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseCategoryRepository categories;
    @Autowired BudgetRepository budgets;
    @MockBean UserContextHelper identity;
    @MockBean ReceiptStorage storage;
    User owner, other;
    Project project;
    String id, key, categoryId, trigger;
    Map<String,Object> originalExpense, originalPayment;

    @BeforeEach void setup() throws Exception {
        owner=user(); other=user(); when(identity.getAuthenticatedUser()).thenReturn(owner);
        project=projects.saveAndFlush(Project.builder().user(owner).name("Casa").type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS).build());
        var category=categories.findAll().getFirst(); categoryId=category.getId();
        budgets.saveAndFlush(Budget.builder().user(owner).project(project).category(category)
                .estimatedAmount(new BigDecimal("500.00")).build());
        var body=json.createObjectNode().put("projectId",project.getId()).put("categoryId",categoryId)
                .put("description","Cimento").put("purchaseDate","2030-01-01").put("paid",false)
                .put("dueDate","2030-01-02").put("valueMode","DIRECT").put("totalPrice",100.25);
        body.putObject("newSupplier").put("name","Loja");
        var response=mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isCreated()).andReturn().getResponse();
        id=json.readTree(response.getContentAsString()).get("id").asText(); key="expenses/"+id+"/receipt.pdf";
        jdbc.update("update expenses set receipt_state='UPLOADED',receipt_key=?,receipt_content_type='application/pdf',receipt_size=3 where id=?",key,id);
        originalExpense=expense(); originalPayment=payment();
        doAnswer(invocation -> {
            assertThat(invocation.<String>getArgument(0)).isEqualTo(key);
            try (var connection=dataSource.getConnection(); var query=connection.prepareStatement(
                    "select e.deleted_at,p.deleted_at from expenses e join pending_payments p on p.expense_id=e.id where e.id=?")) {
                query.setString(1,id);
                try (var rows=query.executeQuery()) {
                    assertThat(rows.next()).isTrue(); assertThat(rows.getObject(1)).isNotNull();
                    assertThat(rows.getObject(2)).isEqualTo(rows.getObject(1));
                }
            }
            return null;
        }).when(storage).delete(anyString());
    }
    User user() { return users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID()+"@test.local")
            .password("test").userRole(UserRole.USER).build()); }
    String endpoint() { return "/api/expenses/"+id; }
    Map<String,Object> expense() { return jdbc.queryForMap("select * from expenses where id=?",id); }
    Map<String,Object> payment() { return jdbc.queryForMap("select * from pending_payments where expense_id=?",id); }
    void assertDeleted() throws Exception {
        var expense=expense(); var payment=payment();
        assertThat(expense.get("deleted_at")).isNotNull();
        assertThat(payment.get("deleted_at")).isEqualTo(expense.get("deleted_at"));
        assertThat(expense).containsAllEntriesOf(withoutMutationFields(originalExpense));
        assertThat(payment).containsAllEntriesOf(withoutMutationFields(originalPayment));
        mvc.perform(get("/api/budgets").param("projectId",project.getId())).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSpent").value(0)).andExpect(jsonPath("$.totalPlanned").value(500));
        assertThat(jdbc.queryForObject("select estimated_amount from budgets where project_id=? and category_id=?",
                BigDecimal.class,project.getId(),categoryId)).isEqualByComparingTo("500.00");
    }
    Map<String,Object> withoutMutationFields(Map<String,Object> source) {
        var result=new HashMap<>(source); result.remove("deleted_at"); result.remove("updated_at"); return result;
    }
    @Test void preservesRowsAndPaymentHistoryAndCommitsBeforeDeletingReceipt() throws Exception {
        jdbc.update("update pending_payments set status='PAID',paid_at=now() where expense_id=?",id);
        originalPayment=payment();
        mvc.perform(delete(endpoint())).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.deleted").value(true)).andExpect(jsonPath("$.receiptDeletionFailed").value(false))
                .andExpect(jsonPath("$.receiptKey").doesNotExist());
        assertDeleted(); verify(storage,times(1)).delete(key);
        clearInvocations(storage);
        mvc.perform(delete(endpoint())).andExpect(status().isNotFound());
        mvc.perform(get(endpoint())).andExpect(status().isNotFound());
        var update=json.createObjectNode().put("description","Novo").put("purchaseDate","2030-01-01")
                .put("categoryId",categoryId).put("valueMode","DIRECT").put("totalPrice",50).put("paid",true);
        mvc.perform(put(endpoint()).contentType(APPLICATION_JSON).content(update.toString())).andExpect(status().isNotFound());
        mvc.perform(get(endpoint()+"/receipt")).andExpect(status().isNotFound());
        mvc.perform(delete(endpoint()+"/receipt")).andExpect(status().isNotFound());
        mvc.perform(multipart(endpoint()+"/receipt").file(new MockMultipartFile("file","new.pdf","application/pdf",new byte[]{1}))
                .with(request -> { request.setMethod("PUT"); return request; })).andExpect(status().isNotFound());
        verifyNoInteractions(storage); assertDeleted();
    }
    @Test void storageFailureReportsFinancialSuccessAndOnlyAttemptsDeletionOnce() throws Exception {
        doAnswer(invocation -> {
            assertThat(expense().get("deleted_at")).isNotNull();
            throw new IllegalStateException("Storage unavailable");
        }).when(storage).delete(key);
        mvc.perform(delete(endpoint())).andExpect(status().isOk()).andExpect(jsonPath("$.deleted").value(true))
                .andExpect(jsonPath("$.receiptDeletionFailed").value(true));
        assertDeleted(); verify(storage,times(1)).delete(key);
        mvc.perform(delete(endpoint())).andExpect(status().isNotFound()); verify(storage,times(1)).delete(key);
    }
    @Test void noConfirmedAttachmentDoesNotAccessStorage() throws Exception {
        jdbc.update("update expenses set receipt_state='NONE',receipt_key=null,receipt_content_type=null,receipt_size=null where id=?",id);
        originalExpense=expense();
        mvc.perform(delete(endpoint())).andExpect(status().isOk()).andExpect(jsonPath("$.receiptDeletionFailed").value(false));
        assertDeleted(); verifyNoInteractions(storage);
    }
    @Test void databaseFailureRollsBackBothRowsWithoutDeletingFile() throws Exception {
        trigger="expense_delete_failure_"+UUID.randomUUID().toString().replace("-","");
        jdbc.execute("create function "+trigger+"() returns trigger language plpgsql as $$ begin if NEW.expense_id='"+id
                +"' and NEW.deleted_at is not null then raise exception 'simulated deletion failure'; end if; return NEW; end $$");
        jdbc.execute("create trigger "+trigger+" before update on pending_payments for each row execute function "+trigger+"()");
        try {
            mvc.perform(delete(endpoint())).andExpect(status().is5xxServerError());
            assertThat(expense()).isEqualTo(originalExpense); assertThat(payment()).isEqualTo(originalPayment);
            verifyNoInteractions(storage);
        } finally { dropTrigger(); }
    }
    @ParameterizedTest @ValueSource(strings={"foreign","missing","expenseDeleted","projectDeleted"})
    void inaccessibleExpenseIs404WithoutWritingOrAccessingStorage(String scenario) throws Exception {
        if (scenario.equals("foreign")) when(identity.getAuthenticatedUser()).thenReturn(other);
        if (scenario.equals("expenseDeleted")) jdbc.update("update expenses set deleted_at=now() where id=?",id);
        if (scenario.equals("projectDeleted")) jdbc.update("update projects set deleted_at=now() where id=?",project.getId());
        var before=expense();
        mvc.perform(delete(scenario.equals("missing") ? "/api/expenses/"+UUID.randomUUID() : endpoint())).andExpect(status().isNotFound());
        assertThat(expense()).isEqualTo(before); assertThat(payment()).isEqualTo(originalPayment); verifyNoInteractions(storage);
    }
    void dropTrigger() {
        if (trigger==null) return;
        jdbc.execute("drop trigger if exists "+trigger+" on pending_payments"); jdbc.execute("drop function if exists "+trigger+"()"); trigger=null;
    }
    @AfterEach void cleanup() {
        dropTrigger();
        if (project!=null) {
            jdbc.update("delete from pending_payments where expense_id in (select id from expenses where project_id=?)",project.getId());
            jdbc.update("delete from expenses where project_id=?",project.getId());
            jdbc.update("delete from budgets where project_id=?",project.getId());
            jdbc.update("delete from suppliers where user_id=?",owner.getId()); projects.deleteById(project.getId());
        }
        if (owner!=null) users.deleteById(owner.getId()); if (other!=null) users.deleteById(other.getId());
    }
}
