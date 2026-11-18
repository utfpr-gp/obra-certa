package com.obracerta.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Repository
public class NfeReceiptCleanupRepository {
    private final JdbcTemplate jdbc;

    public NfeReceiptCleanupRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(String key, Instant due) {
        jdbc.update("insert into nfe_receipt_cleanups (object_key, next_attempt_at) values (?, ?)",
                key, due.atOffset(ZoneOffset.UTC));
    }

    public boolean lockForUpload(String key) {
        return !jdbc.queryForList("""
                select object_key from nfe_receipt_cleanups where object_key = ? for update
                """, String.class, key).isEmpty();
    }

    public boolean tryLock(String key) {
        return !jdbc.queryForList("""
                select object_key from nfe_receipt_cleanups where object_key = ? for update skip locked
                """, String.class, key).isEmpty();
    }

    public Optional<Boolean> tryLockDue(String key, Instant cutoff) {
        return jdbc.queryForList("""
                select uncertain_upload from nfe_receipt_cleanups
                where object_key = ? and next_attempt_at <= ? for update skip locked
                """, Boolean.class, key, cutoff.atOffset(ZoneOffset.UTC)).stream().findFirst();
    }

    public List<String> findDue(Instant cutoff) {
        return jdbc.queryForList("""
                select object_key from nfe_receipt_cleanups where next_attempt_at <= ?
                order by next_attempt_at, object_key limit 20
                """, String.class, cutoff.atOffset(ZoneOffset.UTC));
    }

    public void defer(String key, Instant due) {
        jdbc.update("update nfe_receipt_cleanups set next_attempt_at = ? where object_key = ?",
                due.atOffset(ZoneOffset.UTC), key);
    }

    public void complete(String key) {
        jdbc.update("delete from nfe_receipt_cleanups where object_key = ?", key);
    }
}
