package com.obracerta.controller;

import com.obracerta.configuration.security.TokenService;
import com.obracerta.enums.UserRole;
import com.obracerta.model.entity.User;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Issue #33: com JWT valido, erros encaminhados ao despacho /error chegavam ao cliente
 * como 401, e o auth-interceptor do frontend deslogava o usuario. O MockMvc nao executa
 * o encaminhamento para /error, por isso este teste sobe um servidor real.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "api.security.token.secret=error-dispatch-test-secret")
@ActiveProfiles("test")
@Import(ErrorDispatchAuthenticationIntegrationTest.FailingController.class)
class ErrorDispatchAuthenticationIntegrationTest {

    @LocalServerPort private int port;
    @Autowired private UserRepository userRepository;
    @Autowired private TokenService tokenService;

    private final HttpClient http = HttpClient.newHttpClient();
    private User owner;
    private String bearer;

    @RestController
    static class FailingController {
        @GetMapping("/api/test-only/unmapped-failure")
        String unmappedFailure() {
            throw new IllegalStateException("falha nao mapeada");
        }

        @GetMapping("/api/test-only/unique-violation")
        String uniqueViolation() {
            throw new DataIntegrityViolationException("violacao de unicidade");
        }
    }

    @BeforeEach
    void persistOwner() {
        owner = userRepository.saveAndFlush(User.builder()
                .name("Proprietário")
                .email("error-dispatch-" + UUID.randomUUID() + "@example.com")
                .password("irrelevante")
                .userRole(UserRole.USER)
                .build());
        bearer = "Bearer " + tokenService.generateToken(owner);
    }

    @AfterEach
    void removeOwner() {
        userRepository.delete(owner);
    }

    @Test
    void malformedJsonWithValidTokenReturns400() throws Exception {
        HttpResponse<String> response = send(HttpRequest.newBuilder(url("/api/budgets/x/categories/y"))
                .header("Authorization", bearer)
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString("{malformado")));

        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void missingRequiredParameterWithValidTokenReturns400() throws Exception {
        HttpResponse<String> response = send(HttpRequest.newBuilder(url("/api/budgets"))
                .header("Authorization", bearer)
                .GET());

        assertThat(response.statusCode()).isEqualTo(400);
    }

    @Test
    void unmappedExceptionWithValidTokenReturns500() throws Exception {
        HttpResponse<String> response = send(HttpRequest.newBuilder(url("/api/test-only/unmapped-failure"))
                .header("Authorization", bearer)
                .GET());

        assertThat(response.statusCode()).isEqualTo(500);
        assertThat(response.body()).doesNotContain("falha nao mapeada");
    }

    @Test
    void uniqueViolationWithValidTokenReturns409() throws Exception {
        HttpResponse<String> response = send(HttpRequest.newBuilder(url("/api/test-only/unique-violation"))
                .header("Authorization", bearer)
                .GET());

        assertThat(response.statusCode()).isEqualTo(409);
    }

    @Test
    void missingTokenStillReturns401() throws Exception {
        HttpResponse<String> response = send(HttpRequest.newBuilder(url("/api/projects")).GET());

        assertThat(response.statusCode()).isEqualTo(401);
    }

    @Test
    void invalidTokenStillReturns401() throws Exception {
        HttpResponse<String> response = send(HttpRequest.newBuilder(url("/api/projects"))
                .header("Authorization", "Bearer token-invalido")
                .GET());

        assertThat(response.statusCode()).isEqualTo(401);
    }

    @Test
    void errorEndpointDoesNotExposeProtectedDataWithoutToken() throws Exception {
        HttpResponse<String> response = send(HttpRequest.newBuilder(url("/api/test-only/unmapped-failure")).GET());

        assertThat(response.statusCode()).isEqualTo(401);
    }

    private URI url(String path) {
        return URI.create("http://localhost:" + port + "/obracerta" + path);
    }

    private HttpResponse<String> send(HttpRequest.Builder request) throws Exception {
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
}
