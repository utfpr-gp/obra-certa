# Parecer de Conformidade — Tarefa 5

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA6 — “Excluir” abre confirmação identificando a despesa; somente confirmar solicita a exclusão. | atendido | `apps/web/src/app/features/expenses/expense-detail.component.ts:85`; `expense-delete.spec.ts:38` |
| CA6 — Exclusão lógica da despesa e do pagamento na mesma transação, preservando registros, histórico e teto; gasto deixa os agregados ativos. | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:75`; `apps/api/src/test/java/com/obracerta/controller/ExpenseDeletionIntegrationTest.java:82` |
| CA6 — Apagar o comprovante somente após o commit financeiro, uma vez; ausência de anexo confirmado não acessa armazenamento. | atendido | `ExpenseService.java:82`; `ExpenseService.java:90`; `ExpenseDeletionIntegrationTest.java:61`; `ExpenseDeletionIntegrationTest.java:126` |
| CA6 — Falha no armazenamento mantém exclusão financeira e retorna `receiptDeletionFailed=true`, sem trabalho durável ou promessa de limpeza futura. | atendido | `ExpenseService.java:89`; `ExpenseDeletionIntegrationTest.java:115`; `expense-delete.spec.ts:75` |
| CA6 — Falha na gravação financeira não apaga o comprovante nem anuncia sucesso. | atendido | `ExpenseService.java:84`; `ExpenseDeletionIntegrationTest.java:132`; `expense-detail.component.ts:188` |
| CA6 — Sucesso retira os dados ativos da consulta e oferece retorno a Contas a Pagar, com aviso específico quando o arquivo não foi apagado. | atendido | `expense-detail.component.ts:25`; `expense-detail.component.ts:181`; `expense-delete.spec.ts:48` |
| CA7 — Cancelar, X e Escape antes do envio não solicitam alteração; backdrop permanece inerte. | atendido | `expense-delete.spec.ts:55`; `expense-delete.spec.ts:64`; `apps/web/src/app/shared/components/confirm-modal/confirm-modal.component.html:2` |
| CA7 — Confirmação bloqueada durante envio; fechar o diálogo durante a requisição não permite outro DELETE nem anuncia cancelamento no servidor. | atendido | `expense-detail.component.ts:173`; `expense-delete.spec.ts:41`; `expense-delete.spec.ts:67` |
| CA9 — Recurso alheio, inexistente, excluído ou de obra excluída retorna 404 antes de acessar armazenamento e sem alterações. | atendido | `ExpenseService.java:76`; `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:16`; `ExpenseDeletionIntegrationTest.java:143` |
| CA6/CA9 — Após exclusão, repetição, leitura, edição, download, remoção e upload do comprovante retornam 404 sem acessar armazenamento. | atendido | `ExpenseDeletionIntegrationTest.java:103` |
| CA1–CA5; consolidação completa de CA8–CA10. | fora desta tarefa | `specs/6-edicao-exclusao-despesas/plan.md` — distribuição entre tarefas |
| Verificação executada pelo orquestrador, conferida nos logs originais: 8 testes focais de exclusão e 148 testes backend aprovados; 124 testes frontend aprovados; build concluído. Sem reexecução neste parecer, conforme despacho. | atendido | `apps/api/target/us04-t5-green-root.log`; `apps/web/us04-t5-green-root.log`; `apps/web/us04-t5-build-root.log` |

## Apontamentos
