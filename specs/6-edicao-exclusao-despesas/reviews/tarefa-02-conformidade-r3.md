# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

Revisão r3 da retomada excepcional após R2, autorizada pelo autor e registrada em `specs/6-edicao-exclusao-despesas/reviews/tarefa-02-decisoes-r2.md:10`. Os pareceres anteriores permanecem válidos como registro histórico. Os dois itens aceitos estão resolvidos.

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — registra quitação e data somente na transição pendente → paga | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:150`; `ExpensePaymentUpdateIntegrationTest.java:162` |
| CA3 — edição que mantém pagamento quitado preserva a data efetiva | atendido | `ExpenseService.java:150`; `ExpensePaymentUpdateIntegrationTest.java:268` |
| CA3 — edição de pagamento legado quitado não inventa data desconhecida | atendido | `ExpenseService.java:150`; `ExpensePaymentUpdateIntegrationTest.java:306` |
| CA3 — paga → pendente reutiliza o registro; cria somente quando ausente | atendido | `ExpenseService.java:130`; `ExpensePaymentUpdateIntegrationTest.java:88` |
| CA3 — ciclos preservam identificador, quitação mantém linha e reabertura limpa `paidAt` | atendido | `ExpensePaymentUpdateIntegrationTest.java:162`; `ExpensePaymentUpdateIntegrationTest.java:201` |
| CA3 e CA9 — vencimento obrigatório, igualdade permitida e rejeição temporal sem gravação parcial | atendido | `ExpenseService.java:112`; `ExpensePaymentUpdateIntegrationTest.java:132`; `ExpensePaymentUpdateIntegrationTest.java:336` |
| Migração prevista — backfill preserva situação e mantém quitação desconhecida nula | atendido | `V10__add_payment_status_and_paid_at.sql:1`; `PaymentSchemaMigrationTest.java:49` |
| Item aceito da retomada — teste comprova especificamente a constraint de status | atendido | `apps/api/src/test/java/com/obracerta/migration/PaymentSchemaMigrationTest.java:60` |
| CA3 e CA9 — formulário preenchido, alternância, validação temporal e apresentação do resultado salvo | atendido | `expense-edit-modal.component.ts:54`; `expense-edit-modal.component.spec.ts:68`; `expense-edit.spec.ts:119` |
| Critérios atribuídos às tarefas seguintes | fora desta tarefa | `specs/6-edicao-exclusao-despesas/plan.md` |

Os novos testes verificam resposta HTTP e persistência após `flush/clear`, preservando o identificador do pagamento. O teste da migration utiliza uma despesa sem pagamento, vencimento válido e exige SQLSTATE `23514` e `chk_pending_payments_status`, eliminando o falso positivo por unicidade.

Conferidos os logs originais executados pelo orquestrador: RED com três testes e duas falhas esperadas; GREEN com **70 testes, zero falhas e zero erros**, usando PostgreSQL 16.15. Frontend e SQL não mudaram nesta retomada; permanecem as evidências anteriores de 104 testes Angular aprovados, TypeScript e build concluídos. Nenhum arquivo foi alterado nem teste executado por este revisor.

## Apontamentos
