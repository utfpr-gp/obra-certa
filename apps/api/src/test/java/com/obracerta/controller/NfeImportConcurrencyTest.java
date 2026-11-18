package com.obracerta.controller;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;

// CA10 na camada de servidor e CA8 em concorrência: duas confirmações simultâneas da mesma nota
// se serializam na trava da obra; uma grava, a outra recebe 409 sem nada parcial.
//
// Este teste é de CARACTERIZAÇÃO, não de TDD clássico: nasceu verde porque a trava já existia
// desde a Tarefa 1 (NfeKeyGuard.ensureNotRegistered + ProjectRepository.lockActiveById com
// FOR UPDATE). Seu valor é fixar CA10/CA8 em concorrência e quebrar se a trava for removida.
// Sensibilidade verificada: sem ensureNotRegistered, o resultado vira [201, 201].
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
class NfeImportConcurrencyTest {

    private static final String XML_TYPE = "application/xml";
    private static final String CONFIRM = "/nfe/imports";
    private static final String ALREADY_REGISTERED_MESSAGE = "A nota fiscal já foi registrada";

    @Autowired private MockMvc mvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DataSource dataSource;
    @Autowired private UserRepository users;
    @Autowired private ProjectRepository projects;
    @Autowired private ExpenseCategoryRepository categories;
    @MockBean private UserContextHelper identity;
    @MockBean private ReceiptStorage storage;

    private User owner;
    private Project project;
    private ExpenseCategory first;
    private ExpenseCategory second;
    private final Queue<String> putKeys = new ConcurrentLinkedQueue<>();
    private final Queue<String> deletedKeys = new ConcurrentLinkedQueue<>();

    @BeforeEach
    void setUp() {
        putKeys.clear();
        deletedKeys.clear();
        owner = users.saveAndFlush(user());
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        var all = categories.findAll();
        assertThat(all.size()).isGreaterThanOrEqualTo(2);
        first = all.get(0);
        second = all.get(1);
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        // Storage mockado e thread-safe: as duas requisições correm em threads diferentes.
        doAnswer(invocation -> {
            putKeys.add(invocation.getArgument(0));
            return null;
        }).when(storage).put(anyString(), any(), anyLong(), anyString());
        doAnswer(invocation -> {
            deletedKeys.add(invocation.getArgument(0));
            return null;
        }).when(storage).delete(anyString());
        assertThat(expenseCount()).isZero();
    }

