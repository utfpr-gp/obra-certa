# Parecer de Conformidade — Tarefa 4

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA4 — Implementação dos filtros combinados sobre registros e totalizadores | atendido | `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:18`; `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:252` |
| CA4 — Excluir despesas sem vencimento quando houver filtro de vencimento | atendido | `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:35`; `apps/api/src/test/java/com/obracerta/controller/ExpenseFilterListingIntegrationTest.java:78` |
| CA4 — Aplicar/limpar retorna à primeira página e preserva a aba | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:265`; `apps/web/src/app/features/expenses/accounts-page.component.spec.ts:214` |
| CA4 — Seleção de fornecedores limitada ao cadastro autorizado | atendido | `apps/api/src/main/java/com/obracerta/service/SupplierService.java:19`; `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:257`; `apps/api/src/test/java/com/obracerta/controller/ExpenseFilterListingIntegrationTest.java:104` |
| CA4 — Testes demonstram o recorte por fornecedor e os limites superiores dos períodos | não atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseFilterListingIntegrationTest.java:58` |
| CA7 — Intervalos invertidos destacados e bloqueados antes do HTTP; registros e totais antigos removidos | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:172`; `:265`; `:289`; `apps/web/src/app/features/expenses/accounts-page.component.spec.ts:187` |
| CA7 — API recusa intervalos invertidos e parâmetros inválidos | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:276`; `apps/api/src/test/java/com/obracerta/controller/ExpenseFilterListingIntegrationTest.java:86` |
| CA1–CA3, CA5–CA6 e CA8–CA11 — Entregas atribuídas às demais tarefas | fora desta tarefa | `specs/7-visualizacao-filtros-despesas/plan.md` |

Evidências de execução conferidas nos logs do orquestrador: teste integrado de filtros com 3 testes aprovados, componente com 9 testes aprovados e suíte frontend com 353 testes aprovados. O orquestrador também informou suíte API com 299 testes aprovados. Não executei novamente as suítes nem alterei arquivos.

## Apontamentos

1. **Os testes não demonstram que o fornecedor restringe os resultados nem que os limites superiores dos períodos excluem registros posteriores** — `apps/api/src/test/java/com/obracerta/controller/ExpenseFilterListingIntegrationTest.java:58`
   
   Critério violado: `specs/7-visualizacao-filtros-despesas/spec.md:83`, CA4: os intervalos inclusivos e o fornecedor devem combinar-se e atualizar registros e totalizadores. A exigência de testar cada filtro isolado e suas combinações consta também da linha 50.
   
   Evidência: os registros preparados utilizam o mesmo fornecedor próprio; a consulta isolada por fornecedor, nas linhas 105–107, possui somente uma despesa. Assim, ignorar o predicado `supplierId` preservaria os resultados esperados. Também não existe despesa posterior aos limites superiores que devesse ser excluída: na consulta combinada, o terceiro registro já é excluído pela aba `PENDING`; na consulta de compra com limites iguais, o limite inferior já exclui o primeiro registro. Remover os predicados `purchaseDateTo` e `dueDateTo` preservaria as asserções atuais. A implementação contém esses predicados, mas os testes verdes não comprovam esses recortes do CA4.
