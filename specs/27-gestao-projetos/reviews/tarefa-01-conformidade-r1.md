# Parecer de Conformidade — Tarefa 01

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA10 — Tabela `projects` criada com integridade referencial (`user_id -> users.id`) | atendido | `V2__create_projects_and_project_fk.sql:7-19`, `Project.java:26-28` |
| CA10 — Tabela `budgets` recebe coluna `project_id` com FK para `projects(id)` | atendido | `V2__create_projects_and_project_fk.sql:23-24`, `Budget.java:32-34` |
| CA10 — Tabela `expenses` recebe coluna `project_id` com FK para `projects(id)` | atendido | `V2__create_projects_and_project_fk.sql:26-27`, `Expense.java:27-29` |
| CA10 — `ddl-auto=validate` passa sem divergências | atendido | Hibernate inicializa com sucesso; logs confirmam `Successfully validated 2 migrations` |
| CA10 — Índice parcial para busca de projetos ativos | atendido | `V2__create_projects_and_project_fk.sql:21` (`idx_projects_user_active`) |

## Apontamentos

*(nenhum)*
