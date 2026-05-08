CREATE TABLE budgets (
    id               SERIAL PRIMARY KEY,
    user_id          VARCHAR(255) NOT NULL REFERENCES users(id),
    category_id      INTEGER      NOT NULL REFERENCES expense_categories(id),
    estimated_amount NUMERIC(15,2),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
