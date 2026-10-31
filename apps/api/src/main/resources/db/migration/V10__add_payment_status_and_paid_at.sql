ALTER TABLE pending_payments ADD COLUMN status VARCHAR(20);
ALTER TABLE pending_payments ADD COLUMN paid_at TIMESTAMPTZ(6);

UPDATE pending_payments p
SET status = CASE WHEN e.paid THEN 'PAID' ELSE 'PENDING' END
FROM expenses e
WHERE p.expense_id = e.id;

UPDATE pending_payments SET status = 'PENDING' WHERE status IS NULL;

ALTER TABLE pending_payments ALTER COLUMN status SET NOT NULL;
ALTER TABLE pending_payments ADD CONSTRAINT chk_pending_payments_status CHECK (status IN ('PENDING', 'PAID'));
