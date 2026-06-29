CREATE TABLE budgets (
    id               UUID PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES users(id),
    category_id      UUID NOT NULL REFERENCES expense_categories(id),
    estimated_amount NUMERIC(15,2),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
