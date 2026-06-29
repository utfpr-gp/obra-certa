CREATE TABLE pending_payments (
    id         UUID PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expenses(id),
    due_date   DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
