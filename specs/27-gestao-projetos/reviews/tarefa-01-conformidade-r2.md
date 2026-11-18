# Parecer de Conformidade — Tarefa 01

**Veredito:** APROVADO

*Limitação de execução:* o shell deste sandbox liberou apenas `git` — `.\mvnw.cmd -B test` foi rejeitado (`Permission denied`) e não há evidência de execução prévia (`apps/api/target/` inexistente, sem `surefire-reports`). **Não rodei os testes.** O parecer é por leitura do diff (`git diff 49a19ca…`), do working tree e do `docs/architecture.md`.

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA10 — `projects` criada com integridade referencial (`user_id -> users.id`) | atendido | `V2__create_projects_and_project_fk.sql:22-34` (FK `fk_projects_user` em `:33`); `Project.java:26-28` |
| CA10 — `budgets` recebe `project_id` como FK -> `projects(id)` | atendido | `V2…sql:54, :62-63`; `Budget.java:32-34` |
| CA10 — `expenses` recebe `project_id` como FK -> `projects(id)` | atendido | `V2…sql:66, :74-75`; `Expense.java:27-29` |
| CA10 — Flyway aplica as migrações na inicialização com `ddl-auto=validate` sem divergências | atendido | `ProjectSchemaMigrationTest.java:38-41` (`@SpringBootTest` + `@ActiveProfiles("test")`); `application-test.properties:11` (`validate`). Se o schema divergisse da entidade, o contexto não subiria e o teste falharia |
| Tarefa 1 — teste que prova a aplicação da V2 (tabela, colunas, FKs, índice) | atendido | `ProjectSchemaMigrationTest.java:56-165` (aplicada+`SUCCESS` `:60-70`; colunas `:89-92`; `project_id` em `budgets`/`expenses` `:101-114`; FKs via `information_schema` `:117-154`) |
| Tarefa 1 — enums `ProjectType` / `ProjectStatus` | atendido | `enums/ProjectType.java:3-7`, `enums/ProjectStatus.java:3-7` — valores batem com `architecture.md:158,160` |
| Tarefa 1 — arquivos previstos no `plan.md` | atendido | os 7 caminhos de `plan.md:55-61` existem; nenhum arquivo de produção além deles |
| Ac. r1 nº1 — `project_id` **NOT NULL** em `budgets` e `expenses` | atendido | `V2…sql:62-63, :74-75`; `Budget.java:33`; `Expense.java:28`; recusa provada em `:202-238` |
| Ac. r1 nº2 — teste autocontido (não escreve no banco do perfil ativo) | atendido | `ProjectSchemaMigrationTest.java:39-40` (`@ActiveProfiles("test")` + `@Transactional`); dados agora usam UUID/categoria únicos (`:240-256`) |
| Ac. r1 nº3 — asserção da V2 desacoplada da versão corrente do Flyway | atendido | `ProjectSchemaMigrationTest.java:60-70` (filtra por `"2"` em `flyway.info().applied()`, não `current()`) — um `V3` não quebra o teste |
| Ac. r1 nº4 — enums em `com.obracerta.enums` (irmão de `model/`) | atendido | `enums/ProjectType.java:1`, `enums/ProjectStatus.java:1`; sem resíduo em `com.obracerta.model.enums` (grep no repo: nenhuma referência fora dos pareceres); `plan.md:57-58` corrigido no diff |

## Apontamentos

*(nenhum)*

## Observações (não bloqueiam)

- **A V2 agora muta dados além do CA10** (`V2…sql:38-51`): cria uma obra sintética `"Obra anterior a migracao"` (`RENOVATION`/`IN_PROGRESS`) para cada usuário com `budgets`/`expenses` órfãos e reaponta as linhas. Em banco vazio (CI/Neon) não faz nada. É consequência legítima do `NOT NULL` exigido pelo `architecture.md:176,197` e aceito na r1, mas tem efeito visível: num banco de dev populado, cada usuário passa a ver essa obra na listagem de CA2. Registro para consciência, não como escopo inflado.
- **Editar a V2 altera o checksum** do Flyway. Legítimo enquanto ela não estiver aplicada em ambiente compartilhado (branch não mesclada) — mas se a V2 original já tiver rodado em algum banco local (o parecer de código r1 sugere que o teste antigo chegou a tocar o banco `dev`), a subida falhará com *checksum mismatch* e exigirá um `flyway repair` pontual. É operação de ambiente, não defeito do diff.
- **`var foreignKeys = jdbcTemplate.query(…)` com classe anônima** (`ProjectSchemaMigrationTest.java:132-136`): o teste depende de a inferência instanciar `T` no tipo anônimo para o acesso `fk.tableName` compilar. Não consegui compilar para confirmar; se o build rejeitar, é ajuste de uma linha (declarar um `record`/classe nomeada). Fora do meu alcance julgar sem rodar.
- Índices parciais do `architecture.md:227-236` (`idx_budgets_project_category_active` etc.) e `deleted_at` em `budgets`/`expenses` seguem ausentes — já relatados na r1 como dívida pré-existente, fora do CA10.
