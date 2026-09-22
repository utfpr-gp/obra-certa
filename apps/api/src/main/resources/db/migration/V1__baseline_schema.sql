-- V1 — Baseline do schema existente.
--
-- Reproduz exatamente o que o Hibernate vinha criando com ddl-auto=update até aqui
-- (entidades User, ExpenseCategory, Supplier, Budget, Expense, PendingPayment e
-- Notification). A partir desta migration o schema passa a ser versionado: o
-- ddl-auto vira `validate` e nenhuma tabela nasce mais por efeito colateral do
-- Hibernate.
--
-- Num banco que JÁ tem essas tabelas (criadas pelo update), rode o baseline do
-- Flyway uma vez antes de subir a aplicação, para que ele marque a V1 como
-- aplicada em vez de tentar recriar tudo:
--   ./mvnw flyway:baseline -Dflyway.baselineVersion=1
-- Banco novo (container recriado, CI, Neon) não precisa disso — a V1 roda normal.

CREATE TABLE users (
    id         VARCHAR(36)  NOT NULL,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    user_role  VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE expense_categories (
    id         VARCHAR(36)  NOT NULL,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    CONSTRAINT pk_expense_categories PRIMARY KEY (id)
);

CREATE TABLE suppliers (
    id         VARCHAR(36)  NOT NULL,
    name       VARCHAR(255) NOT NULL,
    document   VARCHAR(255),
    email      TEXT,
    phone      TEXT,
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    CONSTRAINT pk_suppliers PRIMARY KEY (id)
);

CREATE TABLE budgets (
    id               VARCHAR(36) NOT NULL,
    user_id          VARCHAR(36) NOT NULL,
    category_id      VARCHAR(36) NOT NULL,
    estimated_amount NUMERIC(15, 2),
    created_at       TIMESTAMP(6),
    updated_at       TIMESTAMP(6),
    CONSTRAINT pk_budgets PRIMARY KEY (id),
    CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_budgets_category FOREIGN KEY (category_id) REFERENCES expense_categories (id)
);

CREATE TABLE expenses (
    id            VARCHAR(36) NOT NULL,
    budget_id     VARCHAR(36) NOT NULL,
    user_id       VARCHAR(36) NOT NULL,
    category_id   VARCHAR(36) NOT NULL,
    supplier_id   VARCHAR(36) NOT NULL,
    type          VARCHAR(255),
    description   TEXT,
    quantity      NUMERIC(10, 2),
    unit          VARCHAR(255),
    unit_price    NUMERIC(15, 2),
    total_price   NUMERIC(15, 2),
    purchase_date DATE,
    receipt_url   VARCHAR(255),
    nfe_key       VARCHAR(44),
    created_at    TIMESTAMP(6),
    updated_at    TIMESTAMP(6),
    CONSTRAINT pk_expenses PRIMARY KEY (id),
    CONSTRAINT fk_expenses_budget FOREIGN KEY (budget_id) REFERENCES budgets (id),
    CONSTRAINT fk_expenses_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_expenses_category FOREIGN KEY (category_id) REFERENCES expense_categories (id),
    CONSTRAINT fk_expenses_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
);

CREATE TABLE pending_payments (
    id         VARCHAR(36) NOT NULL,
    expense_id VARCHAR(36) NOT NULL,
    due_date   DATE,
    created_at TIMESTAMP(6),
    CONSTRAINT pk_pending_payments PRIMARY KEY (id),
    CONSTRAINT uk_pending_payments_expense UNIQUE (expense_id),
    CONSTRAINT fk_pending_payments_expense FOREIGN KEY (expense_id) REFERENCES expenses (id)
);

CREATE TABLE notifications (
    id         VARCHAR(36) NOT NULL,
    user_id    VARCHAR(36) NOT NULL,
    message    TEXT,
    type       VARCHAR(255),
    created_at TIMESTAMP(6),
    CONSTRAINT pk_notifications PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id)
);
