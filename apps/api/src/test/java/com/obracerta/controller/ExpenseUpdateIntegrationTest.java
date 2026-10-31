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
import java.math.BigDecimal;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;

@SpringBootTest @ActiveProfiles("test") @AutoConfigureMockMvc(addFilters=false) @Transactional
class ExpenseUpdateIntegrationTest {
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
    User owner;
    Project project;
    Expense expense;
    ExpenseCategory destination;
    @BeforeEach void setup() {
        owner=user(); when(identity.getAuthenticatedUser()).thenReturn(owner);
        project=projects.saveAndFlush(Project.builder().user(owner).name("Casa").type(ProjectType.RENOVATION)
            .status(ProjectStatus.IN_PROGRESS).build());
        var category=categories.findAll().getFirst();
        destination=categories.findAll().stream().filter(c -> !c.getId().equals(category.getId())).findFirst().orElseThrow();
        var supplier=suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja").build());
        expense=expenses.saveAndFlush(Expense.builder().user(owner).project(project).supplier(supplier).category(category)
            .description("Original").purchaseDate(java.time.LocalDate.parse("2030-01-01")).totalPrice(new BigDecimal("40.00")).build());
    }
    User user() { return users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID()+"@test.local")
        .password("test").userRole(UserRole.USER).build()); }
    ObjectNode body() { return json.createObjectNode().put("description","Corrigida").put("purchaseDate","2030-01-02")
        .put("categoryId",destination.getId()).put("valueMode","DIRECT").put("totalPrice",100.25); }
    void update(ObjectNode body, int status) throws Exception {
        mvc.perform(put("/api/expenses/"+expense.getId()).contentType(APPLICATION_JSON).content(body.toString()))
            .andExpect(status().is(status));
    }
    @Test void updatesSameRowAndReclassifiesAggregateWithoutChangingCeilingsOrProtectedFields() throws Exception {
        for (var category : java.util.List.of(expense.getCategory(),destination))
            budgets.saveAndFlush(Budget.builder().user(owner).project(project).category(category).estimatedAmount(new BigDecimal("100")).build());
        long count=expenses.count(); String supplier=expense.getSupplier().getId();
        update(body().put("projectId","another").put("supplierId","another").put("paid",false).put("receiptState","UPLOADED"),200);
        expenses.flush();
        assertThat(expenses.count()).isEqualTo(count);
        assertThat(expense.getProject().getId()).isEqualTo(project.getId());
        assertThat(expense.getSupplier().getId()).isEqualTo(supplier);
        assertThat(expense.isPaid()).isTrue(); assertThat(expense.getReceiptState()).isEqualTo("NONE");
        assertThat(expense.getBudget().getCategory().getId()).isEqualTo(destination.getId());
        mvc.perform(get("/api/expenses/"+expense.getId())).andExpect(jsonPath("$.description").value("Corrigida"))
            .andExpect(jsonPath("$.purchaseDate").value("2030-01-02"));
        var result=mvc.perform(get("/api/budgets").param("projectId",project.getId())).andExpect(status().isOk()).andReturn();
        var rows=json.readTree(result.getResponse().getContentAsString()).get("categories");
        for (var row : rows) {
            assertThat(row.get("plannedAmount").decimalValue()).isEqualByComparingTo("100");
            assertThat(row.get("spentAmount").decimalValue()).isEqualByComparingTo(row.get("categoryId").asText().equals(destination.getId()) ? "100.25" : "0");
        }
    }
    @Test void calculatesHalfUpAndClearsCalculatedFieldsWhenReturningToDirect() throws Exception {
        update(body().put("valueMode","CALCULATED").put("quantity",1.5).put("unitPrice",1.01),200);
        assertThat(expense.getTotalPrice()).isEqualByComparingTo("1.52"); assertThat(expense.getBudget()).isNull();
        update(body(),200); assertThat(expense.getQuantity()).isNull(); assertThat(expense.getUnitPrice()).isNull();
    }
    @ParameterizedTest @ValueSource(strings={"description","categoryId","purchaseDate","valueMode","totalPrice"})
    void rejectsMissingRequiredFieldsAtomically(String field) throws Exception {
        var body=body(); body.remove(field); update(body,400); assertOriginal();
    }
    @ParameterizedTest @ValueSource(strings={"0","-1","0.001","10000000000000"})
    void rejectsInvalidDirectValues(String amount) throws Exception { update(body().put("totalPrice",new BigDecimal(amount)),400); assertOriginal(); }
    @ParameterizedTest @ValueSource(strings={"0","-1","0.001","100000000"})
    void rejectsInvalidCalculatedValues(String amount) throws Exception {
        update(body().put("valueMode","CALCULATED").put("quantity",new BigDecimal(amount)).put("unitPrice",1),400); assertOriginal();
    }
    @Test void rejectsOverflowingProductAndUnknownCategoryWithoutPartialChanges() throws Exception {
        update(body().put("valueMode","CALCULATED").put("quantity",99999999).put("unitPrice",9999999999999L),400); assertOriginal();
        update(body().put("categoryId","missing"),404); assertOriginal();
    }
    @Test void validatesExistingPendingDueDateAndAllowsEquality() throws Exception {
        expense.setPaid(false); expense.setPendingPayment(PendingPayment.builder().expense(expense).dueDate(java.time.LocalDate.parse("2030-01-02")).build());
        expenses.saveAndFlush(expense);
        update(body().put("purchaseDate","2030-01-03"),400); assertOriginal();
        update(body(),200); assertThat(expense.isPaid()).isFalse();
        assertThat(expense.getPendingPayment().getDueDate()).isEqualTo(java.time.LocalDate.parse("2030-01-02"));
    }
    @ParameterizedTest @ValueSource(strings={"foreign","deletedExpense","deletedProject","foreignProject","missing"})
    void inaccessibleResourcesReturn404WithoutWriting(String state) throws Exception {
        if (state.equals("foreign")) when(identity.getAuthenticatedUser()).thenReturn(user());
        if (state.equals("deletedExpense")) expense.setDeletedAt(java.time.Instant.now());
        if (state.equals("deletedProject")) project.setDeletedAt(java.time.Instant.now());
        if (state.equals("foreignProject")) project.setUser(user());
        expenses.flush(); projects.flush();
        String id=state.equals("missing") ? "missing" : expense.getId();
        mvc.perform(put("/api/expenses/"+id).contentType(APPLICATION_JSON).content(body().toString())).andExpect(status().isNotFound());
        assertOriginal();
    }
    void assertOriginal() { expenses.flush(); assertThat(jdbc.queryForObject("select description from expenses where id=?",String.class,expense.getId())).isEqualTo("Original");
        assertThat(jdbc.queryForObject("select total_price from expenses where id=?",BigDecimal.class,expense.getId())).isEqualByComparingTo("40"); }
}
