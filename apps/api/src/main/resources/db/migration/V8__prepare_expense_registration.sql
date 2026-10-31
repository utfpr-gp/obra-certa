ALTER TABLE expenses ALTER COLUMN budget_id DROP NOT NULL;
ALTER TABLE expenses ADD COLUMN paid BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE expenses e SET paid = FALSE
WHERE EXISTS (SELECT 1 FROM pending_payments p WHERE p.expense_id = e.id AND p.deleted_at IS NULL);

ALTER TABLE suppliers ADD COLUMN user_id VARCHAR(36) REFERENCES users(id);

-- Preserve the original supplier for its first owner, and clone it for each
-- additional owner. Unreferenced legacy suppliers deliberately remain unowned.
CREATE TEMPORARY TABLE supplier_owner_links ON COMMIT DROP AS
SELECT s.id AS original_id, e.user_id,
       CASE WHEN row_number() OVER (PARTITION BY s.id ORDER BY e.user_id) = 1
            THEN s.id ELSE gen_random_uuid()::text END AS owned_id
FROM suppliers s JOIN (SELECT DISTINCT supplier_id, user_id FROM expenses) e ON e.supplier_id = s.id;

INSERT INTO suppliers(id,name,document,email,phone,created_at,updated_at,user_id)
SELECT l.owned_id,s.name,s.document,s.email,s.phone,s.created_at,s.updated_at,l.user_id
FROM supplier_owner_links l JOIN suppliers s ON s.id=l.original_id
WHERE l.owned_id<>l.original_id;

UPDATE suppliers s SET user_id=l.user_id
FROM supplier_owner_links l WHERE s.id=l.original_id AND l.owned_id=l.original_id;

UPDATE expenses e SET supplier_id=l.owned_id
FROM supplier_owner_links l WHERE e.supplier_id=l.original_id AND e.user_id=l.user_id;

UPDATE suppliers SET document=regexp_replace(document,'[./\s-]','','g') WHERE document IS NOT NULL;
CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);
