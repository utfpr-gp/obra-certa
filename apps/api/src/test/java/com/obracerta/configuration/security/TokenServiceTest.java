package com.obracerta.configuration.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.obracerta.model.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

class TokenServiceTest {
    @Test
    void issuesTokensThatExpireInOneDay() throws Exception {
        var properties = new Properties();
        try (var stream = getClass().getResourceAsStream("/application.properties")) {
            properties.load(stream);
        }
        long expiration = Long.parseLong(properties.getProperty("jwt.expiration"));
        assertThat(expiration).isEqualTo(86400);
        var service = new TokenService();
        ReflectionTestUtils.setField(service, "secret", "test-session-secret");
        ReflectionTestUtils.setField(service, "expiration", expiration);
        Instant before = Instant.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
        String token = service.generateToken(new User("Pessoa", "pessoa@example.com", "hash"));

        assertThat(JWT.decode(token).getExpiresAtAsInstant())
                .isBetween(before.plusSeconds(86400), Instant.now().plusSeconds(86400));
        assertThat(service.validateToken(token)).isEqualTo("pessoa@example.com");
    }

    @Test
    void rejectsExpiredTokens() {
        var service = new TokenService();
        ReflectionTestUtils.setField(service, "secret", "test-session-secret");
        String token = JWT.create().withIssuer("obra-certa").withSubject("pessoa@example.com")
                .withExpiresAt(Instant.now().minusSeconds(10)).sign(Algorithm.HMAC256("test-session-secret"));
        assertThat(service.validateToken(token)).isEmpty();
    }
}
