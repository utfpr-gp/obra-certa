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
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// CA8: falha no upload ou no banco não deixa linha, pagamento nem fornecedor; o objeto sobe e é apagado.
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
class NfeImportServiceAtomicityTest {

    private static final String XML_TYPE = "application/xml";
    private static final String CONFIRM = "/nfe/imports";
    private static final String RECEIPT_FAILURE = "Não foi possível enviar o comprovante. Tente novamente.";

    @Autowired private MockMvc mvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private UserRepository users;
    @Autowired private ProjectRepository projects;
    @Autowired private ExpenseCategoryRepository categories;
    @MockBean private UserContextHelper identity;
    @MockBean private ReceiptStorage storage;

    private User owner;
    private Project project;
    private ExpenseCategory first;
    private ExpenseCategory second;
    private final List<String> putKeys = new ArrayList<>();
    private final List<String> deletedKeys = new ArrayList<>();
    private String trigger;

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
        org.mockito.Mockito.when(identity.getAuthenticatedUser()).thenReturn(owner);
        doAnswer(invocation -> {
            putKeys.add(invocation.getArgument(0));
            return null;
        }).when(storage).put(anyString(), any(), anyLong(), anyString());
        doAnswer(invocation -> {
            deletedKeys.add(invocation.getArgument(0));
            return null;
        }).when(storage).delete(anyString());
    }

    @Test
    void falhaNoUploadNaoGravaNada() throws Exception {
        doThrow(new RuntimeException("storage down"))
                .when(storage).put(anyString(), any(), anyLong(), anyString());

        mvc.perform(confirm())
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.message").value(RECEIPT_FAILURE))
                .andExpect(jsonPath("$.path").value("/api/projects/" + project.getId() + CONFIRM));

        assertNothingWritten();
        var attempted = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(storage).put(attempted.capture(), any(), anyLong(), anyString());
        assertThat(attempted.getValue()).startsWith("expenses/nfe/" + project.getId() + "/");
        assertThat(deletedKeys).isEmpty();
        verify(storage, never()).delete(anyString());
    }

    @Test
    void falhaDoBancoDepoisDoUploadFazRollbackEapagaOObjetoSemMetadados() throws Exception {
        trigger = "nfe_insert_failure_" + UUID.randomUUID().toString().replace("-", "");
        // Dispara só na SEGUNDA linha: a primeira já foi inserida quando o rollback acontece.
        jdbc.execute("create function " + trigger + "() returns trigger language plpgsql as $$ begin "
                + "if NEW.project_id = '" + project.getId() + "' and NEW.description = 'Areia média lavada' then "
                + "raise exception 'simulated nfe persistence failure'; end if; return NEW; end $$");
        jdbc.execute("create trigger " + trigger + " before insert on expenses for each row execute function "
                + trigger + "()");

        assertThatThrownBy(() -> mvc.perform(confirm())).satisfies(failure -> {
            assertThat(causes(failure)).anyMatch(DataAccessException.class::isInstance);
            assertThat(failure).hasStackTraceContaining("simulated nfe persistence failure");
        });

        assertNothingWritten();
        assertThat(putKeys).hasSize(1);
        assertThat(deletedKeys).containsExactly(putKeys.get(0));
        verify(storage).delete(putKeys.get(0));
    }

    @Test
    void caminhoFelizNaoApagaOObjeto() throws Exception {
        mvc.perform(confirm())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(2));

        assertThat(count("expenses")).isEqualTo(2);
        assertThat(count("pending_payments")).isEqualTo(1);
        assertThat(count("suppliers")).isEqualTo(1);
        assertThat(putKeys).hasSize(1);
        assertThat(deletedKeys).isEmpty();
        verify(storage, never()).delete(anyString());
    }

    private static List<Throwable> causes(Throwable failure) {
        var chain = new ArrayList<Throwable>();
        for (Throwable current = failure; current != null && !chain.contains(current); current = current.getCause()) {
            chain.add(current);
        }
        return chain;
    }

    private void assertNothingWritten() {
        assertThat(count("expenses")).isZero();
        assertThat(count("pending_payments")).isZero();
        assertThat(count("suppliers")).isZero();
    }

    private long count(String table) {
        if (table.equals("suppliers")) {
            return jdbc.queryForObject("select count(*) from suppliers where user_id = ?",
                    Long.class, owner.getId());
        }
        if (table.equals("pending_payments")) {
            return jdbc.queryForObject("select count(*) from pending_payments p "
                    + "join expenses e on e.id = p.expense_id where e.project_id = ?",
                    Long.class, project.getId());
        }
        return jdbc.queryForObject("select count(*) from expenses where project_id = ?",
                Long.class, project.getId());
    }

    private MockHttpServletRequestBuilder confirm() throws Exception {
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
                .email("nfe-atomic-" + UUID.randomUUID() + "@example.com")
                .password("unused-password").userRole(UserRole.USER).build();
    }

    private void dropTrigger() {
        if (trigger == null) return;
        jdbc.execute("drop trigger if exists " + trigger + " on expenses");
        jdbc.execute("drop function if exists " + trigger + "()");
        trigger = null;
    }

    @AfterEach
    void removeOnlyThisFixture() {
        dropTrigger();
        if (project == null) return;
        jdbc.update("delete from pending_payments where expense_id in "
                + "(select id from expenses where project_id = ?)", project.getId());
        jdbc.update("delete from expenses where project_id = ?", project.getId());
        jdbc.update("delete from projects where id = ?", project.getId());
        jdbc.update("delete from suppliers where user_id = ?", owner.getId());
        users.deleteById(owner.getId());
    }
}
