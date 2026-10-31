package com.obracerta.controller;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.obracerta.configuration.security.TokenService;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.model.dto.AuthDTO;
import com.obracerta.model.dto.RegisterUserDTO;
import com.obracerta.model.entity.Budget;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "api.security.token.secret=budget-auth-integration-test-secret")
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
class BudgetAuthenticationIntegrationTest {

    private static final String PASSWORD = "senha-segura";
    private static final String TOKEN_SECRET = "budget-auth-integration-test-secret";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private BudgetRepository budgetRepository;
    @Autowired private ExpenseCategoryRepository categoryRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TokenService tokenService;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private EntityManager entityManager;

    private User owner;
    private Project project;
    private String categoryId;
    private String newCategoryId;

    enum Operation { READ, CREATE, UPDATE, ZERO }
    enum Credential { MISSING, INVALID, EXPIRED }

    @BeforeEach
    void persistBudget() {
        owner = userRepository.saveAndFlush(User.builder()
                .name("Proprietário")
                .email("budget-auth-" + UUID.randomUUID() + "@example.com")
                .password(passwordEncoder.encode(PASSWORD))
                .userRole(UserRole.USER)
                .build());
        project = projectRepository.saveAndFlush(Project.builder()
                .user(owner).name("Obra autenticada").type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS).build());
        var categories = categoryRepository.findAll();
        categoryId = categories.get(0).getId();
        newCategoryId = categories.get(1).getId();
        budgetRepository.saveAndFlush(Budget.builder()
                .user(owner).project(project).category(categories.get(0))
                .estimatedAmount(new BigDecimal("100.00")).build());
    }

    @ParameterizedTest
    @EnumSource(Operation.class)
    void expiredJwtReturns401WithoutWriting(Operation operation) throws Exception {
        String expired = expiredToken();
        assertThat(JWT.decode(expired).getExpiresAtAsInstant()).isBefore(Instant.now());
        assertThat(tokenService.validateToken(expired)).isEmpty();
        assertUnauthorizedWithoutWriting(operation, expired);
    }

    @ParameterizedTest
    @EnumSource(Operation.class)
    void missingJwtReturns401WithoutWriting(Operation operation) throws Exception {
        assertUnauthorizedWithoutWriting(operation, null);
    }

    @ParameterizedTest
    @EnumSource(Operation.class)
    void invalidJwtReturns401WithoutWriting(Operation operation) throws Exception {
        assertUnauthorizedWithoutWriting(operation, "invalid-token");
    }

    @ParameterizedTest
    @EnumSource(Operation.class)
    void validJwtAllowsBudgetOperations(Operation operation) throws Exception {
        mockMvc.perform(request(operation)
                        .header("Authorization", "Bearer " + tokenService.generateToken(owner)))
                .andExpect(status().isOk());
        entityManager.flush();
        entityManager.clear();
        var budgets = budgetRepository.findByProjectIdAndDeletedAtIsNull(project.getId());
        assertThat(budgets).hasSize(operation == Operation.CREATE ? 2 : 1);
        String affectedCategory = operation == Operation.CREATE ? newCategoryId : categoryId;
        BigDecimal expected = switch (operation) {
            case READ -> new BigDecimal("100.00");
            case CREATE, UPDATE -> new BigDecimal("250.00");
            case ZERO -> BigDecimal.ZERO;
        };
        assertThat(budgets.stream().filter(b -> b.getCategory().getId().equals(affectedCategory))
                .findFirst().orElseThrow().getEstimatedAmount()).isEqualByComparingTo(expected);
    }

    @Test
    void authenticatedUserWithoutAdminPermissionStillReceives403() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + tokenService.generateToken(owner)))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminStillHasAccessToAuthorizedRoute() throws Exception {
        owner.setUserRole(UserRole.ADMIN);
        userRepository.saveAndFlush(owner);
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + tokenService.generateToken(owner)))
                .andExpect(status().isOk());
    }

    @ParameterizedTest
    @EnumSource(Credential.class)
    void publicLoginAcceptsCredentialsWithoutAValidSession(Credential credential) throws Exception {
        var request = post("/api/auth/login").contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new AuthDTO(owner.getEmail(), PASSWORD)));
        switch (credential) {
            case MISSING -> { }
            case INVALID -> request.header("Authorization", "Bearer invalid-token");
            case EXPIRED -> request.header("Authorization", "Bearer " + expiredToken());
        }
        var result = mockMvc.perform(request).andExpect(status().isOk()).andReturn();
        String token = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        assertThat(tokenService.validateToken(token)).isEqualTo(owner.getEmail());
    }

    @Test
    void registrationRemainsPublic() throws Exception {
        String email = "budget-register-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/auth/register").contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterUserDTO("Novo usuário", email, PASSWORD))))
                .andExpect(status().isOk());
        assertThat(userRepository.findByEmail(email)).isPresent();
    }

    private void assertUnauthorizedWithoutWriting(Operation operation, String token) throws Exception {
        List<Map<String, Object>> before = persistedBudgets();
        var request = request(operation);
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        var result = mockMvc.perform(request).andReturn();
        entityManager.flush();
        assertThat(persistedBudgets()).as("Autenticação recusada não altera nem cria orçamento").isEqualTo(before);
        assertThat(result.getResponse().getStatus()).isEqualTo(401);
    }

    private List<Map<String, Object>> persistedBudgets() {
        return jdbcTemplate.queryForList("select * from budgets where project_id = ? order by id", project.getId());
    }

    private String expiredToken() {
        return JWT.create().withIssuer("obra-certa").withSubject(owner.getEmail())
                .withExpiresAt(Instant.now().minusSeconds(60)).sign(Algorithm.HMAC256(TOKEN_SECRET));
    }

    private MockHttpServletRequestBuilder request(Operation operation) {
        String path = "/api/budgets/" + project.getId() + "/categories/";
        return switch (operation) {
            case READ -> get("/api/budgets").param("projectId", project.getId());
            case CREATE -> put(path + newCategoryId).contentType(APPLICATION_JSON).content("{\"estimatedAmount\":250.00}");
            case UPDATE -> put(path + categoryId).contentType(APPLICATION_JSON).content("{\"estimatedAmount\":250.00}");
            case ZERO -> post(path + categoryId + "/zero");
        };
    }
}
