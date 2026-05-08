CREATE TABLE suppliers (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    document   VARCHAR(18),
    email      TEXT,
    phone      TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
