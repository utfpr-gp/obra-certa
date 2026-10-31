# Parecer de Conformidade — Tarefa 4

**Veredito:** APONTAMENTOS

> **Limitação da revisão:** o harness desta sessão bloqueou a execução de shell para `.\mvnw.cmd test` e `npx.cmd ng test` (`Permission denied: shell`); só comandos de leitura do git rodaram. O parecer abaixo é estático (diff `d3486ba`, código e testes lidos linha a linha). Os testes **não foram executados** — nenhum resultado de execução está sendo atestado aqui.

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — cria o teto quando não há registro ativo | atendido | `BudgetService.java:123-131` (upsert), `BudgetServiceTest.java:197-233` |
| CA1 — atualiza o registro existente sem duplicar (RN08) | atendido | `BudgetService.java:123-131`, `BudgetRepository.java:12`, `BudgetServiceTest.java:235-266` (`times(1)` no `save`) |
| CA1 — um único orçamento ativo por par obra/categoria | atendido | `findByProjectIdAndCategoryIdAndDeletedAtIsNull` + índice único parcial da V6 |
| CA1 — devolve planejado, gasto e percentual recalculados | atendido | `BudgetService.java:133-137` → `toCategory`; `BudgetControllerTest.java:61-96` |
| CA1 — vínculo do orçamento com o dono da obra | atendido | `BudgetService.java:126`, `BudgetServiceTest.java:227-232` |
| CA7 (escrita) — 404 para obra de outro usuário no `PUT` | atendido | `BudgetService.java:118-119`; `BudgetServiceTest.java:268-280`; `BudgetControllerTest.java:98-114` |
| CA7 (escrita) — 404 “Categoria não encontrada” | atendido | `BudgetService.java:120-121`; `BudgetServiceTest.java:282-296`; `BudgetControllerTest.java:116-127` |
| Plano — `BudgetSetDTO` com `@NotNull`, `@DecimalMin("0.01")`, `@Digits(13,2)` e mensagem única | atendido | `BudgetSetDTO.java:9-13` |
| Plano — `PUT` 200 e 404 no payload padrão | atendido | `BudgetController.java:32-38`; `BudgetControllerTest.java:40-127` |
| Plano — modal prova categoria travada, envio do valor e cancelamento | atendido | `budget-form-modal.component.spec.ts:74-145` |
| Plano — página prova “Adicionar orçamento” chamando o serviço e recarregando | atendido | `budgets-page.component.spec.ts:302-324` |
| Plano — página prova “Definir teto” chamando o serviço e recarregando | **não atendido** | `budgets-page.component.spec.ts:340-350` |
| Plano — página prova “Editar” chamando o serviço e recarregando | **não atendido** | `budgets-page.component.spec.ts:326-338` |

## Apontamentos

1. **O `budgets-page.component.spec.ts` não prova “Definir teto” nem “Editar” chamando o serviço e recarregando o painel, como a tarefa exige literalmente** — `apps/web/src/app/features/budgets-page/budgets-page.component.spec.ts:326-350`
   Critério violado: `specs/09-gestao-orcamento/plan.md:150` — “`budgets-page.component.spec.ts` prova ‘Adicionar orçamento’, ‘Definir teto’ e ‘Editar’ chamando o serviço e recarregando o painel”.
   Evidência: os dois testes novos dos caminhos de edição param ao abrir o modal — `opens the edit form…` (`:326-338`) só asserta `select.disabled`, `select.value` e o valor pré-preenchido; `opens the form already on the category when the row offers "Definir teto"` (`:340-350`) só asserta que o select está habilitado e com a categoria pré-selecionada. Nenhum dos dois clica em `budget-form-submit`, asserta `budgetService.setBudget` nem verifica o segundo `getOverview` (recarga), que só existem no teste de “Adicionar orçamento” (`:317-322`). O envio do valor nesses dois caminhos é provado apenas no nível do modal (`budget-form-modal.component.spec.ts:107-131`), portanto o encadeamento página → serviço → recarga não está coberto para edição/definição de teto.
