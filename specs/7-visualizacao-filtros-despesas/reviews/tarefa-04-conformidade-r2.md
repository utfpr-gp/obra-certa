# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA4 — Filtros combinados atualizam registros e totalizadores | atendido | `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:18`; `apps/api/src/test/java/com/obracerta/controller/ExpenseFilterListingIntegrationTest.java:59` |
| CA4 — Período inclusivo de compra exclui datas anteriores e posteriores | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseFilterListingIntegrationTest.java:87` |
| CA4 — Período inclusivo de vencimento exclui datas externas e registros sem vencimento | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseFilterListingIntegrationTest.java:109` |
| CA4 — Categorias e fornecedor restringem registros e os três totais | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseFilterListingIntegrationTest.java:59`; `:130`; `:163` |
| CA4 — Fornecedor pertence ao cadastro autorizado do usuário | atendido | `apps/api/src/main/java/com/obracerta/service/SupplierService.java:19`; `apps/api/src/test/java/com/obracerta/controller/ExpenseFilterListingIntegrationTest.java:179` |
| CA4 — Aplicar/limpar retorna à primeira página e preserva a aba | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:265`; `:280`; `apps/web/src/app/features/expenses/accounts-page.component.spec.ts:214` |
| CA7 — Tela destaca intervalos invertidos, bloqueia HTTP e remove resultados antigos | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:172`; `:265`; `:289`; `apps/web/src/app/features/expenses/accounts-page.component.spec.ts:187` |
| CA7 — API recusa intervalos invertidos e parâmetros inválidos | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:276`; `apps/api/src/test/java/com/obracerta/controller/ExpenseFilterListingIntegrationTest.java:145` |
| CA1–CA3, CA5–CA6 e CA8–CA11 — Entregas atribuídas às demais tarefas | fora desta tarefa | `specs/7-visualizacao-filtros-despesas/plan.md` |

O apontamento 1 da rodada 1 foi resolvido. Os novos cenários incluem outro fornecedor próprio e despesas posteriores aos limites finais, tanto isoladamente quanto na combinação. As asserções verificam IDs, quantidade e totais pago, pendente e geral; ignorar os predicados antes desprotegidos agora altera os resultados esperados.

Conferi o relatório Surefire da execução realizada pelo orquestrador nesta rodada: **6 testes, zero falhas, zero erros e zero ignorados**, com PostgreSQL 16. Os resultados de 299 testes API, 353 testes frontend e build aprovado pertencem à rodada 1 e não foram repetidos nesta rodada. Produção permaneceu inalterada; não executei novamente as suítes nem alterei arquivos.

## Apontamentos
