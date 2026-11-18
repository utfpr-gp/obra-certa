-- V7 — Categorias de despesa pre-definidas (dados mestres da US07).
--
-- Os nomes sao exatamente os de PREDEFINED_CATEGORIES em
-- apps/web/src/app/core/models/expense-category.model.ts, incluindo acentos, porque a
-- tela passa a consumir GET /api/expense-categories em vez da constante do frontend.
--
-- Idempotente: cada nome so e inserido quando ainda nao existe, entao rodar a migration
-- contra um banco que ja tenha as categorias (por exemplo, semeadas manualmente) nao
-- duplica nada.

INSERT INTO expense_categories (id, name, created_at, updated_at)
SELECT gen_random_uuid()::VARCHAR(36), seeded.name, NOW(), NOW()
FROM (VALUES
    ('Fundação e Estrutura'),
    ('Alvenaria'),
    ('Elétrica'),
    ('Hidráulica'),
    ('Telhado e Cobertura'),
    ('Esquadrias e Vidros'),
    ('Acabamento e Pintura'),
    ('Mão de Obra'),
    ('Taxas e Serviços')
) AS seeded(name)
WHERE NOT EXISTS (
    SELECT 1
    FROM expense_categories existing
    WHERE existing.name = seeded.name
);
