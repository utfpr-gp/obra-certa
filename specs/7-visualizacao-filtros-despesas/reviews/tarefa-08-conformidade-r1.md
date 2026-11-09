# Parecer de Conformidade — Tarefa 8

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Comprovar descrição, categoria, fornecedor, compra, vencimento, valor e situação por despesa | atendido | `apps/web/src/app/features/expenses/accounts-page.component.spec.ts:275`: dois registros distintos, pago sem vencimento e pendente com vencimento; comparação exata por card mobile e linha desktop, em 360 e 1280 px. |
| CA1 — Preservar acesso à consulta individual e ao cadastro | atendido | `apps/web/src/app/features/expenses/accounts-page.component.spec.ts:298`: links individuais conferidos para ambos os registros; `:305`: link e texto “Cadastrar conta”. |
| CA1 — Manter paginação máxima de 15 e inclusão de despesa paga sem pagamento associado | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseListingIntegrationTest.java:102`: integração preservada comprova páginas de 15 + 1 e despesa paga sem `PendingPayment`. |
| CA8 — Preservar isolamento, exclusão lógica e consulta somente leitura | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseListingIntegrationTest.java:61`, `:139` e `:166`: isolamento, ausência de alterações financeiras, despesas excluídas e ausência de acesso ao storage. |
| Pendência da Tarefa 1 — Invalidar respostas antigas em A → B → A e paginação concorrente, conforme CA9 | atendido | Proteção existente em `apps/web/src/app/features/expenses/accounts-page.component.ts:293`; testes de sucesso/erro em `accounts-context.spec.ts:40`, transições entre effects em `:54` e páginas concorrentes em `:63`. Entrega da Tarefa 7 reutilizada sem duplicação. |
| Plano, Tarefa 8 — Encerrar pendências sem ampliar comportamento ou alterar backend | atendido | Diff contra `75164258130f6bce8caaa7a1b39fa8c2de601b47`: alteração funcional da tarefa restrita às asserções frontend e registro de validação; produção, backend e migrations inalterados. Documentos externos excluídos deste juízo conforme despacho. |
| Executar as provas frontend e manter a integração existente | atendido | Execuções do orquestrador conferidas diretamente: `apps/web/tarefa-08-web-target.log`, **40/40**; `apps/web/tarefa-08-web-suite.log`, **388/388**; `apps/api/target/surefire-reports/com.obracerta.controller.ExpenseListingIntegrationTest.txt`, **4 testes, zero falhas, erros ou ignorados**. Não houve execução adicional por este revisor. |
| Demais comportamentos de abas, filtros, ordenação, totalizadores e navegação | fora desta tarefa | `specs/7-visualizacao-filtros-despesas/plan.md:74`: consolidação das pendências da Tarefa 1, sem novos critérios. |

## Apontamentos
