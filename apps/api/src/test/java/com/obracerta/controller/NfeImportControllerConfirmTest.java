package com.obracerta.controller;

import com.obracerta.configuration.security.TokenService;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.model.entity.Budget;
import com.obracerta.model.entity.Expense;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.Supplier;
import com.obracerta.model.entity.User;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.SupplierRepository;
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

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Confirmação grava uma linha por item com categoria. Validação falha sem nenhuma linha gravada.
@SpringBootTest(properties = "api.security.token.secret=nfe-confirm-test-secret")
@ActiveProfiles("test")
@AutoConfigureMockMvc
class NfeImportControllerConfirmTest {

    private static final String ACCESS_KEY = "35261012345678000190550010000000011000000012";
    private static final String NOT_FOUND_MESSAGE = "Projeto não encontrado";
    private static final String ALREADY_REGISTERED_MESSAGE = "A nota fiscal já foi registrada";
    private static final String CNPJ = "12345678000190";
    private static final String CONFIRM = "/nfe/imports";

    @Autowired private MockMvc mvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private UserRepository users;
    @Autowired private ProjectRepository projects;
    @Autowired private ExpenseCategoryRepository categories;
    @Autowired private SupplierRepository suppliers;
    @Autowired private ExpenseRepository expenses;
    @Autowired private BudgetRepository budgets;
    @Autowired private TokenService tokens;
    @MockBean private ReceiptStorage storage;

    private User owner;
    private User other;
    private Project project;
    private ExpenseCategory first;
    private ExpenseCategory second;

    @BeforeEach
    void persistOwnerAndProject() {
        owner = users.saveAndFlush(user());
        other = users.saveAndFlush(user());
        project = projects.saveAndFlush(project(owner));
        var all = categories.findAll();
        assertThat(all.size()).isGreaterThanOrEqualTo(2);
        first = all.get(0);
        second = all.get(1);
    }

