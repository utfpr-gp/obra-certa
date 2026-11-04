# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA5 — Enviar em chave nova, confirmar associação e commit antes de apagar o antigo | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:38`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptReplacementIntegrationTest.java:65` |
| CA5 — Arquivo inválido ou falha de envio preserva o comprovante atual | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:39`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptReplacementIntegrationTest.java:126` |
| CA5 — Falha de associação preserva o antigo, tenta apagar o novo uma vez e informa eventual falha dessa exclusão | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:56`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptReplacementIntegrationTest.java:140` |
| CA5 — Falha ao apagar o antigo mantém o novo disponível e informa `receiptDeletionFailed=true` | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:70`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptReplacementIntegrationTest.java:132` |
| CA5 — Resultado de exclusão transitório, falso em consultas posteriores, sem fila ou recuperação agendada | atendido | `apps/api/src/main/java/com/obracerta/mapper/ExpenseMapper.java:30`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptReplacementIntegrationTest.java:136`; diff integral |
| CA5 — Substituições sucessivas usam chaves distintas e preservam o arquivo atualmente associado | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptReplacementIntegrationTest.java:118` |
| CA9 — MIME, extensão, conteúdo não vazio e limite inclusivo de 10 MiB | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:77`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptReplacementIntegrationTest.java:156` |
| CA9 — Recurso alheio, inexistente, excluído ou de obra excluída retorna 404 antes do storage | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:106`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptReplacementIntegrationTest.java:169` |
| CA5 — Tela permite seleção, apresenta progresso, consulta o novo confirmado e informa falha ao apagar o antigo sem oferecer versão anterior | atendido | `apps/web/src/app/features/expenses/expense-detail.component.ts:56`; `apps/web/src/app/features/expenses/expense-detail.component.ts:181`; `apps/web/src/app/features/expenses/expense-receipt-edit.spec.ts:91` |
| CA5 — Dados financeiros e pagamentos preservados; contratos anteriores de cadastro e remoção mantidos | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptReplacementIntegrationTest.java:103`; `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:93`; regressões executadas |
| Validação executada pelo orquestrador, conferida nesta revisão: 117 testes backend e 115 testes Angular aprovados | atendido | `apps/api/target/us04-t4-green-root.log`; `apps/web/us04-t4-green-complete-root.log`; `specs/6-edicao-exclusao-despesas/reviews/tarefa-04-validacao-r1.md` |
| CA6, CA8 e consolidação completa de CA7/CA9/CA10 | fora desta tarefa | `specs/6-edicao-exclusao-despesas/plan.md` — Tarefas 5 a 7 |

## Apontamentos
