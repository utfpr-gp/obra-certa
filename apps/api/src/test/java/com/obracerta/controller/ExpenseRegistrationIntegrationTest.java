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
import org.junit.jupiter.params.provider.CsvSource;
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
    @Autowired BudgetRepository budgets;
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
    @ParameterizedTest @ValueSource(strings={"omitted", "null", "", "   \t"})
    void acceptsMissingCnpjAsNullAndCreatesSeparateInlineSuppliers(String document) throws Exception {
        var payload = body();
        var input = (ObjectNode) payload.get("newSupplier");
        if (document.equals("omitted")) input.remove("document");
        else if (document.equals("null")) input.putNull("document");
        else input.put("document", document);
        String first = create(payload);
        input.put("name", "Outra loja sem CNPJ");
        String second = create(payload);
        expenses.flush();
        String firstSupplier = jdbc.queryForObject("select supplier_id from expenses where id=?",String.class,first);
        String secondSupplier = jdbc.queryForObject("select supplier_id from expenses where id=?",String.class,second);
        assertThat(secondSupplier).isNotEqualTo(firstSupplier);
        for (String supplier : java.util.List.of(firstSupplier,secondSupplier))
            assertThat(jdbc.queryForObject("select document from suppliers where id=?",String.class,supplier)).isNull();
        mvc.perform(get("/api/expenses/"+second)).andExpect(status().isOk())
                .andExpect(jsonPath("$.supplier.name").value("Outra loja sem CNPJ"))
                .andExpect(jsonPath("$.supplier.document").value(org.hamcrest.Matchers.nullValue()));
        mvc.perform(get("/api/suppliers")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
    }
    @ParameterizedTest @ValueSource(strings={"123", "12.345.678/0001-9", "123456780001900", "./-", "abc", "1234567800019a"})
    void rejectsFilledInvalidCnpjWithoutAnyWrite(String document) throws Exception {
        var payload = body(); ((ObjectNode) payload.get("newSupplier")).put("document",document);
        long supplierCount = suppliers.count(); long expenseCount = expenses.count();
        mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(payload.toString()))
                .andExpect(status().isBadRequest());
        assertThat(suppliers.count()).isEqualTo(supplierCount); assertThat(expenses.count()).isEqualTo(expenseCount);
    }
    @Test void normalizesFilledCnpjAndReusesOnlyItsOwnersMatchingSupplier() throws Exception {
        long suppliersBefore = suppliers.count();
        String first = create(body());
        var payload = body(); ((ObjectNode) payload.get("newSupplier")).put("document","12345678000190");
        String second = create(payload); expenses.flush();
        assertThat(jdbc.queryForObject("select supplier_id from expenses where id=?",String.class,first))
                .isEqualTo(jdbc.queryForObject("select supplier_id from expenses where id=?",String.class,second));
        assertThat(suppliers.count()).isEqualTo(suppliersBefore + 1);
    }
    @Test void persistsInTheValidatedPayloadProjectWhenAnotherProjectIsSelectedForTheNextOperation() throws Exception {
        Project original = project;
        ObjectNode originalPayload = body();
        project = projects.saveAndFlush(Project.builder().user(owner).name("Outra obra")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());

        String id = create(originalPayload);
        expenses.flush();
        assertThat(jdbc.queryForObject("select project_id from expenses where id=?", String.class, id))
                .isEqualTo(original.getId());
        mvc.perform(get("/api/expenses/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.projectId").value(original.getId()));
        assertThat(jdbc.queryForObject("select count(*) from expenses where project_id=?", Integer.class,
                project.getId())).isZero();
        String next = create(body());
        expenses.flush();
        assertThat(jdbc.queryForObject("select project_id from expenses where id=?", String.class, next))
                .isEqualTo(project.getId());
    }
    @ParameterizedTest
    @CsvSource({"29.96,99.96,WARNING", "30.00,100.00,EXCEEDED", "30.01,100.01,EXCEEDED"})
    void savedExpenseUpdatesExactBudgetStateCountingOnlyActiveExpensesOfItsCategoryAndProject(
            String amount, String expectedSpent, String state) throws Exception {
        budgets.saveAndFlush(Budget.builder().user(owner).project(project)
                .category(categories.findById(categoryId).orElseThrow())
                .estimatedAmount(new java.math.BigDecimal("100.00")).build());
        create(body().put("totalPrice",30));
        mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body().put("totalPrice",40)
                        .put("paid",false).put("dueDate","2030-01-01").toString()))
                .andExpect(status().isCreated());
        String deleted = create(body().put("totalPrice",100));
        expenses.flush();
        jdbc.update("update expenses set deleted_at=now() where id=?",deleted);
        String otherCategory = categories.findAll().stream().map(ExpenseCategory::getId)
                .filter(id -> !id.equals(categoryId)).findFirst().orElseThrow();
        create(body().put("categoryId",otherCategory).put("totalPrice",500));
        Project otherProject = projects.saveAndFlush(Project.builder().user(owner).name("Outra obra")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        create(body().put("projectId",otherProject.getId()).put("totalPrice",600));

        String saved = create(body().put("totalPrice",new java.math.BigDecimal(amount)));
        mvc.perform(get("/api/expenses/"+saved)).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPrice").value(Double.parseDouble(amount)));
        var overview = mvc.perform(get("/api/budgets").param("projectId",project.getId()))
                .andExpect(status().isOk()).andReturn().getResponse();
        var category = java.util.stream.StreamSupport.stream(
                json.readTree(overview.getContentAsString()).get("categories").spliterator(),false)
                .filter(row -> row.get("categoryId").asText().equals(categoryId)).findFirst().orElseThrow();
        assertThat(category.get("spentAmount").decimalValue()).isEqualByComparingTo(expectedSpent);
        assertThat(category.get("state").asText()).isEqualTo(state);
        // The rounded display percentage must not decide whether the ceiling was reached.
        assertThat(category.get("percentage").decimalValue()).isEqualByComparingTo("100.0");
    }
    @Test void savesWithoutBudgetWithoutCreatingAnArtificialCeiling() throws Exception {
        String id = create(body());
        expenses.flush();
        assertThat(jdbc.queryForObject("select budget_id from expenses where id=?", String.class, id)).isNull();
        assertThat(jdbc.queryForObject("select count(*) from budgets where project_id=?", Integer.class,
                project.getId())).isZero();
        mvc.perform(get("/api/budgets").param("projectId",project.getId())).andExpect(status().isOk())
                .andExpect(jsonPath("$.categories[0].hasBudget").value(false))
                .andExpect(jsonPath("$.categories[0].plannedAmount").value(0))
                .andExpect(jsonPath("$.categories[0].state").value("NO_BUDGET"))
                .andExpect(jsonPath("$.categories[0].spentAmount").value(100.25));
    }
    @Test void savesWithZeroBudgetWithoutIncreasingOrDuplicatingTheCeiling() throws Exception {
        Budget budget = budgets.saveAndFlush(Budget.builder().user(owner).project(project)
                .category(categories.findById(categoryId).orElseThrow())
                .estimatedAmount(java.math.BigDecimal.ZERO).build());
        String id = create(body());
        expenses.flush();
        assertThat(jdbc.queryForObject("select budget_id from expenses where id=?", String.class,id))
                .isEqualTo(budget.getId());
        assertThat(jdbc.queryForObject("select count(*) from budgets where project_id=?", Integer.class,
                project.getId())).isEqualTo(1);
        assertThat(jdbc.queryForObject("select estimated_amount from budgets where id=?",
                java.math.BigDecimal.class,budget.getId())).isZero();
        mvc.perform(get("/api/budgets").param("projectId",project.getId())).andExpect(status().isOk())
                .andExpect(jsonPath("$.categories[0].hasBudget").value(true))
                .andExpect(jsonPath("$.categories[0].plannedAmount").value(0))
                .andExpect(jsonPath("$.categories[0].state").value("NO_BUDGET"))
                .andExpect(jsonPath("$.categories[0].spentAmount").value(100.25));
    }
    @Test void persistsInlineSupplierExpenseAndBudgetAggregateThenReadsActualIndividualResource() throws Exception {
        long suppliersBefore = suppliers.count();
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
        assertThat(suppliers.count()).isEqualTo(suppliersBefore + 1);
    }
    @Test void calculatesRoundedTotalAndAcceptsPastDate() throws Exception {
        var body = body().put("valueMode","CALCULATED").put("quantity",1.5).put("unitPrice",1.01)
                .put("totalPrice",999).put("purchaseDate","2000-01-01");
        String id = create(body);
        mvc.perform(get("/api/expenses/"+id)).andExpect(status().isOk()).andExpect(jsonPath("$.totalPrice").value(1.52));
    }
    @ParameterizedTest @ValueSource(strings={"description","categoryId","purchaseDate","newSupplier","totalPrice"})
    void rejectsMissingFieldsWithoutOrphanSupplier(String field) throws Exception {
        long suppliersBefore = suppliers.count();
        long expensesBefore = expenses.count();
        var body = body(); body.remove(field);
        mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString())).andExpect(status().isBadRequest());
        assertThat(suppliers.count()).isEqualTo(suppliersBefore);
        assertThat(expenses.count()).isEqualTo(expensesBefore);
    }
    @Test void invalidCategoryOrForeignProjectNeverCreatesInlineSupplier() throws Exception {
        long suppliersBefore = suppliers.count();
        long expensesBefore = expenses.count();
        for (String field : java.util.List.of("categoryId","projectId")) {
            var body = body().put(field,"unknown");
            mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString()))
                    .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value(
                            field.equals("categoryId") ? "Categoria não encontrada" : "Projeto não encontrado"));
        }
        assertThat(suppliers.count()).isEqualTo(suppliersBefore);
        assertThat(expenses.count()).isEqualTo(expensesBefore);
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
    @Test void rejectsAmbiguousSupplierAndUnpaidWithoutDueDate() throws Exception {
        long suppliersBefore = suppliers.count();
        long expensesBefore = expenses.count();
        for (var body : java.util.List.of(body().put("supplierId","any"),body().put("paid",false))) {
            mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString())).andExpect(status().isBadRequest());
        }
        assertThat(suppliers.count()).isEqualTo(suppliersBefore);
        assertThat(expenses.count()).isEqualTo(expensesBefore);
    }
}
