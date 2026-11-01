package com.obracerta.controller;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.obracerta.configuration.security.TokenService;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Fixtures are committed: receipt replacement and expense deletion use independent transactions.
@SpringBootTest(properties = "api.security.token.secret=expense-mutation-auth-test-secret")
@ActiveProfiles("test")
@AutoConfigureMockMvc
class ExpenseMutationAuthenticationIntegrationTest {
    private static final String TOKEN_SECRET = "expense-mutation-auth-test-secret";
    private static final byte[] REPLACEMENT = "%PDF-1.4\nreplacement\n%%EOF".getBytes(StandardCharsets.UTF_8);

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private UserRepository users;
    @Autowired private ProjectRepository projects;
    @Autowired private ExpenseCategoryRepository categories;
    @Autowired private TokenService tokens;
    @MockBean private ReceiptStorage storage;

    private User owner;
    private Project project;
    private String expenseId;
    private String categoryId;
    private String oldKey;
    private final Map<String, byte[]> objects = new HashMap<>();

    enum Operation { UPDATE, DELETE, REMOVE_RECEIPT, REPLACE_RECEIPT }

    @BeforeEach
    void persistOwnedExpenseAndPayment() throws Exception {
        owner = users.saveAndFlush(User.builder().name("Proprietário")
                .email("expense-auth-" + UUID.randomUUID() + "@example.com")
                .password("unused-password").userRole(UserRole.USER).build());
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        categoryId = categories.findAll().getFirst().getId();
        var body = json.createObjectNode().put("projectId", project.getId()).put("categoryId", categoryId)
                .put("description", "Cimento").put("purchaseDate", "2030-01-01")
                .put("paid", false).put("dueDate", "2030-01-02")
                .put("valueMode", "DIRECT").put("totalPrice", 100.25);
        body.putObject("newSupplier").put("name", "Loja");
        var response = mvc.perform(post("/api/expenses").contentType(APPLICATION_JSON)
                        .header("Authorization", "Bearer " + tokens.generateToken(owner)).content(body.toString()))
                .andExpect(status().isCreated()).andReturn().getResponse();
        expenseId = json.readTree(response.getContentAsString()).get("id").asText();
        oldKey = "expenses/" + expenseId + "/old.pdf";
        jdbc.update("update expenses set receipt_state='UPLOADED', receipt_key=?, "
                + "receipt_content_type='application/pdf', receipt_size=3 where id=?", oldKey, expenseId);
        objects.put(oldKey, new byte[]{1, 2, 3});
        doAnswer(invocation -> {
            objects.put(invocation.getArgument(0), invocation.<InputStream>getArgument(1).readAllBytes());
            return null;
        }).when(storage).put(anyString(), any(InputStream.class), anyLong(), anyString());
        doAnswer(invocation -> { objects.remove(invocation.<String>getArgument(0)); return null; })
                .when(storage).delete(anyString());
        clearInvocations(storage);
    }

    @ParameterizedTest
    @EnumSource(Operation.class)
    void missingJwtReturns401WithoutWritingOrAccessingStorage(Operation operation) throws Exception {
        assertUnauthorized(operation, null);
    }

    @ParameterizedTest
    @EnumSource(Operation.class)
    void invalidJwtReturns401WithoutWritingOrAccessingStorage(Operation operation) throws Exception {
        assertUnauthorized(operation, "invalid-token");
    }

    @ParameterizedTest
    @EnumSource(Operation.class)
    void expiredJwtReturns401WithoutWritingOrAccessingStorage(Operation operation) throws Exception {
        String expired = JWT.create().withIssuer("obra-certa").withSubject(owner.getEmail())
                .withExpiresAt(Instant.now().minusSeconds(60)).sign(Algorithm.HMAC256(TOKEN_SECRET));
        assertThat(JWT.decode(expired).getExpiresAtAsInstant()).isBefore(Instant.now());
        assertThat(tokens.validateToken(expired)).isEmpty();
        assertUnauthorized(operation, expired);
    }

