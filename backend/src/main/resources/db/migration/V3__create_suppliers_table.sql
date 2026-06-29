CREATE TABLE suppliers (
    id         UUID PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    document   VARCHAR(18),
    email      VARCHAR(255),
    phone      VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
