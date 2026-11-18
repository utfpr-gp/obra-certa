-- Legacy receipt_url is retained for audit only: an old reference does not prove an object exists.
-- Existing rows therefore start at NONE, with no confirmed private key or metadata.
ALTER TABLE expenses ADD COLUMN receipt_state VARCHAR(16) NOT NULL DEFAULT 'NONE';
ALTER TABLE expenses ADD COLUMN receipt_key VARCHAR(255);
ALTER TABLE expenses ADD COLUMN receipt_content_type VARCHAR(64);
ALTER TABLE expenses ADD COLUMN receipt_size BIGINT;
ALTER TABLE expenses ADD CONSTRAINT chk_expense_receipt_state CHECK (
    (receipt_state IN ('NONE','PENDING') AND receipt_key IS NULL AND receipt_content_type IS NULL AND receipt_size IS NULL)
    OR (receipt_state = 'UPLOADED' AND receipt_key IS NOT NULL
        AND receipt_content_type IS NOT NULL AND receipt_content_type IN ('image/jpeg','image/png','application/pdf')
        AND receipt_size IS NOT NULL AND receipt_size > 0 AND receipt_size <= 10485760)
);

