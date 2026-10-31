# Parecer de Conformidade — Tarefa 5

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Gravar zero no orçamento ativo existente, preservando o registro (CA4) | atendido | `apps/api/src/main/java/com/obracerta/service/BudgetService.java:145-150`; `apps/api/src/test/java/com/obracerta/service/BudgetServiceTest.java:299-334` |
| Recalcular saldo, percentual e estado da categoria (CA4) | atendido | `BudgetService.java:152-157`; `BudgetServiceTest.java:319-324` |
| Recarregar o painel após confirmar o zeramento (CA4) | atendido | `apps/web/src/app/features/budgets-page/budgets-page.component.ts:151-168`; `budgets-page.component.spec.ts:473-484` |
| POST `/api/budgets/{projectId}/categories/{categoryId}/zero` retorna 200 com `BudgetCategoryDTO` | atendido | `apps/api/src/main/java/com/obracerta/controller/BudgetController.java:41-46`; `BudgetControllerTest.java:86-109` |
| Orçamento ativo ausente retorna 404 “Orçamento não encontrado” | atendido | `BudgetService.java:145-147`; `BudgetServiceTest.java:336-351` |
| Obra alheia ou inexistente retorna 404 “Projeto não encontrado” antes de acessar orçamentos (CA7) | atendido | `BudgetService.java:142-147`; `BudgetServiceTest.java:353-364` |
| Categoria inexistente retorna 404 “Categoria não encontrada” (CA7) | não atendido | `BudgetService.java:145-147` — apontamento 1 |
| Serviço frontend usa POST na URL correta, sem corpo | atendido | `apps/web/src/app/core/services/budget.service.ts:30-35`; `budget.service.spec.ts:88-99` |
| “Zerar” abre o ConfirmModal e identifica a categoria | atendido | `budgets-page.component.html:170-179,209-217`; `budgets-page.component.spec.ts:409-424` |
| “Zerar” aparece somente com `hasBudget && plannedAmount > 0` | atendido; apontamento da rodada 1 resolvido | `budgets-page.component.html:161-179`; `budgets-page.component.spec.ts:426-471` |
| Cancelar e Escape fecham sem chamar a API ou recarregar o painel (CA4) | atendido | `budgets-page.component.spec.ts:486-511` |
| X emite o mesmo cancelamento, conectado ao fechamento sem requisição (CA4) | atendido | `confirm-modal.component.html:21-29`; `confirm-modal.component.spec.ts:58-66`; `budgets-page.component.html:215` |
| Alerta de auditoria após zerar | fora desta tarefa; T7 | `specs/09-gestao-orcamento/plan.md`, Tarefa 7 |
| RN02/validações, troca de obra/duplo envio e rede/401 | fora desta tarefa; T6/T8/T9 | `specs/09-gestao-orcamento/plan.md`, Tarefas 6, 8 e 9 |
| Nenhuma migration nova | atendido | Diff completo contra `a14e18644d9570c89f3b3ec670254746c9b869e1` |
| Testes frontend executados nesta revisão | atendido: **130 testes passaram** | Em `apps/web`: `npx.cmd ng test --watch=false --browsers=ChromeHeadless`, com execução ampliada após bloqueio de inicialização do navegador |
| Testes backend | execução atribuída ao outro revisor; resultado anterior informado: 63 passaram | Despacho do orquestrador; não reexecutados por este revisor |

## Apontamentos

1. **O zeramento de categoria inexistente devolve a mensagem de orçamento ausente, em vez de “Categoria não encontrada”.** — `apps/api/src/main/java/com/obracerta/service/BudgetService.java:145-147`  
   Critério violado: `specs/09-gestao-orcamento/spec.md:28`, CA7, que inclui a escrita `POST .../zero` e determina “Categoria não encontrada” para categoria inexistente. O plano também declara essa distinção nas decisões de Anti-IDOR.  
   Evidência: após validar a posse da obra, `zeroBudget` consulta diretamente o orçamento pelo `categoryId`. Não consulta a existência da categoria. Para uma obra própria e um identificador de categoria inexistente, a consulta retorna vazia e lança `ResourceNotFoundException("Orçamento não encontrado")`. Já `setBudget`, nas linhas 120–121, distingue categoria inexistente. Os testes novos de zeramento cobrem orçamento ausente e obra alheia, mas não essa diferença de mensagem.
