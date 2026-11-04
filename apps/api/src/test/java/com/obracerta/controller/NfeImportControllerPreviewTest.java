package com.obracerta.controller;

import com.obracerta.configuration.security.TokenService;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.model.entity.Expense;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.Supplier;
import com.obracerta.model.entity.User;
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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Preview é leitura: nada é gravado e o storage nunca é tocado. Segurança real (401 exige a cadeia).
@SpringBootTest(properties = "api.security.token.secret=nfe-preview-test-secret")
@ActiveProfiles("test")
@AutoConfigureMockMvc
class NfeImportControllerPreviewTest {

    private static final String ACCESS_KEY = "35261012345678000190550010000000011000000012";
    private static final String NOT_FOUND_MESSAGE = "Projeto não encontrado";
    private static final String ALREADY_REGISTERED_MESSAGE = "A nota fiscal já foi registrada";

    @Autowired private MockMvc mvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private UserRepository users;
    @Autowired private ProjectRepository projects;
    @Autowired private ExpenseCategoryRepository categories;
    @Autowired private SupplierRepository suppliers;
    @Autowired private ExpenseRepository expenses;
    @Autowired private TokenService tokens;
    @MockBean private ReceiptStorage storage;

    private User owner;
    private User other;
    private Project project;

    @BeforeEach
    void persistOwnerAndProject() {
        owner = users.saveAndFlush(user());
        other = users.saveAndFlush(user());
        project = projects.saveAndFlush(project(owner));
    }

    @Test
    void preview200ComPayloadDaNotaValida() throws Exception {
        var before = expenseCount();

        mvc.perform(preview(project.getId(), "nfe-valida.xml", owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(project.getId()))
                .andExpect(jsonPath("$.accessKey").value(ACCESS_KEY))
                .andExpect(jsonPath("$.issueDate").value("2026-10-15"))
                .andExpect(jsonPath("$.supplier.name").value("Construções Exemplo Materiais Ltda"))
                .andExpect(jsonPath("$.supplier.document").value("12345678000190"))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].itemNumber").value(1))
                .andExpect(jsonPath("$.items[0].description").value("Cimento CP-II 50kg"))
                .andExpect(jsonPath("$.items[0].quantity").value(10.0))
                .andExpect(jsonPath("$.items[0].unit").value("SC"))
                .andExpect(jsonPath("$.items[0].unitPrice").value(32.5))
                .andExpect(jsonPath("$.items[0].totalPrice").value(325.0))
                .andExpect(jsonPath("$.items[1].description").value("Areia média lavada"))
                .andExpect(jsonPath("$.total").value(625.0));

        assertThat(expenseCount()).isEqualTo(before);
        verifyNoInteractions(storage);
    }

    @Test
    void preview400ComXmlCorrompido() throws Exception {
        var before = expenseCount();

        mvc.perform(preview(project.getId(), "nfe-corrompida.xml", owner))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/api/projects/" + project.getId() + "/nfe/preview"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("corrompido")));

        assertThat(expenseCount()).isEqualTo(before);
        verifyNoInteractions(storage);
    }

    @Test
    void preview400ComMotivoQuandoODocumentoNaoEhNfe() throws Exception {
        var before = expenseCount();

        mvc.perform(preview(project.getId(), "nfe-outro-documento.xml", owner))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/api/projects/" + project.getId() + "/nfe/preview"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("não é NF-e")));

        assertThat(expenseCount()).isEqualTo(before);
        verifyNoInteractions(storage);
    }

    @Test
    void preview409QuandoAChaveJaEstaAtivaNaObra() throws Exception {
        var supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja").build());
        expenses.saveAndFlush(Expense.builder().project(project).user(owner)
                .category(categories.findAll().getFirst()).supplier(supplier)
                .type("MATERIAL").description("Cimento").nfeKey(ACCESS_KEY).build());
        var before = expenseCount();

        mvc.perform(preview(project.getId(), "nfe-valida.xml", owner))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(ALREADY_REGISTERED_MESSAGE));

        assertThat(expenseCount()).isEqualTo(before);
        verifyNoInteractions(storage);
    }

    @Test
    void preview404ParaObraDeOutroProprietario() throws Exception {
        var before = expenseCount();

        mvc.perform(preview(project.getId(), "nfe-valida.xml", other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(NOT_FOUND_MESSAGE));

        assertThat(expenseCount()).isEqualTo(before);
        verifyNoInteractions(storage);
    }

    @Test
    void preview404ParaObraAlheiaAntesDeLerOXml() throws Exception {
        var before = expenseCount();

        mvc.perform(preview(project.getId(), "nfe-corrompida.xml", other))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(NOT_FOUND_MESSAGE));

        assertThat(expenseCount()).isEqualTo(before);
        verifyNoInteractions(storage);
    }

    @Test
    void preview404ParaObraExcluida() throws Exception {
        var deleted = projects.saveAndFlush(project(owner));
        jdbc.update("update projects set deleted_at=now() where id=?", deleted.getId());
        var before = expenseCount();

        mvc.perform(multipart("/api/projects/" + deleted.getId() + "/nfe/preview")
                        .file(nota("nfe-valida.xml"))
                        .header("Authorization", "Bearer " + tokens.generateToken(owner)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(NOT_FOUND_MESSAGE));

        assertThat(expenseCount()).isEqualTo(before);
        verifyNoInteractions(storage);
    }

    @Test
    void preview401SemToken() throws Exception {
        var before = expenseCount();

        // O entry point do projeto (HttpStatusEntryPoint) responde só o status, sem corpo.
        mvc.perform(multipart("/api/projects/" + project.getId() + "/nfe/preview")
                        .file(nota("nfe-valida.xml")))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(""));

        assertThat(expenseCount()).isEqualTo(before);
        verifyNoInteractions(storage);
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder preview(
            String projectId, String fixture, User user) throws Exception {
        return multipart("/api/projects/" + projectId + "/nfe/preview")
                .file(nota(fixture))
                .header("Authorization", "Bearer " + tokens.generateToken(user));
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
                .email("nfe-preview-" + UUID.randomUUID() + "@example.com")
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
