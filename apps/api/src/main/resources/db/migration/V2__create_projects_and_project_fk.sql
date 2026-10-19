-- V2 — Criacao da tabela projects e integracao com budgets e expenses
--
-- Cria a tabela projects com integridade referencial para users(id).
-- Adiciona a coluna project_id em budgets e expenses com NOT NULL e foreign key para
-- projects(id), conforme docs/architecture.md ("budgets.project_id: not null, FK ->
-- projects(id)" e "expenses.project_id: not null, FK -> projects(id)").
-- Cria indice para busca de projetos ativos por usuario.
--
-- ATENCAO (dados pre-existentes): um banco que ja rodava com budgets/expenses antes
-- desta migration pode ter linhas sem obra, e o NOT NULL recusaria essas linhas. Por
-- isso a V2 resolve o caso aqui dentro, de forma explicita e deterministica:
--   1. cria uma obra de compatibilidade ("Obra anterior a migracao") para cada usuario
--      que tenha budgets/expenses sem vinculo;
--   2. reaponta as linhas orfas para essa obra do proprio usuario;
--   3. so entao aplica o NOT NULL.
-- Nenhuma linha e apagada. Em banco vazio (container recriado, CI, Neon) a consulta do
-- passo 1 nao devolve nada e nenhuma obra de compatibilidade e criada.
-- (gen_random_uuid() e nativo do PostgreSQL 13+; nao exige a extensao pgcrypto.)
-- Note que, neste ponto, a tabela projects acabou de nascer e so contem as obras
-- criadas pelo passo 1 (uma por usuario), o que torna os UPDATEs do passo 2 univocos.

CREATE TABLE projects (
    id         VARCHAR(36)  NOT NULL,
    user_id    VARCHAR(36)  NOT NULL,
    name       VARCHAR(255) NOT NULL,
    type       VARCHAR(255) NOT NULL,
    location   VARCHAR(255),
    status     VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    deleted_at TIMESTAMP(6),
    CONSTRAINT pk_projects PRIMARY KEY (id),
    CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_projects_user_active ON projects (user_id) WHERE deleted_at IS NULL;

-- Passo 1 — obra de compatibilidade por usuario com budgets/expenses sem vinculo.
INSERT INTO projects (id, user_id, name, type, status, created_at, updated_at)
SELECT gen_random_uuid()::VARCHAR(36),
       orphan.user_id,
       'Obra anterior a migracao',
       'RENOVATION',
       'IN_PROGRESS',
       NOW(),
       NOW()
FROM (
    SELECT user_id FROM budgets
    UNION
    SELECT user_id FROM expenses
) AS orphan;

-- Passo 2 — budgets: adiciona a coluna, reaponta os orfaos e aplica o NOT NULL.
ALTER TABLE budgets ADD COLUMN project_id VARCHAR(36);

UPDATE budgets
SET project_id = p.id
FROM projects p
WHERE budgets.project_id IS NULL
  AND p.user_id = budgets.user_id;

ALTER TABLE budgets ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE budgets ADD CONSTRAINT fk_budgets_project FOREIGN KEY (project_id) REFERENCES projects (id);

-- Passo 2 — expenses: adiciona a coluna, reaponta os orfaos e aplica o NOT NULL.
ALTER TABLE expenses ADD COLUMN project_id VARCHAR(36);

UPDATE expenses
SET project_id = p.id
FROM projects p
WHERE expenses.project_id IS NULL
  AND p.user_id = expenses.user_id;

ALTER TABLE expenses ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_project FOREIGN KEY (project_id) REFERENCES projects (id);
