package com.obracerta.service;

import com.obracerta.repository.PasswordRecoveryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.AfterEach;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabase;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.core.io.ClassPathResource;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PasswordRecoveryServiceTest {
    private JdbcTemplate jdbc;
    private PasswordRecoveryMailer mailer;
    private PasswordRecoveryService service;
    private TransactionTemplate transactions;
    private EmbeddedDatabase database;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final Instant now = Instant.parse("2026-11-17T12:00:00Z");

    @BeforeEach
    void setup() {
        database = new EmbeddedDatabaseBuilder().generateUniqueName(true)
                .setType(EmbeddedDatabaseType.H2).build();
        jdbc = new JdbcTemplate(database);
        jdbc.execute("create table users (id varchar(36) primary key, email varchar(255), password varchar(255), updated_at timestamp)");
        jdbc.execute("insert into users values ('user', 'pessoa@example.com', 'original', current_timestamp)");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V14__password_recovery.sql"))
                .execute(database);
        transactions = new TransactionTemplate(new DataSourceTransactionManager(database));
        mailer = mock(PasswordRecoveryMailer.class);
        service = serviceAt(now);
    }

    @AfterEach
    void closeDatabase() {
        database.shutdown();
    }

    @Test
    void queuesBothKnownAndUnknownAddressesBeforeLookingThemUp() {
        var repository = mock(PasswordRecoveryRepository.class);
        var executor = mock(java.util.concurrent.Executor.class);
        var asynchronous = new PasswordRecoveryService(repository, mailer, encoder, transactions,
                Clock.fixed(now, ZoneOffset.UTC), executor);
        asynchronous.request("pessoa@example.com");
        asynchronous.request("unknown@example.com");
        verify(executor, times(2)).execute(any(Runnable.class));
        verifyNoInteractions(repository, mailer);
    }

    private PasswordRecoveryService serviceAt(Instant time) {
        return new PasswordRecoveryService(new PasswordRecoveryRepository(jdbc), mailer, encoder,
                transactions, Clock.fixed(time, ZoneOffset.UTC), Runnable::run);
    }

    private String issueToken() {
        service.request("pessoa@example.com");
        var token = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(mailer).send(eq("pessoa@example.com"), token.capture());
        return token.getValue();
    }

    @Test
    void sendsAOneTimeTokenAndReplacesThePassword() {
        String token = issueToken();
        assertThat(jdbc.queryForObject("select token_hash from password_recovery_tokens", String.class))
                .hasSize(64).isNotEqualTo(token);
        service.reset(token, "senhaNova123");
        String password = jdbc.queryForObject("select password from users", String.class);
        assertThat(encoder.matches("senhaNova123", password)).isTrue();
        assertThat(encoder.matches("original", password)).isFalse();
        assertThatThrownBy(() -> service.reset(token, "outraSenha"))
                .isInstanceOf(com.obracerta.exception.InvalidRecoveryTokenException.class);
    }

    @Test
    void ignoresUnknownEmailsAndThrottlesRepeatedRequests() {
        service.request("unknown@example.com");
        verifyNoInteractions(mailer);
        service.request("pessoa@example.com");
        service.request("pessoa@example.com");
        verify(mailer, times(1)).send(eq("pessoa@example.com"), anyString());
    }

    @Test
    void rejectsExpiredAndInvalidTokens() {
        String token = issueToken();
        assertThatThrownBy(() -> serviceAt(now.plusSeconds(1800)).reset(token, "senhaNova"))
                .isInstanceOf(com.obracerta.exception.InvalidRecoveryTokenException.class);
        assertThatThrownBy(() -> service.reset("invalid", "senhaNova"))
                .isInstanceOf(com.obracerta.exception.InvalidRecoveryTokenException.class);
        assertThat(jdbc.queryForObject("select password from users", String.class)).isEqualTo("original");
    }

    @Test
    void newRequestInvalidatesThePreviousLink() {
        String token = issueToken();
        serviceAt(now.plusSeconds(61)).request("pessoa@example.com");
        assertThatThrownBy(() -> service.reset(token, "senhaNova"))
                .isInstanceOf(com.obracerta.exception.InvalidRecoveryTokenException.class);
        verify(mailer, times(2)).send(eq("pessoa@example.com"), anyString());
    }

    @Test
    void failedDeliveryKeepsThePreviousTokenAndPassword() {
        String token = issueToken();
        doThrow(new org.springframework.mail.MailSendException("smtp")).when(mailer).send(anyString(), anyString());
        serviceAt(now.plusSeconds(61)).request("pessoa@example.com");
        service.reset(token, "senhaNova");
        assertThat(encoder.matches("senhaNova", jdbc.queryForObject("select password from users", String.class))).isTrue();
    }

    @Test
    void concurrentResetsConsumeTheTokenOnce() throws Exception {
        String token = issueToken();
        try (var pool = Executors.newFixedThreadPool(2)) {
            var tasks = java.util.List.<java.util.concurrent.Callable<Boolean>>of(
                    () -> tryReset(token), () -> tryReset(token));
            var results = pool.invokeAll(tasks);
            assertThat(results.get(0).get() ^ results.get(1).get()).isTrue();
        }
    }

    private boolean tryReset(String token) {
        try {
            service.reset(token, UUID.randomUUID().toString());
            return true;
        } catch (com.obracerta.exception.InvalidRecoveryTokenException exception) {
            return false;
        }
    }
}
