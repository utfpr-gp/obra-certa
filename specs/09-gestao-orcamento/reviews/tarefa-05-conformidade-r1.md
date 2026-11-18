# Parecer de Conformidade — Tarefa 5

**Veredito:** APONTAMENTOS

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Grava R$ 0,00 no registro ativo existente, sem apagá-lo (CA4) | atendido | `apps/api/src/main/java/com/obracerta/service/BudgetService.java:145-150`; `apps/api/src/test/java/com/obracerta/service/BudgetServiceTest.java:299-334` |
| Recalcula saldo, percentual e estado da categoria após zerar (CA4) | atendido | `BudgetServiceTest.java:319-324` (saldo `-300`, `percentage` nulo, `NO_BUDGET`); `BudgetService.java:152-157` |
| `POST /api/budgets/{projectId}/categories/{categoryId}/zero` → 200 com `BudgetCategoryDTO` | atendido | `apps/api/src/main/java/com/obracerta/controller/BudgetController.java:41-46`; `apps/api/src/test/java/com/obracerta/controller/BudgetControllerTest.java:86-109` |
| 404 "Orçamento não encontrado" quando não há registro ativo para zerar | atendido | `BudgetService.java:145-147`; `BudgetServiceTest.java:336-351` |
| 404 "Projeto não encontrado" para obra de outro usuário na escrita do CA7 | atendido | `BudgetService.java:142-144`; `BudgetServiceTest.java:353-364` |
| Frontend envia `POST` correto, sem corpo e sem parâmetros | atendido | `apps/web/src/app/core/services/budget.service.ts:30-35`; `apps/web/src/app/core/services/budget.service.spec.ts:88-99` |
| "Zerar" abre o `ConfirmModal` com título/descrição da categoria | atendido | `apps/web/src/app/features/budgets-page/budgets-page.component.html:170-179,209-217`; `budgets-page.component.spec.ts:409-424` |
| Confirmar chama `zeroBudget` e recarrega o painel | atendido | `budgets-page.component.ts:151-168`; `budgets-page.component.spec.ts:426-437` |
| Cancelar não chama a API nem recarrega | atendido | `budgets-page.component.spec.ts:439-450` |
| `Escape` não chama a API nem recarrega | atendido | `confirm-modal.component.ts:23-28`; `budgets-page.component.spec.ts:452-464` |
| Fechar pelo X equivale a cancelar (CA4) | atendido | `confirm-modal.component.html:21-29` + `confirm-modal.component.spec.ts:58-66`; página ligada em `budgets-page.component.html:215` |
| "Zerar" só quando `hasBudget && plannedAmount > 0` | atendido na implementação; prova de teste parcial | `budgets-page.component.html:161-179` — ver apontamento 1 |
| Nenhuma migration | atendido | `git status`: 9 arquivos rastreados, nenhum `V*.sql` |
| Alerta de despesas sem teto após zerar (CA4/CA3) | fora desta tarefa (T7) | `specs/09-gestao-orcamento/plan.md:192-196` |
| 409/RN02, troca de obra/duplo envio e rede/401 (CA5/CA9/CA10) | fora desta tarefa (T6/T8/T9) | despacho da tarefa; `plan.md:175-190` |
| Testes da tarefa executados | atendido (reportado) | Despacho: backend 63/63, frontend 129/129. As contagens conferem (11 `@Test` em `BudgetServiceTest`, 4 em `BudgetControllerTest`). Não reexecutei: o shell desta sessão bloqueou Maven e `ng test`. |

## Apontamentos

1. **O teste que diz provar que "Zerar" aparece só para categoria com valor positivo não isola a condição `plannedAmount > 0`** — `apps/web/src/app/features/budgets-page/budgets-page.component.spec.ts:409` (fixture em `:72-81`)
   Critério violado: `specs/09-gestao-orcamento/plan.md:60` ("'Zerar' só quando `plannedAmount > 0`") e o desenho aprovado no despacho; regra do agente para "teste que não prova o critério que diz provar".
   Evidência: as três categorias com botão têm `plannedAmount > 0`, e a única ausência verificada (`cat-hidraulica`, `:72-81`) tem `hasBudget: false` — logo a ausência é explicada apenas pela primeira condição. Nenhum fixture tem `hasBudget: true` com `plannedAmount: 0`, que é exatamente o estado pós-zeramento. Se `@if (category.plannedAmount > 0)` fosse removido de `budgets-page.component.html:170`, os quatro testes novos continuariam verdes; falta a asserção de que `zero-budget-<categoria>` não existe para uma linha `NO_BUDGET` com registro ativo.
