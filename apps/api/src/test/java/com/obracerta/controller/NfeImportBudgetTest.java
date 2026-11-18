package com.obracerta.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.obracerta.configuration.security.TokenService;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.model.entity.Budget;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.BudgetRepository;
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

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// CA7: a importação confirmada grava as despesas mesmo estourando o teto e o painel
// de orçamento passa a mostrar a categoria como estourada.
@SpringBootTest(properties = "api.security.token.secret=nfe-budget-test-secret")
@ActiveProfiles("test")
@AutoConfigureMockMvc
class NfeImportBudgetTest {

    private static final String CONFIRM = "/nfe/imports";
    private static final String ITEM_ONE_DESCRIPTION = "Cimento CP-II 50kg";
    private static final String ITEM_ONE_TOTAL = "325.00";

    @Autowired private MockMvc mvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private ObjectMapper json;
    @Autowired private UserRepository users;
    @Autowired private ProjectRepository projects;
    @Autowired private ExpenseCategoryRepository categories;
    @Autowired private BudgetRepository budgets;
    @Autowired private TokenService tokens;
    @MockBean private ReceiptStorage storage;

    private User owner;
    private Project project;
    private ExpenseCategory first;
    private ExpenseCategory second;

    @BeforeEach
    void persistProjectWithLowCeiling() {
        owner = users.saveAndFlush(user());
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        var all = categories.findAll();
        assertThat(all.size()).isGreaterThanOrEqualTo(2);
        first = all.get(0);
        second = all.get(1);
        // O item 1 (325,00) estoura o teto de 100,00; o item 2 (300,00) fica dentro de 1.000,00.
        budgets.saveAndFlush(Budget.builder().user(owner).project(project).category(first)
                .estimatedAmount(new BigDecimal("100.00")).build());
        budgets.saveAndFlush(Budget.builder().user(owner).project(project).category(second)
                .estimatedAmount(new BigDecimal("1000.00")).build());
    }

    @Test
    void importacaoQueEstouraTetoGravaDespesasEPainelMostraCategoriaEstourada() throws Exception {
        mvc.perform(confirm()).andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(2));

        assertThat(jdbc.queryForObject("select count(*) from expenses where project_id = ?",
                Long.class, project.getId())).isEqualTo(2L);
        assertThat(jdbc.queryForObject("select total_price from expenses where project_id = ? and description = ?",
                BigDecimal.class, project.getId(), ITEM_ONE_DESCRIPTION))
                .isEqualByComparingTo(ITEM_ONE_TOTAL);

        var body = mvc.perform(get("/api/budgets").param("projectId", project.getId())
                        .header("Authorization", "Bearer " + tokens.generateToken(owner)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode overview = json.readTree(body);

        assertThat(overview.get("projectId").asText()).isEqualTo(project.getId());
        assertThat(overview.get("exceededCategories").asInt()).isEqualTo(1);

        JsonNode exceeded = category(overview, first.getId());
        assertThat(exceeded).as("categoria do item que estourou o teto").isNotNull();
        assertThat(exceeded.get("state").asText()).isEqualTo("EXCEEDED");
        assertThat(exceeded.get("spentAmount").decimalValue()).isEqualByComparingTo(ITEM_ONE_TOTAL);
        assertThat(exceeded.get("plannedAmount").decimalValue()).isEqualByComparingTo("100.00");

        JsonNode withinCeiling = category(overview, second.getId());
        assertThat(withinCeiling.get("state").asText()).isEqualTo("ON_TRACK");
    }

    private static JsonNode category(JsonNode overview, String categoryId) {
        for (JsonNode node : overview.get("categories")) {
            if (node.get("categoryId").asText().equals(categoryId)) return node;
        }
        return null;
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
                .email("nfe-budget-" + UUID.randomUUID() + "@example.com")
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