    @ParameterizedTest
    @EnumSource(Operation.class)
    void validJwtAllowsTheOwnedMutation(Operation operation) throws Exception {
        var paymentsBefore = payments();
        mvc.perform(request(operation).header("Authorization", "Bearer " + tokens.generateToken(owner)))
                .andExpect(status().isOk());
        var expense = expenses().getFirst();
        var payment = payments().getFirst();
        assertThat(expenses()).hasSize(1);
        assertThat(payments()).hasSize(1);
        assertThat(payment.get("id")).isEqualTo(paymentsBefore.getFirst().get("id"));
        switch (operation) {
            case UPDATE -> {
                assertThat(expense).containsEntry("description", "Corrigida").containsEntry("paid", true);
                assertThat(payment).containsEntry("status", "PAID");
                assertThat(payment.get("paid_at")).isNotNull();
                assertThat(expense).containsEntry("receipt_key", oldKey);
                verifyNoInteractions(storage);
            }
            case DELETE -> {
                assertThat(expense.get("deleted_at")).isNotNull();
                assertThat(payment.get("deleted_at")).isEqualTo(expense.get("deleted_at"));
                verify(storage).delete(oldKey);
                assertThat(objects).isEmpty();
            }
            case REMOVE_RECEIPT -> {
                assertThat(expense).containsEntry("receipt_state", "NONE").containsEntry("receipt_key", null);
                assertThat(payments()).isEqualTo(paymentsBefore);
                verify(storage).delete(oldKey);
                assertThat(objects).isEmpty();
            }
            case REPLACE_RECEIPT -> {
                String newKey = (String) expense.get("receipt_key");
                assertThat(newKey).isNotBlank().isNotEqualTo(oldKey);
                assertThat(expense).containsEntry("receipt_state", "UPLOADED");
                assertThat(payments()).isEqualTo(paymentsBefore);
                verify(storage).put(eq(newKey), any(InputStream.class), eq((long) REPLACEMENT.length), eq("application/pdf"));
                verify(storage).delete(oldKey);
                assertThat(objects).containsOnlyKeys(newKey);
                assertThat(objects.get(newKey)).containsExactly(REPLACEMENT);
            }
        }
        verifyNoMoreInteractions(storage);
    }

    private void assertUnauthorized(Operation operation, String token) throws Exception {
        var expensesBefore = expenses();
        var paymentsBefore = payments();
        var objectsBefore = new HashMap<>(objects);
        var request = request(operation);
        if (token != null) request.header("Authorization", "Bearer " + token);
        mvc.perform(request).andExpect(status().isUnauthorized());
        assertThat(expenses()).isEqualTo(expensesBefore);
        assertThat(payments()).isEqualTo(paymentsBefore);
        assertThat(objects).isEqualTo(objectsBefore);
        verifyNoInteractions(storage);
    }

    private MockHttpServletRequestBuilder request(Operation operation) {
        String endpoint = "/api/expenses/" + expenseId;
        return switch (operation) {
            case UPDATE -> put(endpoint).contentType(APPLICATION_JSON).content(json.createObjectNode()
                    .put("description", "Corrigida").put("purchaseDate", "2030-01-01")
                    .put("categoryId", categoryId).put("paid", true)
                    .put("valueMode", "DIRECT").put("totalPrice", 250).toString());
            case DELETE -> delete(endpoint);
            case REMOVE_RECEIPT -> delete(endpoint + "/receipt");
            case REPLACE_RECEIPT -> multipart(endpoint + "/receipt")
                    .file(new MockMultipartFile("file", "replacement.pdf", "application/pdf", REPLACEMENT))
                    .with(request -> { request.setMethod("PUT"); return request; });
        };
    }

    private List<Map<String, Object>> expenses() {
        return jdbc.queryForList("select * from expenses where project_id=? order by id", project.getId());
    }

    private List<Map<String, Object>> payments() {
        return jdbc.queryForList("select p.* from pending_payments p join expenses e on e.id=p.expense_id "
                + "where e.project_id=? order by p.id", project.getId());
    }

    @AfterEach
    void removeOnlyThisFixture() {
        if (project != null) {
            jdbc.update("delete from pending_payments where expense_id in (select id from expenses where project_id=?)", project.getId());
            jdbc.update("delete from expenses where project_id=?", project.getId());
            jdbc.update("delete from budgets where project_id=?", project.getId());
            projects.deleteById(project.getId());
        }
        if (owner != null) {
            jdbc.update("delete from suppliers where user_id=?", owner.getId());
            users.deleteById(owner.getId());
        }
    }
}