    @Test
    void duasConfirmacoesSimultaneasDaMesmaNotaGravamSomenteUmaImportacao() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try (Connection blocker = dataSource.getConnection()) {
            blocker.setAutoCommit(false);
            // Segura a MESMA linha que lockActiveById vai pedir, forçando a sobreposição real.
            try (PreparedStatement lock = blocker.prepareStatement(
                    "select id from projects where id = ? for update")) {
                lock.setString(1, project.getId());
                lock.executeQuery().close();
            }

            CountDownLatch start = new CountDownLatch(1);
            Future<Outcome> firstCall = pool.submit(() -> confirm(start));
            Future<Outcome> secondCall = pool.submit(() -> confirm(start));
            start.countDown();

            awaitTwoSessionsWaitingOnTheProjectLock();

            blocker.rollback();

            List<Outcome> outcomes = new ArrayList<>();
            outcomes.add(firstCall.get(15, TimeUnit.SECONDS));
            outcomes.add(secondCall.get(15, TimeUnit.SECONDS));

            assertThat(outcomes).extracting(Outcome::status)
                    .as("uma confirmação grava (201) e a outra é recusada (409)")
                    .containsExactlyInAnyOrder(201, 409);
            var refused = outcomes.stream().filter(outcome -> outcome.status() == 409).findFirst().orElseThrow();
            assertThat(refused.body()).contains(ALREADY_REGISTERED_MESSAGE);

            assertThat(expenseCount()).as("N linhas do XML: nenhuma duplicata").isEqualTo(2);
            assertThat(jdbc.queryForObject(
                    "select count(distinct nfe_key) from expenses where project_id = ?",
                    Long.class, project.getId())).isEqualTo(1L);
            assertThat(jdbc.queryForObject("select count(*) from pending_payments p "
                    + "join expenses e on e.id = p.expense_id where e.project_id = ?",
                    Long.class, project.getId())).isEqualTo(1L);
            assertThat(jdbc.queryForObject("select count(*) from suppliers where user_id = ?",
                    Long.class, owner.getId())).isEqualTo(1L);

            assertThat(putKeys).as("as duas requisições sobem o XML antes da trava").hasSize(2);
            assertThat(deletedKeys).as("só a requisição recusada compensa o upload").hasSize(1);
            String deleted = deletedKeys.peek();
            assertThat(jdbc.queryForList("select receipt_key from expenses where project_id = ?",
                    String.class, project.getId()))
                    .doesNotContain(deleted);
        } finally {
            pool.shutdownNow();
        }
    }

    private Outcome confirm(CountDownLatch start) throws Exception {
        start.await();
        var response = mvc.perform(confirmRequest()).andReturn().getResponse();
        return new Outcome(response.getStatus(), response.getContentAsString());
    }

    // Espera determinística: as duas sessões das requisições precisam estar bloqueadas na obra.
    private void awaitTwoSessionsWaitingOnTheProjectLock() {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(15);
        int waiting;
        do {
            waiting = jdbc.queryForObject("""
                    select count(*) from pg_stat_activity
                    where datname = current_database()
                      and wait_event_type = 'Lock'
                      and pid <> pg_backend_pid()
                    """, Integer.class);
            if (waiting >= 2) return;
            sleepBriefly();
        } while (System.nanoTime() < deadline);
        fail("As duas confirmações deveriam estar bloqueadas na linha da obra, mas apenas "
                + waiting + " sessão(ões) apareceu(aram) em pg_stat_activity com wait_event_type = 'Lock'.");
    }

    private static void sleepBriefly() {
        try {
            Thread.sleep(20);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }

    private long expenseCount() {
        return jdbc.queryForObject("select count(*) from expenses where project_id = ?",
                Long.class, project.getId());
    }

    private MockHttpServletRequestBuilder confirmRequest() throws Exception {
        var items = new MockMultipartFile("items", "items.json", "application/json",
                ("{\"items\":[{\"itemNumber\":1,\"categoryId\":\"" + first.getId() + "\"},"
                        + "{\"itemNumber\":2,\"categoryId\":\"" + second.getId() + "\"}]}")
                        .getBytes(StandardCharsets.UTF_8));
        return multipart("/api/projects/" + project.getId() + CONFIRM)
                .file(nota())
                .file(items)
                .file(new MockMultipartFile("payment", "payment.json", "application/json",
                        "{\"paid\":false}".getBytes(StandardCharsets.UTF_8)));
    }

    private MockMultipartFile nota() throws Exception {
        var bytes = new ClassPathResource("nfe/nfe-valida.xml").getContentAsByteArray();
        return new MockMultipartFile("file", "nfe-valida.xml", XML_TYPE, bytes);
    }

    private User user() {
        return User.builder().name("Proprietário")
                .email("nfe-concurrency-" + UUID.randomUUID() + "@example.com")
                .password("unused-password").userRole(UserRole.USER).build();
    }

    @AfterEach
    void removeOnlyThisFixture() {
        if (project != null) {
            jdbc.update("delete from pending_payments where expense_id in "
                    + "(select id from expenses where project_id = ?)", project.getId());
            jdbc.update("delete from expenses where project_id = ?", project.getId());
            jdbc.update("delete from budgets where project_id = ?", project.getId());
            jdbc.update("delete from projects where id = ?", project.getId());
        }
        if (owner != null) {
            jdbc.update("delete from suppliers where user_id = ?", owner.getId());
            users.deleteById(owner.getId());
        }
    }

    private record Outcome(int status, String body) {
    }
}
