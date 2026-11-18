package com.obracerta.service;

import com.obracerta.configuration.security.TokenService;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.Supplier;
import com.obracerta.model.entity.User;
import com.obracerta.repository.ExpenseCategoryRepository;
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

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// CA6: fornecedor do XML é reutilizado pelo CNPJ do usuário (com a razão social da nota atualizada)
// ou criado quando o CNPJ ainda não existe. Integração sem @Transactional: a importação usa transação própria.
@SpringBootTest(properties = "api.security.token.secret=nfe-supplier-test-secret")
@ActiveProfiles("test")
@AutoConfigureMockMvc
class NfeImportSupplierTest {

    private static final String CNPJ = "12345678000190";
    private static final String NOTE_NAME = "Construções Exemplo Materiais Ltda";
    private static final String CONFIRM = "/nfe/imports";

    @Autowired private MockMvc mvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private UserRepository users;
    @Autowired private ProjectRepository projects;
    @Autowired private ExpenseCategoryRepository categories;
    @Autowired private SupplierRepository suppliers;
    @Autowired private TokenService tokens;
    @MockBean private ReceiptStorage storage;

    private User owner;
    private Project project;
    private ExpenseCategory first;
    private ExpenseCategory second;

    @BeforeEach
    void persistOwnerAndProject() {
        owner = users.saveAndFlush(user());
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        var all = categories.findAll();
        assertThat(all.size()).isGreaterThanOrEqualTo(2);
        first = all.get(0);
        second = all.get(1);
    }

    @Test
    void cnpjExistenteAtualizaRazaoSocialSemDuplicarECriaAsLinhasNoMesmoFornecedor() throws Exception {
        Supplier existing = suppliers.saveAndFlush(Supplier.builder()
                .user(owner).name("Nome Antigo").document(CNPJ).build());

        mvc.perform(confirm()).andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(2));

        var supplierIds = jdbc.queryForList(
                "select id from suppliers where user_id = ? and document = ?",
                String.class, owner.getId(), CNPJ);
        assertThat(supplierIds)
                .as("o CNPJ já cadastrado é vinculado e não duplicado")
                .containsExactly(existing.getId());

        assertThat(supplierName(existing.getId()))
                .as("a razão social da nota substitui a do cadastro existente")
                .isEqualTo(NOTE_NAME);

        assertThat(jdbc.queryForList(
                "select distinct supplier_id from expenses where project_id = ?",
                String.class, project.getId()))
                .containsExactly(existing.getId());
    }

    @Test
    void cnpjNovoCriaFornecedorComRazaoSocialECnpjDaNota() throws Exception {
        assertThat(suppliers.findFirstByUserIdAndDocument(owner.getId(), CNPJ)).isEmpty();

        mvc.perform(confirm()).andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(2));

        var supplierIds = jdbc.queryForList(
                "select id from suppliers where user_id = ? and document = ?",
                String.class, owner.getId(), CNPJ);
        assertThat(supplierIds).hasSize(1);
        assertThat(supplierName(supplierIds.get(0))).isEqualTo(NOTE_NAME);

        assertThat(jdbc.queryForList(
                "select distinct supplier_id from expenses where project_id = ?",
                String.class, project.getId()))
                .containsExactly(supplierIds.get(0));
    }

    private String supplierName(String supplierId) {
        return jdbc.queryForObject("select name from suppliers where id = ?", String.class, supplierId);
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder confirm() throws Exception {
        var itemsPart = new MockMultipartFile("items", "items.json", "application/json",
                items(item(1, first.getId()), item(2, second.getId())).getBytes(StandardCharsets.UTF_8));
        return multipart("/api/projects/" + project.getId() + CONFIRM)
                .file(nota())
                .file(itemsPart)
                .header("Authorization", "Bearer " + tokens.generateToken(owner));
    }

    private static String item(int itemNumber, String categoryId) {
        return "{\"itemNumber\":" + itemNumber + ",\"categoryId\":\"" + categoryId + "\"}";
    }

    private static String items(String... entries) {
        return "{\"items\":[" + String.join(",", List.of(entries)) + "]}";
    }

    private MockMultipartFile nota() throws Exception {
        var bytes = new ClassPathResource("nfe/nfe-valida.xml").getContentAsByteArray();
        return new MockMultipartFile("file", "nfe-valida.xml", "application/xml", bytes);
    }

    private User user() {
        return User.builder().name("Proprietário")
                .email("nfe-supplier-" + UUID.randomUUID() + "@example.com")
                .password("unused-password").userRole(UserRole.USER).build();
    }

    @AfterEach
    void removeOnlyThisFixture() {
        if (owner == null) return;
        jdbc.update("delete from pending_payments where expense_id in "
                + "(select id from expenses where user_id=?)", owner.getId());
        jdbc.update("delete from expenses where user_id=?", owner.getId());
        jdbc.update("delete from budgets where project_id in (select id from projects where user_id=?)", owner.getId());
        jdbc.update("delete from projects where user_id=?", owner.getId());
        jdbc.update("delete from suppliers where user_id=?", owner.getId());
        users.deleteById(owner.getId());
    }
}
