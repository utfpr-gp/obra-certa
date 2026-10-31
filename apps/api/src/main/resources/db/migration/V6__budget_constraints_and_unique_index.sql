-- V6 — Travas de orcamento da US07 (unicidade ativa por obra/categoria e valor valido).
--
-- Ordem importa:
--   1. valores nulos viram 0.00 (CA3/CA4: "sem teto" e representado por teto zerado,
--      porque expenses.budget_id continua NOT NULL);
--   2. DEFAULT 0.00 para que um novo registro sem valor explicito nunca nasça nulo;
--   3. NOT NULL e CHECK >= 0 (zero e permitido justamente para o zeramento do CA4);
--   4. duplicatas ativas sao SOFT-DELETADAS — nunca apagadas — mantendo a mais recente
--      de forma deterministica. DELETE quebraria a FK expenses.budget_id (NOT NULL);
--   5. so entao o indice unico parcial nasce, o que garante que a criacao dele nao
--      falhe por causa de linhas duplicadas pre-existentes.

UPDATE budgets
SET estimated_amount = 0.00
WHERE estimated_amount IS NULL;

ALTER TABLE budgets ALTER COLUMN estimated_amount SET DEFAULT 0.00;
ALTER TABLE budgets ALTER COLUMN estimated_amount SET NOT NULL;

ALTER TABLE budgets
    ADD CONSTRAINT ck_budgets_estimated_amount_non_negative
    CHECK (estimated_amount >= 0);

WITH ranked_budgets AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY project_id, category_id
               ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST,
                        created_at DESC NULLS LAST,
                        id DESC
           ) AS position
    FROM budgets
    WHERE deleted_at IS NULL
)
UPDATE budgets AS duplicate
SET deleted_at = NOW()
FROM ranked_budgets
WHERE duplicate.id = ranked_budgets.id
  AND ranked_budgets.position > 1;

CREATE UNIQUE INDEX idx_budgets_project_category_active
    ON budgets (project_id, category_id)
    WHERE deleted_at IS NULL;
