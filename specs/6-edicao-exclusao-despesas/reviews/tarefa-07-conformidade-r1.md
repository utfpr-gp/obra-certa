# Parecer de Conformidade — Tarefa 7

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA7 — Cancelar, X e Escape antes do envio não solicitam alterações; backdrop inerte | atendido | `apps/web/src/app/features/expenses/expense-edit.spec.ts:243`; `apps/web/src/app/features/expenses/expense-delete.spec.ts:55` |
| CA7 — Confirmação desabilitada e bloqueio de submissão repetida | atendido | `apps/web/src/app/features/expenses/expense-edit.spec.ts:254`; `apps/web/src/app/features/expenses/expense-delete.spec.ts:38` |
| CA9 — Matriz 404 sem alteração financeira nem acesso ao storage antes da autorização | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:112`; `ExpenseDeletionIntegrationTest.java:142`; `ExpenseReceiptRemovalIntegrationTest.java:132`; `ExpenseReceiptReplacementIntegrationTest.java:168` |
| CA9 — Campos obrigatórios, limites numéricos e coerência das datas, preservando despesa pendente e pagamento diante de entradas inválidas | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:124`; `apps/web/src/app/features/expenses/expense-edit.spec.ts:124`; `expense-edit.spec.ts:221` |
| CA10 — Sem obra orienta seleção; atualização da mesma obra preserva formulário; troca real abandona alterações não enviadas | atendido | `apps/web/src/app/features/expenses/expense-mutation-context.spec.ts:44`; `expense-mutation-context.spec.ts:53`; `expense-mutation-context.spec.ts:64` |
| CA10 — Respostas tardias de sucesso/erro são ignoradas, inclusive A → B → A | atendido | `apps/web/src/app/features/expenses/expense-mutation-context.spec.ts:74`; `expense-mutation-context.spec.ts:93`; `apps/web/src/app/features/expenses/expense-delete.spec.ts:93`; `expense-receipt-edit.spec.ts:83`; `expense-receipt-edit.spec.ts:168` |
| CA10 — Falha preserva campos enquanto o formulário permanece aberto; resposta perdida permite consulta manual sem reenvio automático | atendido | `apps/web/src/app/features/expenses/expense-edit.spec.ts:263`; `apps/web/src/app/features/expenses/expense-delete.spec.ts:83`; `expense-receipt-edit.spec.ts:176` |
| CA10 — GET 404 retira dados ativos sem anunciar exclusão confirmada; leitura anterior não ressuscita despesa após exclusão confirmada | atendido | `apps/web/src/app/features/expenses/expense-delete.spec.ts:101`; `expense-delete.spec.ts:115`; `apps/web/src/app/features/expenses/expense-detail.component.ts:163` |
| CA6 e abandono por falha no armazenamento — Exclusão financeira permanece concluída e a falha física é informada, sem recuperação automática | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseDeletionIntegrationTest.java:115`; `apps/web/src/app/features/expenses/expense-delete.spec.ts:75` |
| CA1–CA5 e CA8 — Implementação principal | fora desta tarefa | `specs/6-edicao-exclusao-despesas/plan.md:141` |

Evidências reais conferidas nas execuções do agente principal: RED Angular com 4 falhas e 45 sucessos (`apps/web/us04-t7-red-frontend.log:179`), suíte Angular com 344 sucessos (`apps/web/us04-t7-full-frontend.log:451`) e API focal com 104 testes sem falhas ou erros (`apps/api/target/us04-t7-focal-backend-root.log:306`). Build concluído, com aviso de tamanho do bundle (`apps/web/us04-t7-build.log:28`).

**A validação completa da API foi reprovada:** 287 testes, zero falhas e três erros (`apps/api/target/us04-t7-full-backend-pool-root.log:880`). Dois são timeouts de conexão dos testes de schema com pool limitado a dois; o terceiro é a fixture preexistente de `ProjectLifecycleTest.java:110`, cujo INSERT omite o `status` obrigatório. Esses problemas estão fora do diff da Tarefa 7 e não demonstram violação dos critérios acima, mas impedem declarar a validação global verde.

As alterações documentais e a exclusão da spec da US05 foram lidas e excluídas do julgamento, conforme o despacho.

## Apontamentos
