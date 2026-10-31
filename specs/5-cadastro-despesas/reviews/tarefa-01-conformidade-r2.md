# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Cadastro quitado por valor direto ou calculado, com cálculo verificado no servidor | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:34`; `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:65` |
| CA1 — Total automático no formulário e consulta individual real após salvar | atendido | `apps/web/src/app/features/expenses/expense-form.component.ts:43`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:45` |
| CA1 — Persistência e inclusão no gasto acumulado da US07 | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:65` |
| CA10 — Campos obrigatórios, valores positivos, limites e requisitos próprios de cada modo | atendido | `apps/api/src/main/java/com/obracerta/model/dto/expense/ExpenseCreateDTO.java:8`; `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:40`; `apps/web/src/app/features/expenses/expense-form.component.ts:75` |
| CA10 — Seleção de fornecedor próprio ou criação inline com nome e CNPJ, sem escrita em lançamentos inválidos | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:50`; `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:88` |
| CA7 — Isolamento na criação e consulta individual, respeitando exclusão lógica | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:36`; `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:15`; `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:103` |
| Migração prevista — titularidade, separação dos fornecedores legados compartilhados e quitação persistida | atendido | `apps/api/src/main/resources/db/migration/V8__prepare_expense_registration.sql:1`; `apps/api/src/test/java/com/obracerta/migration/ExpenseRegistrationMigrationTest.java:16` |
| Correção aceita r1 — validações de domínio retornam `ApiErrorResponse` padrão | atendido | `apps/api/src/main/java/com/obracerta/exception/GlobalExceptionHandler.java:17`; `apps/api/src/test/java/com/obracerta/controller/ExpenseValidationContractTest.java:45` |
| Correção aceita r1 — botão “Cadastrar conta” dentro de `/contas`, sem item de cadastro no menu principal | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:12`; `apps/web/src/app/features/expenses/accounts-navigation.spec.ts:15`; `apps/web/src/app/shared/components/sidebar/sidebar.component.spec.ts:29` |
| Consulta individual sem antecipar listagem completa ou gestão de pagamentos | atendido | `apps/api/src/main/java/com/obracerta/controller/ExpenseController.java:19`; `apps/web/src/app/features/expenses/accounts-page.component.ts:9` |
| CA2–CA6, CA8–CA9, CA11–CA13 e CA7 relativo a comprovantes | fora desta tarefa | `specs/5-cadastro-despesas/plan.md` — tarefas 2–10 |

Diff integral conferido com `git diff a759ee390202c63dff785ccfaa6db0f7eae370a2`, incluindo código staged e decisões aceitas da rodada 1.

Testes executados independentemente:

- Em `apps/api`, perfil `test`, PostgreSQL 16.15 isolado em `localhost:5432/obracerta_us03_conformidade`: `.\mvnw.cmd '-Dtest=ExpenseServiceTest,ExpenseValidationContractTest,ExpenseRegistrationIntegrationTest,ExpenseRegistrationMigrationTest' test` — **25 testes, zero falhas, zero erros; BUILD SUCCESS**. Flyway aplicou V1–V8 e o teste específico validou o backfill de V7 para V8.
- Em `apps/web`: `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/expense-flow.spec.ts --include=src/app/features/expenses/accounts-navigation.spec.ts --include=src/app/shared/components/sidebar/sidebar.component.spec.ts` — **10 testes aprovados**.

As execuções iniciais foram bloqueadas pelo sandbox no PostgreSQL e no Chrome. Ambas passaram após repetição com acesso ampliado. Build não executado, conforme despacho. Nenhum arquivo fonte ou parecer foi alterado ou gravado por este revisor.

## Apontamentos
