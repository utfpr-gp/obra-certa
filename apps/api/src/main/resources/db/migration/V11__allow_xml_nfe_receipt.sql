-- A NF-e grava o XML como comprovante da primeira linha, então o tipo aceito em UPLOADED
-- passa a incluir XML. Os demais limites (tamanho > 0 e <= 10 MiB) continuam iguais.
ALTER TABLE expenses DROP CONSTRAINT chk_expense_receipt_state;
ALTER TABLE expenses ADD CONSTRAINT chk_expense_receipt_state CHECK (
    (receipt_state IN ('NONE','PENDING') AND receipt_key IS NULL AND receipt_content_type IS NULL AND receipt_size IS NULL)
    OR (receipt_state = 'UPLOADED' AND receipt_key IS NOT NULL
        AND receipt_content_type IS NOT NULL
        AND receipt_content_type IN ('image/jpeg','image/png','application/pdf','application/xml','text/xml')
        AND receipt_size IS NOT NULL AND receipt_size > 0 AND receipt_size <= 10485760)
);
