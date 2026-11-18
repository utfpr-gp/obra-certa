package com.obracerta.service;

import com.obracerta.integration.ReceiptStorage;
import com.obracerta.repository.NfeReceiptCleanupRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@Service
public class NfeReceiptCleanupService {
    private static final Logger log = LoggerFactory.getLogger(NfeReceiptCleanupService.class);
    private static final Duration RETRY_DELAY = Duration.ofMinutes(10);
    private static final Duration UNCERTAIN_RECHECK_DELAY = Duration.ofDays(1);

    private final NfeReceiptCleanupRepository cleanups;
    private final ReceiptStorage storage;
    private final TransactionTemplate transactions;
    private final Clock clock;

    public NfeReceiptCleanupService(NfeReceiptCleanupRepository cleanups, ReceiptStorage storage,
                                    PlatformTransactionManager transactionManager, Clock clock) {
        this.cleanups = cleanups;
        this.storage = storage;
        this.clock = clock;
        this.transactions = new TransactionTemplate(transactionManager);
        this.transactions.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    void register(String key) {
        transactions.executeWithoutResult(status -> cleanups.insert(key, nextAttempt()));
    }

    boolean lockForUpload(String key) {
        return cleanups.lockForUpload(key);
    }

    void complete(String key) {
        cleanups.complete(key);
    }

    void compensate(String key) {
        try {
            transactions.executeWithoutResult(status -> {
                if (cleanups.tryLock(key)) {
                    // Mesmo um PUT que retornou sucesso pode ter uma tentativa anterior em andamento.
                    delete(key, true, RETRY_DELAY);
                }
            });
        } catch (RuntimeException exception) {
            // O registro inicial já foi confirmado. Preserve o erro original da importação.
            log.warn("Falha ao registrar compensação do comprovante de NF-e. key={}", key, exception);
        }
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 60_000)
    public void reconcile() {
        reconcileDueBefore(clock.instant());
    }

    public void reconcileDueBefore(Instant cutoff) {
        for (String key : cleanups.findDue(cutoff)) {
            transactions.executeWithoutResult(status -> {
                cleanups.tryLockDue(key, cutoff).ifPresent(uncertainUpload ->
                        delete(key, uncertainUpload, UNCERTAIN_RECHECK_DELAY));
            });
        }
    }

    private void delete(String key, boolean uncertainUpload, Duration recheckDelay) {
        try {
            storage.delete(key);
        } catch (RuntimeException exception) {
            cleanups.defer(key, nextAttempt());
            log.warn("Falha ao remover comprovante de NF-e pendente. key={}", key, exception);
            return;
        }
        if (uncertainUpload) {
            // Um DELETE bem-sucedido não confirma que um PUT remoto terminou.
            cleanups.defer(key, clock.instant().plus(recheckDelay));
        } else {
            cleanups.complete(key);
        }
    }

    private Instant nextAttempt() {
        return clock.instant().plus(RETRY_DELAY);
    }
}
