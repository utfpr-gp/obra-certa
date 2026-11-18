-- Alinha os carimbos de exclusão lógica ao tipo temporal definido pela arquitetura.
ALTER TABLE budgets
    ALTER COLUMN deleted_at TYPE timestamptz(6)
    USING deleted_at AT TIME ZONE 'UTC';

ALTER TABLE expenses
    ALTER COLUMN deleted_at TYPE timestamptz(6)
    USING deleted_at AT TIME ZONE 'UTC';

ALTER TABLE pending_payments
    ALTER COLUMN deleted_at TYPE timestamptz(6)
    USING deleted_at AT TIME ZONE 'UTC';
