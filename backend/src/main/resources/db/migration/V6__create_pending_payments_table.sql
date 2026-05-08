CREATE TABLE pending_payments (
    id         SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL REFERENCES expenses(id),
    due_date   DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
