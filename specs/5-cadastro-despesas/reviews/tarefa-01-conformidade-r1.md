# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Cadastro quitado por valor direto ou calculado, cálculo no servidor e gasto acumulado | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:34`; `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:65` |
| CA1 — Formulário com total calculado automaticamente e consulta individual após salvar | atendido | `apps/web/src/app/features/expenses/expense-form.component.ts:43`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:45` |
| CA10 — Campos obrigatórios, valores positivos e exigências específicas de cada modo | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:40`; `apps/web/src/app/features/expenses/expense-form.component.ts:75` |
| CA10 — Seleção de fornecedor próprio ou criação inline com nome e CNPJ, sem fornecedor órfão por validação inválida | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:50`; `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:88` |
| CA7 — Isolamento na criação e consulta individual; exclusão lógica respeitada | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:36`; `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:15`; `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:103` |
| Migração de titularidade e backfill de fornecedores legados | atendido | `apps/api/src/main/resources/db/migration/V8__prepare_expense_registration.sql:6`; `apps/api/src/test/java/com/obracerta/migration/ExpenseRegistrationMigrationTest.java:16` |
| Consulta individual sem antecipar listagem completa | atendido | `apps/api/src/main/java/com/obracerta/controller/ExpenseController.java:11`; `apps/web/src/app/app.routes.ts:29` |
| CA2–CA6, CA8–CA9, CA11–CA13 e CA7 relativo a comprovantes | fora desta tarefa | `specs/5-cadastro-despesas/plan.md` — tarefas 2–10 |

Diff integral verificado com `git diff a759ee390202c63dff785ccfaa6db0f7eae370a2`.

Testes executados independentemente:

- Em `apps/api`, com perfil `test` e PostgreSQL 16 isolado em `localhost:55435/obracerta_us03_conformidade`: `.\mvnw.cmd '-Dtest=ExpenseServiceTest,ExpenseRegistrationIntegrationTest,ExpenseRegistrationMigrationTest' test` — **20 testes, zero falhas, zero erros; BUILD SUCCESS**.
- Em `apps/web`: `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/expense-flow.spec.ts` — **4 testes aprovados**.

As execuções iniciais encontraram bloqueios do sandbox no PostgreSQL e no Chrome. Ambas passaram após repetição autorizada com acesso ampliado. Build não executado, conforme despacho.

## Apontamentos
