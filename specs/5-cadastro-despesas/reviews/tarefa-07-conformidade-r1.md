# Parecer de Conformidade — Tarefa 7

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA6 — Falha preserva despesa e pagamento, com pendência persistida e recuperável por GET. | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:29`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:153` |
| CA6 — Alerta usa exatamente a mensagem aprovada após falha de envio. | atendido | `apps/web/src/app/features/expenses/expense-detail.component.ts:122`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:131` |
| CA6 — Tag “Sem comprovante” também aparece para despesa criada sem arquivo, sem falso alerta de falha. | atendido | `apps/web/src/app/features/expenses/expense-detail.component.ts:45`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:108`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:310` |
| CA6 — Destruir e reabrir a consulta permite selecionar novamente o arquivo e reenviar. | atendido | `apps/web/src/app/features/expenses/expense-flow.spec.ts:133` |
| CA6 — Reenvio mantém a mesma despesa, o pagamento original e o total financeiro, sem duplicação. | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:181`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:149` |
| CA6 — Nova falha mantém tag, pendência e alerta; sucesso remove tag e pendência. | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:172`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:138` |
| CA7 — Reenvio em recurso alheio ou excluído retorna 404 antes de acessar storage ou alterar estado. | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:31`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:139` |
| CA6 e fora de escopo — Reenvio na consulta individual, sem seção separada de pendências ou listagem geral. | atendido | `apps/web/src/app/features/expenses/expense-detail.component.ts:23` |
| Validação independente — 22 testes de API aprovados com PostgreSQL 16.15, Flyway e perfil test; 37 testes web aprovados com ChromeHeadless. | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:30`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:12` |

## Apontamentos
