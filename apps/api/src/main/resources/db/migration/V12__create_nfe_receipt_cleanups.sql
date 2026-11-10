CREATE TABLE nfe_receipt_cleanups (
    object_key VARCHAR(255) PRIMARY KEY,
    next_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_nfe_receipt_cleanups_due
    ON nfe_receipt_cleanups (next_attempt_at, object_key);
