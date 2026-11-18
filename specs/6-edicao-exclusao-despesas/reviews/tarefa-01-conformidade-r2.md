# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Formulário preenchido e atualização da mesma despesa, mantendo obra e fornecedor | atendido | apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.ts:47; apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.html:7; apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:62 |
| CA1 — Valores existentes preservam sua magnitude; digitação monetária utiliza BRL e envia reais numéricos | atendido | apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.ts:74; apps/web/src/app/features/expenses/expense-edit.spec.ts:29; apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.spec.ts:24 |
| CA2 — Cálculo direto/calculado, reclassificação dos agregados e preservação dos tetos | atendido | apps/api/src/main/java/com/obracerta/service/ExpenseService.java:88; apps/api/src/main/java/com/obracerta/service/ExpenseService.java:101; apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:75 |
| CA2 — Alerta de consumo a partir de 100% de teto positivo; falha ao consultar orçamento preserva edição confirmada | atendido | apps/web/src/app/features/expenses/expense-detail.component.ts:139; apps/web/src/app/features/expenses/expense-detail.component.ts:148; apps/web/src/app/features/expenses/expense-edit.spec.ts:55 |
| CA9 — Campos obrigatórios, limites numéricos, recusa sem escrita parcial e destaque dos campos inválidos | atendido | apps/api/src/main/java/com/obracerta/model/dto/expense/ExpenseUpdateDTO.java:7; apps/api/src/main/java/com/obracerta/service/ExpenseService.java:119; apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:87; apps/web/src/app/features/expenses/expense-edit.spec.ts:51 |
| CA9 — Quantidade inválida produz validação sem exceção nem envio | atendido | apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.ts:38; apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.spec.ts:58 |
| CA9 — Compra não ultrapassa vencimento pendente existente; igualdade permitida | atendido | apps/api/src/main/java/com/obracerta/service/ExpenseService.java:85; apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:101; apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.spec.ts:68 |
| CA9 — Recursos alheios, inexistentes ou excluídos retornam 404 sem alteração | atendido | apps/api/src/main/java/com/obracerta/service/ExpenseService.java:79; apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java:108 |
| CA3–CA8 e consolidação de CA9/CA10 previstas nas tarefas seguintes | fora desta tarefa | specs/6-edicao-exclusao-despesas/plan.md:140 |

Execuções delegadas ao orquestrador e conferidas nos logs: focal frontend **19/19**, regressão frontend **102/102** e build concluído. Evidências: `apps/web/expense-edit-r2-green-final-root.log:51`, `apps/web/expense-edit-r2-regression-root.log:147` e `apps/web/expense-edit-r2-build-root.log:28`. O build registra aviso de bundle de 633,85 kB para orçamento de 500 kB em `apps/web/expense-edit-r2-build-root.log:30`.

A regressão backend da rodada 1 permanece válida: **68 testes, nenhuma falha, erro ou ignorado**, conforme `apps/api/target/us04-t1-regression-backend.log:274`. A correção desta rodada preservou a lógica Java, alterando somente suas terminações de linha, conforme o diff e o registro em `specs/6-edicao-exclusao-despesas/reviews/tarefa-01-historico-tdd-r2.md`. A retomada do TDD foi autorizada pelo autor e registrada em `specs/6-edicao-exclusao-despesas/reviews/tarefa-01-retomada-tdd-r2.md`.

## Apontamentos
