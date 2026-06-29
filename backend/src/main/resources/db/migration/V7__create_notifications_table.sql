CREATE TABLE notifications (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id),
    message    TEXT,
    type       VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
