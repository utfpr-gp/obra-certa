ALTER TABLE nfe_receipt_cleanups
    ADD COLUMN uncertain_upload BOOLEAN NOT NULL DEFAULT TRUE;
