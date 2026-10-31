# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Edição preenchida, atualização da mesma despesa e obra imutável | atendido | apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.ts:46; apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.html:7; apps/api/src/main/java/com/obracerta/service/ExpenseService.java:78; apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:62 |
| CA2 — Recálculo direto/calculado, reclassificação dos gastos e preservação dos tetos | atendido | apps/api/src/main/java/com/obracerta/service/ExpenseService.java:88; apps/api/src/main/java/com/obracerta/service/ExpenseService.java:101; apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:75 |
| CA2 — Alerta após atingir 100% de teto positivo e falha complementar sem desfazer edição confirmada | atendido | apps/web/src/app/features/expenses/expense-detail.component.ts:139; apps/web/src/app/features/expenses/expense-detail.component.ts:148; apps/web/src/app/features/expenses/expense-edit.spec.ts:29; apps/web/src/app/features/expenses/expense-edit.spec.ts:45 |
| CA9 — Obrigatoriedade, valores positivos, limites do cadastro e recusa sem escrita parcial | atendido | apps/api/src/main/java/com/obracerta/model/dto/expense/ExpenseUpdateDTO.java:7; apps/api/src/main/java/com/obracerta/service/ExpenseService.java:119; apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:87; apps/web/src/app/features/expenses/expense-edit.spec.ts:41 |
| CA9 — Data da despesa pendente não ultrapassa vencimento existente; igualdade permitida | atendido | apps/api/src/main/java/com/obracerta/service/ExpenseService.java:85; apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:101; apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.spec.ts:33 |
| CA9 — Despesa alheia, inexistente, excluída ou de obra excluída/alheia retorna 404 sem alteração | atendido | apps/api/src/main/java/com/obracerta/service/ExpenseService.java:79; apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:15; apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:108 |
| Execução focal — logs existentes conferidos: backend 22 testes sem falhas; frontend 8 testes aprovados | atendido | apps/api/target/us04-t1-green-root-backend.log:199; apps/web/expense-edit-green-root.log:40 |
| Regressão adicional do backend — execução solicitada ao orquestrador após chamada de permissão interrompida, sem resultado recebido nesta revisão | fora desta tarefa — registro de execução complementar pendente | specs/6-edicao-exclusao-despesas/plan.md:144 |
| CA3–CA8, consolidação do CA9 e CA10 nas tarefas seguintes | fora desta tarefa | specs/6-edicao-exclusao-despesas/plan.md:140 |

## Apontamentos
