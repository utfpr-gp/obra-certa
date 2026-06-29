CREATE TABLE expenses (
    id            UUID PRIMARY KEY,
    budget_id     UUID NOT NULL REFERENCES budgets(id),
    user_id       UUID NOT NULL REFERENCES users(id),
    category_id   UUID NOT NULL REFERENCES expense_categories(id),
    supplier_id   UUID NOT NULL REFERENCES suppliers(id),
    type          VARCHAR(50),
    description   TEXT,
    quantity      NUMERIC(10,2),
    unit          VARCHAR(20),
    unit_price    NUMERIC(15,2),
    total_price   NUMERIC(15,2),
    purchase_date DATE,
    receipt_url   VARCHAR(255),
    nfe_key       VARCHAR(44),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
