# Parecer de Conformidade — Tarefa 7

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA7 — Cancelar, X e Escape sem alterações; backdrop inerte; bloqueio de duplo envio | atendido | `apps/web/src/app/features/expenses/expense-edit.spec.ts:243`; `apps/web/src/app/features/expenses/expense-delete.spec.ts:38` |
| CA9 — Isolamento com 404, preservação financeira e autorização antes do storage em todas as mutações | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:112`; `ExpenseDeletionIntegrationTest.java:142`; `ExpenseReceiptRemovalIntegrationTest.java:132`; `ExpenseReceiptReplacementIntegrationTest.java:168` |
| CA9 — Validações obrigatórias, limites numéricos e datas em despesa já pendente, sem gravação parcial | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:124`; `apps/web/src/app/features/expenses/expense-edit.spec.ts:124` |
| CA10 — Orientação sem obra, preservação na atualização da mesma obra e abandono na troca real | atendido | `apps/web/src/app/features/expenses/expense-mutation-context.spec.ts:44`; `:53`; `:64` |
| CA10 — Ignorar sucessos e erros tardios, inclusive A → B → A | atendido | `apps/web/src/app/features/expenses/expense-mutation-context.spec.ts:74`; `:93`; `expense-delete.spec.ts:93`; `expense-receipt-edit.spec.ts:83`; `:168` |
| CA10 — Preservar formulário aberto após falha; consultar estado manualmente sem reenvio automático | atendido | `apps/web/src/app/features/expenses/expense-edit.spec.ts:263`; `expense-delete.spec.ts:83`; `expense-receipt-edit.spec.ts:176` |
| CA10 — Consulta com 404 remove dados ativos sem anunciar exclusão; leitura antiga não desfaz exclusão confirmada | atendido | `apps/web/src/app/features/expenses/expense-delete.spec.ts:101`; `:115`; `expense-detail.component.ts:153` |
| CA6 e abandono por falha de armazenamento — Exclusão financeira permanece concluída; falha física informada sem recuperação automática | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseDeletionIntegrationTest.java:115`; `apps/web/src/app/features/expenses/expense-delete.spec.ts:75` |
| CA1–CA5 e CA8 — Implementação principal | fora desta tarefa | `specs/6-edicao-exclusao-despesas/plan.md:141` |

A correção autorizada da rodada 2 acrescenta exclusivamente `status='PENDING'` à fixture, preservando as asserções (`apps/api/src/test/java/com/obracerta/service/ProjectLifecycleTest.java:110`).

Logs reais conferidos: Angular com **344 sucessos**, API focal com **104 testes aprovados**, schema com **13 testes aprovados** e API completa da rodada 2 com **287 testes, zero falhas, zero erros e zero ignorados**, incluindo os dois testes de `ProjectLifecycleTest` (`apps/api/target/us04-t7-full-backend-r2-root.log:940`; `:946`; `:949`). Build Angular concluído, com aviso de tamanho do bundle.

As alterações documentais preexistentes e a exclusão da spec da US05 foram excluídas do julgamento conforme o despacho. Nenhum arquivo foi alterado nesta revisão.

## Apontamentos
