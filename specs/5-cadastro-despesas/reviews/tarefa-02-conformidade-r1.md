# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2 — Lançamento não quitado aceita vencimento igual ou posterior à data da despesa e grava o pagamento vinculado. | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:41`; `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:73`; `apps/api/src/test/java/com/obracerta/controller/PendingExpenseIntegrationTest.java:74` |
| CA2 — Despesa e pagamento são atômicos, incluindo fornecedor inline, sem persistência parcial após falha. | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:32`; `apps/api/src/test/java/com/obracerta/controller/PendingExpenseIntegrationTest.java:94` |
| CA2 — Interface oferece “Não quitada”, envia o vencimento e apresenta o vencimento confirmado na consulta. | atendido | `apps/web/src/app/features/expenses/expense-form.component.html:76`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:46` |
| CA9 — Vencimento anterior é destacado no formulário e bloqueado antes do POST, inclusive após alteração da data da despesa. | atendido | `apps/web/src/app/features/expenses/expense-form.component.ts:56`; `apps/web/src/app/features/expenses/expense-form.component.ts:81`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:34` |
| CA9 — API rejeita vencimento anterior sem gravar despesa, pagamento ou fornecedor inline. | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:43`; `apps/api/src/test/java/com/obracerta/controller/PendingExpenseIntegrationTest.java:86` |
| Obrigatoriedade do vencimento em novos lançamentos não quitados, conforme tarefa e plano. | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:42`; `apps/web/src/app/features/expenses/expense-form.component.html:84`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:34` |
| CA7 — Lançamento a prazo recusa obra alheia, fornecedor alheio e obra excluída com 404, sem gravações financeiras. | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:35`; `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:58`; `apps/api/src/test/java/com/obracerta/controller/PendingExpenseIntegrationTest.java:107` |
| CA1, CA3–CA6, CA8, CA10–CA13 e demais operações de CA7. | fora desta tarefa | Distribuição das tarefas em `specs/5-cadastro-despesas/plan.md`. |

O diff integral foi lido com `git diff 72463ee2bd8c20bea888714ebed4a6676acec2b8`. A decisão de nenhuma migration segue a alternativa prevista no plano: validar novas operações no service e preservar o legado. O diff não altera V1–V8.

O teste de rollback executa `saveAndFlush` real, confirma por SQL a presença dos três registros dentro da transação e força uma exceção depois dos inserts. Após a falha, verifica ausência das gravações. A classe não usa transação gerenciada pelo teste.

Validação independente executada:

- API, em `apps/api`, com perfil `test` e banco isolado `obracerta_us03_conformidade`: `.\mvnw.cmd '-Dtest=PendingExpenseIntegrationTest,ExpenseServiceTest,ExpenseValidationContractTest,ExpenseRegistrationIntegrationTest' test` — **30 testes, zero falhas, zero erros, zero ignorados; BUILD SUCCESS**. Flyway validou oito migrations.
- Web, em `apps/web`: `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/expense-flow.spec.ts` — **8 testes aprovados**.

As tentativas iniciais encontraram restrições de ambiente; os mesmos comandos passaram após execução com permissão ampliada. O banco da aplicação não foi usado. Build Angular ficou com o outro revisor, conforme despacho. A identidade é mockada nos testes de integração; estes resultados não representam verificação independente de JWT.

## Apontamentos
