package com.obracerta.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.*;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;

@SpringBootTest @ActiveProfiles("test") @AutoConfigureMockMvc(addFilters=false)
@Transactional
class ExpenseRegistrationIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseCategoryRepository categories;
    @Autowired ExpenseRepository expenses;
    @Autowired SupplierRepository suppliers;
    @Autowired JdbcTemplate jdbc;
    @MockBean UserContextHelper identity;
    User owner, other;
    Project project;
    String categoryId;
    @BeforeEach void setup() {
        owner = user(); other = user();
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa").type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS).build());
        categoryId = categories.findAll().getFirst().getId();
    }
    User user() { return users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID()+"@test.local")
            .password("test").userRole(UserRole.USER).build()); }
    ObjectNode body() {
        var body = json.createObjectNode().put("projectId",project.getId()).put("categoryId",categoryId)
                .put("description","Cimento").put("purchaseDate","2030-01-01").put("paid",true)
                .put("valueMode","DIRECT").put("totalPrice",100.25);
        body.putObject("newSupplier").put("name","Loja").put("document","12.345.678/0001-90");
        return body;
    }
    String create(ObjectNode body) throws Exception {
        var response = mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isCreated()).andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.paid").value(true)).andReturn().getResponse();
        String id = json.readTree(response.getContentAsString()).get("id").asText();
        assertThat(response.getHeader("Location")).isEqualTo("/api/expenses/"+id);
        return id;
    }
    @Test void persistsInlineSupplierExpenseAndBudgetAggregateThenReadsActualIndividualResource() throws Exception {
        String id = create(body());
        mvc.perform(get("/api/expenses/"+id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Cimento"))
                .andExpect(jsonPath("$.supplier.document").value("12345678000190"))
                .andExpect(jsonPath("$.totalPrice").value(100.25));
        mvc.perform(get("/api/suppliers")).andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("Loja"));
        mvc.perform(get("/api/budgets").param("projectId",project.getId())).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSpent").value(100.25));
        assertThat(jdbc.queryForObject("select paid from expenses where id=?", Boolean.class,id)).isTrue();
        assertThat(jdbc.queryForObject("select count(*) from pending_payments where expense_id=?",Integer.class,id)).isZero();
        var existing = body(); existing.remove("newSupplier");
        existing.put("supplierId",jdbc.queryForObject("select supplier_id from expenses where id=?",String.class,id));
        create(existing);
        assertThat(suppliers.count()).isEqualTo(1);
    }
    @Test void calculatesRoundedTotalAndAcceptsPastDate() throws Exception {
        var body = body().put("valueMode","CALCULATED").put("quantity",1.5).put("unitPrice",1.01)
                .put("totalPrice",999).put("purchaseDate","2000-01-01");
        String id = create(body);
        mvc.perform(get("/api/expenses/"+id)).andExpect(status().isOk()).andExpect(jsonPath("$.totalPrice").value(1.52));
    }
    @ParameterizedTest @ValueSource(strings={"description","categoryId","purchaseDate","newSupplier","totalPrice"})
    void rejectsMissingFieldsWithoutOrphanSupplier(String field) throws Exception {
        long count = suppliers.count(); var body = body(); body.remove(field);
        mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString())).andExpect(status().isBadRequest());
        assertThat(suppliers.count()).isEqualTo(count); assertThat(expenses.count()).isZero();
    }
    @Test void invalidCategoryOrForeignProjectNeverCreatesInlineSupplier() throws Exception {
        for (String field : java.util.List.of("categoryId","projectId")) {
            var body = body().put(field,"unknown");
            mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString()))
                    .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value(
                            field.equals("categoryId") ? "Categoria não encontrada" : "Projeto não encontrado"));
        }
        assertThat(suppliers.count()).isZero(); assertThat(expenses.count()).isZero();
    }
    @Test void ownerFiltersForeignSupplierExpenseAndDeletedProjectAndExpense() throws Exception {
        String id = create(body());
        expenses.flush();
        String supplierId = jdbc.queryForObject("select supplier_id from expenses where id=?",String.class,id);
        when(identity.getAuthenticatedUser()).thenReturn(other);
        mvc.perform(get("/api/expenses/"+id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/suppliers")).andExpect(status().isOk()).andExpect(content().json("[]"));
        Project otherProject = projects.saveAndFlush(Project.builder().user(other).name("Outra").type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS).build());
        var body = body().put("projectId",otherProject.getId()).put("supplierId",supplierId); body.remove("newSupplier");
        mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString())).andExpect(status().isNotFound());
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        jdbc.update("update expenses set deleted_at=now() where id=?",id);
        mvc.perform(get("/api/expenses/"+id)).andExpect(status().isNotFound());
        jdbc.update("update projects set deleted_at=now() where id=?",project.getId());
        mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body().toString())).andExpect(status().isNotFound());
    }
    @Test void rejectsAmbiguousSupplierAndUnpaidUntilPendingPaymentTask() throws Exception {
        for (var body : java.util.List.of(body().put("supplierId","any"),body().put("paid",false))) {
            mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString())).andExpect(status().isBadRequest());
        }
        assertThat(suppliers.count()).isZero();
    }
}
