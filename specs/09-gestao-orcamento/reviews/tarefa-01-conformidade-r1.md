# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| V6 e V7 são aplicadas com sucesso no perfil `test` | atendido | `apps/api/src/test/java/com/obracerta/migration/BudgetSchemaMigrationTest.java:75` |
| `budgets.estimated_amount` passa a ser `NOT NULL` | atendido | `apps/api/src/main/resources/db/migration/V6__budget_constraints_and_unique_index.sql:18`; `BudgetSchemaMigrationTest.java:101` |
| `CHECK >= 0`: zero é aceito e negativo é recusado (base do CA4) | atendido | `V6__budget_constraints_and_unique_index.sql:20-22`; `BudgetSchemaMigrationTest.java:82` e `:117` |
| Um único orçamento ativo por par obra/categoria — base do CA1 | atendido | `V6__budget_constraints_and_unique_index.sql:41-43`; `BudgetSchemaMigrationTest.java:133` |
| Deduplicação de orçamentos ativos mantém o mais recente sem apagar linhas | atendido | `V6__budget_constraints_and_unique_index.sql:24-39`; `BudgetSchemaMigrationTest.java:167` |
| Novo orçamento ativo é permitido após soft delete do anterior | atendido | `V6__budget_constraints_and_unique_index.sql:41-43`; `BudgetSchemaMigrationTest.java:147` |
| As 9 categorias pré-definidas existem uma única vez, com os nomes de `PREDEFINED_CATEGORIES` | atendido | `apps/api/src/main/resources/db/migration/V7__seed_predefined_expense_categories.sql:14-22`; `BudgetSchemaMigrationTest.java:216` |
| `GET /api/expense-categories` devolve `200` com `List<CategoryResponseDTO>` ordenada em pt-BR — base do CA3 | atendido | `apps/api/src/main/java/com/obracerta/controller/ExpenseCategoryController.java:13-24`; `apps/api/src/main/java/com/obracerta/service/ExpenseCategoryService.java:26-34`; `ExpenseCategoryControllerTest.java:45`; `ExpenseCategoryServiceTest.java:27` |
| Rota, DTO e camadas coerentes com o glossário (`/api/expense-categories`, `controller → service → repository`) | atendido | `ExpenseCategoryController.java:13`; `ExpenseCategoryService.java:18-33`; controller não injeta repositório |
| Entidade `Budget` com `nullable = false` no valor | atendido | `apps/api/src/main/java/com/obracerta/model/entity/Budget.java:37` |
| Escopo sem inflação: diff restrito aos arquivos previstos (o `BudgetRepository` já existia e não exigiu alteração para esta tarefa) | atendido | `git diff 9bca9d7` — 10 arquivos, todos previstos |
| Suíte executada (perfil `test`, PostgreSQL) | atendido | `./mvnw.cmd test` — 36 testes, 0 falhas/erros; 13 deles são os testes da tarefa |

## Apontamentos
