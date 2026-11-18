# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA4 — Solicitar exclusão física antes de retirar os metadados; persistir `NONE` somente após sucesso | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:62`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptRemovalIntegrationTest.java:93` |
| CA4 — Arquivo já ausente é tratado como removido | atendido | `apps/api/src/main/java/com/obracerta/integration/S3ReceiptStorage.java:69`; `apps/api/src/test/java/com/obracerta/integration/S3ReceiptStorageTest.java:43`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptRemovalIntegrationTest.java:99` |
| CA4 — Falha do armazenamento mantém o vínculo, retorna erro e permite tentativa manual, sem limpeza automática | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:65`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptRemovalIntegrationTest.java:104`; `apps/web/src/app/features/expenses/expense-receipt-edit.spec.ts:59` |
| CA4 — Falha no banco após exclusão física não anuncia sucesso; repetição manual conclui com objeto ausente | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:68`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptRemovalIntegrationTest.java:114` |
| CA4 — Preservar despesa, pagamentos e valores financeiros | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptRemovalIntegrationTest.java:72`; `apps/web/src/app/features/expenses/expense-receipt-edit.spec.ts:42` |
| CA4 — Exibir “Sem comprovante” somente após resposta confirmada; erro mantém estado e permite nova tentativa | atendido | `apps/web/src/app/features/expenses/expense-detail.component.ts:218`; `apps/web/src/app/features/expenses/expense-receipt-edit.spec.ts:42` |
| CA9 — Despesa alheia, inexistente, excluída ou de obra excluída retorna 404 antes de acessar armazenamento | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:63`; `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:15`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptRemovalIntegrationTest.java:129` |
| Contrato da Tarefa 3 — Sem comprovante confirmado, devolver estado atual sem acessar armazenamento | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:64`; `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptRemovalIntegrationTest.java:144` |
| Proteções do envio — Bloquear requisição repetida e ignorar sucesso tardio após A → B → A | atendido | `apps/web/src/app/features/expenses/expense-detail.component.ts:220`; `apps/web/src/app/features/expenses/expense-receipt-edit.spec.ts:73` |
| CA1–CA3, CA5–CA6, CA8 e consolidação completa de CA7/CA9/CA10 | fora desta tarefa | `specs/6-edicao-exclusao-despesas/plan.md`, distribuição das Tarefas 1–7 |
| Verificação executada pelo orquestrador e conferida nos logs: 97 testes backend e 107 testes Angular aprovados; build concluído | atendido | `apps/api/target/us04-t3-green-root.log`; `apps/web/us04-t3-green-root.log`; `apps/web/us04-t3-build-root.log` |

## Apontamentos
