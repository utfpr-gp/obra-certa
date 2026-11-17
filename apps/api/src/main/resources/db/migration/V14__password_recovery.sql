CREATE TABLE password_recovery_tokens (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE password_recovery_requests (
    email_hash VARCHAR(64) PRIMARY KEY,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL
);
