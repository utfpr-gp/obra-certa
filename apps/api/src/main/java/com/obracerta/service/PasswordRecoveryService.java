package com.obracerta.service;

import com.obracerta.exception.InvalidRecoveryTokenException;
import com.obracerta.repository.PasswordRecoveryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataAccessException;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.concurrent.Executor;

@Service
public class PasswordRecoveryService {
    private static final Logger log = LoggerFactory.getLogger(PasswordRecoveryService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private final PasswordRecoveryRepository repository;
    private final PasswordRecoveryMailer mailer;
    private final PasswordEncoder encoder;
    private final TransactionTemplate transactions;
    private final Clock clock;
    private final Executor executor;

    public PasswordRecoveryService(PasswordRecoveryRepository repository, PasswordRecoveryMailer mailer,
            PasswordEncoder encoder, TransactionTemplate transactions, Clock clock,
            @Qualifier("passwordRecoveryExecutor") Executor executor) {
        this.repository = repository;
        this.mailer = mailer;
        this.encoder = encoder;
        this.transactions = transactions;
        this.clock = clock;
        this.executor = executor;
    }

    public void request(String email) {
        // Lookup and SMTP happen in the worker for both known and unknown addresses.
        // The public response therefore does not wait on delivery for registered users.
        try {
            executor.execute(() -> deliver(email));
        } catch (TaskRejectedException exception) {
            log.warn("Fila de recuperação de senha temporariamente indisponível.");
        }
    }

    private void deliver(String email) {
        try {
            createAndSend(email);
        } catch (MailException | DataAccessException exception) {
            // SMTP exceptions may include addresses or credentials. Log no exception contents.
            log.warn("Falha no processamento do e-mail de recuperação de senha.");
        }
    }

    private void createAndSend(String email) {
        String address = email.trim();
        if (!repository.claimRequest(hash(address.toLowerCase(Locale.ROOT)), clock.instant())) return;
        var userId = repository.findUserId(address);
        if (userId.isEmpty()) return;
        transactions.executeWithoutResult(status -> {
            repository.lockUser(userId.get());
            byte[] bytes = new byte[32];
            RANDOM.nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            repository.replaceToken(userId.get(), hash(token), clock.instant().plusSeconds(1800));
            mailer.send(address, token);
        });
    }

    public void reset(String token, String password) {
        if (!token.matches("[A-Za-z0-9_-]{43}")) throw new InvalidRecoveryTokenException();
        transactions.executeWithoutResult(status -> {
            String tokenHash = hash(token);
            String userId = repository.findTokenOwner(tokenHash).orElseThrow(InvalidRecoveryTokenException::new);
            repository.lockUser(userId);
            if (!repository.consumeToken(userId, tokenHash, clock.instant())) throw new InvalidRecoveryTokenException();
            repository.updatePassword(userId, encoder.encode(password));
        });
    }

    private static String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponível", exception);
        }
    }
}