    @Test
    void confirm201GravaUmaLinhaPorItemComCategoriaEscolhida() throws Exception {
        budgets.saveAndFlush(Budget.builder().user(owner).project(project).category(first)
                .estimatedAmount(new BigDecimal("1000.00")).build());
        var before = expenseCount();

        mvc.perform(confirm(project.getId(), "nfe-valida.xml", owner,
                items(item(1, first.getId()), item(2, second.getId()))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(2));

        assertThat(expenseCount()).isEqualTo(before + 2);
        var rows = jdbc.queryForList("select e.nfe_key, e.purchase_date, e.type, e.project_id, e.category_id, "
                + "e.budget_id, e.supplier_id, e.description, e.receipt_state, e.receipt_key, "
                + "e.receipt_content_type, e.receipt_size, e.paid, s.document "
                + "from expenses e join suppliers s on s.id = e.supplier_id "
                + "where e.project_id = ? order by e.description desc", project.getId());
        assertThat(rows).hasSize(2);
        var cimento = rows.get(0);
        var areia = rows.get(1);
        assertThat(cimento.get("nfe_key")).isEqualTo(ACCESS_KEY);
        assertThat(String.valueOf(cimento.get("purchase_date"))).isEqualTo("2026-10-15");
        assertThat(cimento.get("type")).isEqualTo("MATERIAL");
        assertThat(cimento.get("category_id")).isEqualTo(first.getId());
        assertThat(cimento.get("budget_id")).isNotNull();
        assertThat(cimento.get("document")).isEqualTo(CNPJ);
        assertThat(cimento.get("description")).isEqualTo("Cimento CP-II 50kg");
        assertThat(cimento.get("receipt_state")).isEqualTo("UPLOADED");
        assertThat(cimento.get("receipt_content_type")).isEqualTo("application/xml");
        assertThat(cimento.get("receipt_key")).isNotNull();
        assertThat(((Number) cimento.get("receipt_size")).longValue()).isPositive();
        assertThat(areia.get("nfe_key")).isEqualTo(ACCESS_KEY);
        assertThat(String.valueOf(areia.get("purchase_date"))).isEqualTo("2026-10-15");
        assertThat(areia.get("type")).isEqualTo("MATERIAL");
        assertThat(areia.get("category_id")).isEqualTo(second.getId());
        assertThat(areia.get("budget_id")).isNull();
        assertThat(areia.get("document")).isEqualTo(CNPJ);
        assertThat(cimento.get("supplier_id")).isEqualTo(areia.get("supplier_id"));
        assertThat(areia.get("receipt_state")).isEqualTo("NONE");
        assertThat(areia.get("receipt_key")).isNull();
        assertThat(areia.get("receipt_content_type")).isNull();
        assertThat(areia.get("receipt_size")).isNull();

        var uploadedKey = org.mockito.ArgumentCaptor.forClass(String.class);
        org.mockito.Mockito.verify(storage).put(uploadedKey.capture(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.eq("application/xml"));
        assertThat(uploadedKey.getValue()).isEqualTo(cimento.get("receipt_key"));
    }

    @Test
    void confirm201PagamentoUnicoNaPrimeiraLinhaPorPadrao() throws Exception {
        mvc.perform(confirm(project.getId(), "nfe-valida.xml", owner,
                items(item(1, first.getId()), item(2, second.getId()))))
                .andExpect(status().isCreated());

        var payments = jdbc.queryForList("select e.description, p.status, p.due_date, "
                + "to_char(p.paid_at at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') as paid_at_utc "
                + "from pending_payments p join expenses e on e.id = p.expense_id where e.project_id = ?",
                project.getId());
        assertThat(payments).hasSize(1);
        var payment = payments.get(0);
        assertThat(payment.get("description")).isEqualTo("Cimento CP-II 50kg");
        assertThat(payment.get("status")).isEqualTo("PAID");
        assertThat(payment.get("due_date")).isNull();
        assertThat(payment.get("paid_at_utc")).isEqualTo("2026-10-15T00:00:00Z");
        assertThat(jdbc.queryForObject("select count(*) from expenses where project_id = ? and paid = true",
                Long.class, project.getId())).isEqualTo(2L);
    }

    @Test
    void confirm400QuandoUmItemNaoTemCategoriaSemGravarNada() throws Exception {
        var before = expenseCount();

        mvc.perform(confirm(project.getId(), "nfe-valida.xml", owner,
                items(item(1, first.getId()), item(2, null))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/api/projects/" + project.getId() + CONFIRM))
                .andExpect(jsonPath("$.message").value("Itens sem categoria: 2"));

        assertThat(expenseCount()).isEqualTo(before);
        verifyStorageNotTouched();
    }

    @Test
    void confirm400QuandoCategoriaNaoExiste() throws Exception {
        var before = expenseCount();

        mvc.perform(confirm(project.getId(), "nfe-valida.xml", owner,
                items(item(1, first.getId()), item(2, UUID.randomUUID().toString()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/api/projects/" + project.getId() + CONFIRM))
                .andExpect(jsonPath("$.message").value("Categoria inválida nos itens: 2"));

        assertThat(expenseCount()).isEqualTo(before);
        verifyStorageNotTouched();
    }

    @Test
    void confirm400QuandoItemNaoExisteNoXml() throws Exception {
        var before = expenseCount();

        mvc.perform(confirm(project.getId(), "nfe-valida.xml", owner,
                items(item(1, first.getId()), item(2, second.getId()), item(99, first.getId()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/api/projects/" + project.getId() + CONFIRM))
                .andExpect(jsonPath("$.message").value("Itens fora da nota: 99"));

        assertThat(expenseCount()).isEqualTo(before);
        verifyStorageNotTouched();
    }

    @Test
    void confirm404ParaObraDeOutroProprietario() throws Exception {
        var before = expenseCount();

        mvc.perform(confirm(project.getId(), "nfe-valida.xml", other,
                items(item(1, first.getId()), item(2, second.getId()))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(NOT_FOUND_MESSAGE));

        assertThat(expenseCount()).isEqualTo(before);
        verifyStorageNotTouched();
    }

    @Test
    void confirm409QuandoAChaveJaEstaAtivaNaObra() throws Exception {
        var supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja").build());
        expenses.saveAndFlush(Expense.builder().project(project).user(owner)
                .category(first).supplier(supplier)
                .type("MATERIAL").description("Cimento").nfeKey(ACCESS_KEY).build());
        var before = expenseCount();

        mvc.perform(confirm(project.getId(), "nfe-valida.xml", owner,
                items(item(1, first.getId()), item(2, second.getId()))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(ALREADY_REGISTERED_MESSAGE));

        assertThat(expenseCount()).isEqualTo(before);
        var uploadedKey = org.mockito.ArgumentCaptor.forClass(String.class);
        org.mockito.Mockito.verify(storage).put(uploadedKey.capture(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyLong(),
                org.mockito.ArgumentMatchers.anyString());
        org.mockito.Mockito.verify(storage).delete(uploadedKey.getValue());
    }

    private void verifyStorageNotTouched() {
        org.mockito.Mockito.verifyNoInteractions(storage);
    }

    private MockHttpServletRequestBuilder confirm(String projectId, String fixture, User user, String json)
            throws Exception {
        var itemsPart = new MockMultipartFile("items", "items.json", "application/json",
                json.getBytes(StandardCharsets.UTF_8));
        return multipart("/api/projects/" + projectId + CONFIRM)
                .file(nota(fixture))
                .file(itemsPart)
                .header("Authorization", "Bearer " + tokens.generateToken(user));
    }

    private static String item(int itemNumber, String categoryId) {
        return "{\"itemNumber\":" + itemNumber + ",\"categoryId\":"
                + (categoryId == null ? "null" : "\"" + categoryId + "\"") + "}";
    }

    private static String items(String... entries) {
        return "{\"items\":[" + String.join(",", List.of(entries)) + "]}";
    }

    private MockMultipartFile nota(String fixture) throws Exception {
        var bytes = new ClassPathResource("nfe/" + fixture).getContentAsByteArray();
        return new MockMultipartFile("file", fixture, "application/xml", bytes);
    }

    private long expenseCount() {
        return jdbc.queryForObject("select count(*) from expenses where project_id in "
                + "(select id from projects where user_id in (?, ?))", Long.class, owner.getId(), other.getId());
    }

    private User user() {
        return User.builder().name("Proprietário")
                .email("nfe-confirm-" + UUID.randomUUID() + "@example.com")
                .password("unused-password").userRole(UserRole.USER).build();
    }

    private Project project(User dono) {
        return Project.builder().user(dono).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build();
    }

    @AfterEach
    void removeOnlyThisFixture() {
        for (var user : new User[]{owner, other}) {
            if (user == null) continue;
            jdbc.update("delete from pending_payments where expense_id in "
                    + "(select id from expenses where user_id=?)", user.getId());
            jdbc.update("delete from expenses where user_id=?", user.getId());
            jdbc.update("delete from budgets where project_id in (select id from projects where user_id=?)", user.getId());
            jdbc.update("delete from projects where user_id=?", user.getId());
            jdbc.update("delete from suppliers where user_id=?", user.getId());
            users.deleteById(user.getId());
        }
    }
}
