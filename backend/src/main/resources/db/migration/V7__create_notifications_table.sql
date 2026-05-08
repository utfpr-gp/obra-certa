CREATE TABLE notifications (
    id         SERIAL PRIMARY KEY,
    user_id    VARCHAR(255) NOT NULL REFERENCES users(id),
    message    TEXT,
    type       VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
