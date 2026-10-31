-- Propaga a exclusão lógica da obra para seus vínculos financeiros.
ALTER TABLE budgets ADD COLUMN deleted_at TIMESTAMP(6);
ALTER TABLE expenses ADD COLUMN deleted_at TIMESTAMP(6);
ALTER TABLE pending_payments ADD COLUMN deleted_at TIMESTAMP(6);
