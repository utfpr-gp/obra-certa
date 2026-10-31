package com.obracerta.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.*;
import com.obracerta.model.dto.expense.ExpenseCreateDTO;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import com.obracerta.service.ExpenseService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;

// No test-managed transaction: HTTP/service transactions must commit or roll back themselves.
@SpringBootTest @ActiveProfiles("test") @AutoConfigureMockMvc(addFilters=false)
class PendingExpenseIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseCategoryRepository categories;
    @Autowired SupplierRepository suppliers;
    @Autowired ExpenseService service;
    @Autowired JdbcTemplate jdbc;
    @SpyBean ExpenseRepository expenses;
    @MockBean UserContextHelper identity;
    User owner, other;
    Project project;
    String categoryId;

    @BeforeEach void setup() {
        owner=user(); other=user();
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        project=project(owner);
        categoryId=categories.findAll().getFirst().getId();
    }
    User user() {
        return users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID()+"@test.local")
                .password("test").userRole(UserRole.USER).build());
    }
    Project project(User user) {
        return projects.saveAndFlush(Project.builder().user(user).name("Casa").type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS).build());
    }
    @AfterEach void cleanup() {
        reset(expenses);
        jdbc.update("delete from pending_payments where expense_id in (select id from expenses where user_id in (?,?))",owner.getId(),other.getId());
        jdbc.update("delete from expenses where user_id in (?,?)",owner.getId(),other.getId());
        jdbc.update("delete from suppliers where user_id in (?,?)",owner.getId(),other.getId());
        jdbc.update("delete from projects where user_id in (?,?)",owner.getId(),other.getId());
        jdbc.update("delete from users where id in (?,?)",owner.getId(),other.getId());
    }
    ObjectNode body() {
        var body=json.createObjectNode().put("projectId",project.getId()).put("categoryId",categoryId)
                .put("description","Cimento a prazo").put("purchaseDate","2030-01-01").put("paid",false)
                .put("dueDate","2030-01-01").put("valueMode","DIRECT").put("totalPrice",100.25);
        body.putObject("newSupplier").put("name","Loja").put("document","12345678000190");
        return body;
    }
    @ParameterizedTest @ValueSource(strings={"2030-01-01","2030-02-01"})
    void commitsExpenseAndLinkedPaymentAndReadsDueDate(String dueDate) throws Exception {
        var response=mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body().put("dueDate",dueDate).toString()))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.paid").value(false))
                .andExpect(jsonPath("$.dueDate").value(dueDate)).andReturn().getResponse();
        String id=json.readTree(response.getContentAsString()).get("id").asText();
        assertThat(jdbc.queryForObject("select paid from expenses where id=?",Boolean.class,id)).isFalse();
        assertThat(jdbc.queryForObject("select count(*) from pending_payments where expense_id=? and due_date=cast(? as date)",Integer.class,id,dueDate)).isEqualTo(1);
        mvc.perform(get("/api/expenses/"+id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.paid").value(false)).andExpect(jsonPath("$.dueDate").value(dueDate));
    }
    @ParameterizedTest @ValueSource(strings={"missing","2029-12-31"})
    void rejectsInvalidDueDateWithoutAnyPartialWrites(String dueDate) throws Exception {
        var body=body();
        if (dueDate.equals("missing")) body.remove("dueDate"); else body.put("dueDate",dueDate);
        mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
        assertNoFinancialWrites();
    }
    @Test void rollsBackAlreadyInsertedSupplierExpenseAndPaymentOnPersistenceFailure() throws Exception {
        doAnswer(call -> {
            Expense saved=expenses.saveAndFlush(call.getArgument(0));
            assertThat(jdbc.queryForObject("select count(*) from expenses where id=?",Integer.class,saved.getId())).isEqualTo(1);
            assertThat(jdbc.queryForObject("select count(*) from suppliers where user_id=?",Integer.class,owner.getId())).isEqualTo(1);
            assertThat(jdbc.queryForObject("select count(*) from pending_payments where expense_id=?",Integer.class,saved.getId())).isEqualTo(1);
            throw new IllegalStateException("Simulated failure after financial inserts");
        }).when(expenses).save(any(Expense.class));
        var request=json.treeToValue(body(),ExpenseCreateDTO.class);
        assertThatThrownBy(() -> service.create(request)).isInstanceOf(IllegalStateException.class)
                .hasMessage("Simulated failure after financial inserts");
        assertNoFinancialWrites();
    }
    @Test void refusesForeignProjectForeignSupplierAndDeletedProjectWithoutPayments() throws Exception {
        var foreignProject=project(other);
        var foreignSupplier=suppliers.saveAndFlush(Supplier.builder().user(other).name("Outra loja").build());
        var supplierBody=body().put("supplierId",foreignSupplier.getId()); supplierBody.remove("newSupplier");
        for (var body : java.util.List.of(body().put("projectId",foreignProject.getId()),supplierBody)) {
            mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body.toString())).andExpect(status().isNotFound());
        }
        jdbc.update("update projects set deleted_at=now() where id=?",project.getId());
        mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON).content(body().toString())).andExpect(status().isNotFound());
        assertNoFinancialWrites();
    }
    void assertNoFinancialWrites() {
        assertThat(jdbc.queryForObject("select count(*) from expenses where user_id=?",Integer.class,owner.getId())).isZero();
        assertThat(jdbc.queryForObject("select count(*) from suppliers where user_id=?",Integer.class,owner.getId())).isZero();
        assertThat(jdbc.queryForObject("select count(*) from pending_payments p join expenses e on p.expense_id=e.id where e.user_id=?",Integer.class,owner.getId())).isZero();
    }
}
