package com.obracerta.repository;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

@Repository
public class PasswordRecoveryRepository {
    private final JdbcTemplate jdbc;

    public PasswordRecoveryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // Called outside the token transaction. Each statement commits independently,
    // so a competing insert cannot mark that transaction as rollback-only.
    public boolean claimRequest(String emailHash, Instant now) {
        jdbc.update("delete from password_recovery_requests where requested_at < ?",
                utc(now.minusSeconds(86400)));
        int updated = jdbc.update("""
                update password_recovery_requests set requested_at = ?
                where email_hash = ? and requested_at <= ?
                """, utc(now), emailHash, utc(now.minusSeconds(60)));
        if (updated == 1) return true;
        try {
            jdbc.update("insert into password_recovery_requests (email_hash, requested_at) values (?, ?)",
                    emailHash, utc(now));
            return true;
        } catch (DuplicateKeyException exception) {
            return false;
        }
    }

    public Optional<String> findUserId(String email) {
        return jdbc.query("select id from users where email = ?", (row, index) -> row.getString(1), email)
                .stream().findFirst();
    }

    public void lockUser(String userId) {
        jdbc.queryForList("select id from users where id = ? for update", userId);
    }

    public void replaceToken(String userId, String tokenHash, Instant expiresAt) {
        jdbc.update("delete from password_recovery_tokens where user_id = ?", userId);
        jdbc.update("insert into password_recovery_tokens (user_id, token_hash, expires_at) values (?, ?, ?)",
                userId, tokenHash, utc(expiresAt));
    }

    public Optional<String> findTokenOwner(String tokenHash) {
        return jdbc.query("select user_id from password_recovery_tokens where token_hash = ?",
                (row, index) -> row.getString(1), tokenHash).stream().findFirst();
    }

    public boolean consumeToken(String userId, String tokenHash, Instant now) {
        return jdbc.update("""
                delete from password_recovery_tokens
                where user_id = ? and token_hash = ? and expires_at > ?
                """, userId, tokenHash, utc(now)) == 1;
    }

    public void updatePassword(String userId, String encodedPassword) {
        jdbc.update("update users set password = ?, updated_at = current_timestamp where id = ?",
                encodedPassword, userId);
    }

    private OffsetDateTime utc(Instant instant) {
        return instant.atOffset(ZoneOffset.UTC);
    }
}
