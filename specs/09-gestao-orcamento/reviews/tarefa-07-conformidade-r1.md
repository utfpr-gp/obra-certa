# Parecer de Conformidade — Tarefa 7

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Mostrar o alerta literal na linha da categoria com despesas ativas e teto zerado ou nunca definido (CA3) | atendido | `apps/web/src/app/features/budgets-page/budgets-page.component.html:126-132`; `budgets-page.component.spec.ts:485-495` |
| Identificar despesas sem teto por `NO_BUDGET` e gasto positivo, sem alertar categoria sem gasto ou com teto (CA3) | atendido | `budgets-page.component.ts:178-180`; `budgets-page.component.spec.ts:523-536` |
| Exibir “Definir teto” habilitado nos dois estados de existência de orçamento (CA3) | atendido | `budgets-page.component.html:190-199`; `budgets-page.component.spec.ts:485-508` |
| Abrir o formulário na categoria correta: edição para registro zerado e criação pré-selecionada quando não existe registro ativo (CA3) | atendido | Método existente `budgets-page.component.ts:104-115`; `budgets-page.component.spec.ts:509-519` |
| Exibir “Reclassificar despesa” desabilitado, com tooltip literal “Disponível após a implementação da tela de despesas (US04/US05)” (CA3) | atendido | `budgets-page.component.html:200-210`; `budgets-page.component.spec.ts:497-503` |
| Backend distinguir categoria zerada com registro ativo de categoria com despesa sem registro ativo, preservando `NO_BUDGET`, percentual nulo e `hasBudget` correspondente (CA3) | atendido | Teste existente fortalecido em `apps/api/src/test/java/com/obracerta/service/BudgetServiceTest.java:137-169` |
| Despesas excluídas não fornecerem gasto ativo para disparar o alerta (CA3) | atendido | Consulta existente em `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:14-24`; novo teste em `ExpenseRepositoryTest.java:79-105` |
| Prova de repositório respeitar o vínculo obrigatório `expenses.budget_id`, inclusive no cenário sem orçamento ativo | atendido | `ExpenseRepositoryTest.java:85-93`: orçamento vinculado permanece existente, marcado como excluído |
| Nenhuma migration ou implementação de escopo posterior | atendido | Diff completo contra `2c507b2e1b430abe4e7ab9a4ac88a694870141f6`: cinco arquivos previstos na Tarefa 7 |
| Abandono, rede/401 e categoria inexistente no zeramento | fora desta tarefa | Tarefas 8, 9 e pendência registrada na Tarefa 10 do plano |
| Testes frontend executados nesta revisão | atendido: **139 testes passaram** | Em `apps/web`: `npx.cmd ng test --watch=false --browsers=ChromeHeadless`; execução ampliada após bloqueio de inicialização do Chrome |
| Testes backend | execução atribuída ao revisor de código; implementador informou 71 testes aprovados | Não reexecutados por este revisor; os testes backend e a consulta de despesas foram lidos |

## Apontamentos
