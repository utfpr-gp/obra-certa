# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Bloquear valor positivo inferior ao gasto ativo, antes de alterar ou persistir o orçamento (CA5/RN02) | atendido | `apps/api/src/main/java/com/obracerta/service/BudgetService.java:124-128`; `apps/api/src/test/java/com/obracerta/service/BudgetServiceTest.java:368-389` |
| Consultar despesas ativas da obra e categoria corretas (CA5) | atendido | `BudgetService.java:124`; método existente `spentOfCategory`; `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:18-28` |
| Aceitar orçamento exatamente igual ao gasto, inclusive com escalas decimais diferentes, resultando em saldo zero (CA5) | atendido | `BudgetService.java:125-126`; `BudgetServiceTest.java:392-414` |
| Responder 409 no formato padrão, com a mensagem exigida e total gasto formatado em reais (CA5) | atendido | `apps/api/src/main/java/com/obracerta/exception/BudgetBelowSpentException.java:9-18`; `GlobalExceptionHandler.java:17-30`; `BudgetControllerTest.java:154-171` |
| Manter formulário aberto e valor digitado após conflito, exibindo a mensagem recebida da API (CA5) | atendido | `apps/web/src/app/features/budgets-page/components/budget-form-modal/budget-form-modal.component.ts:112-119`; `budget-form-modal.component.spec.ts:147-169`; `budgets-page.component.spec.ts:512-536` |
| Exibir “Ver despesas desta categoria” desabilitado, acompanhado do tooltip literal da US05 (CA5) | atendido | `budget-form-modal.component.html:76-86`; `budgets-page.component.spec.ts:525-530` |
| Bloquear valor vazio, zero, negativo ou com mais de duas casas na tela, com o aviso exigido e sem chamada à API (CA6) | atendido | Validações existentes em `budget-form-modal.component.ts:46-51,131-147`; testes acrescentados em `budget-form-modal.component.spec.ts:134-145` |
| Rejeitar os quatro valores inválidos pela API com 400, sem delegar ao salvamento (CA6) | atendido | Validações existentes em `apps/api/src/main/java/com/obracerta/model/dto/budget/BudgetSetDTO.java:10-13`; `BudgetControllerTest.java:139-151` |
| Preservar o zeramento pela ação explícita, sem aplicar a RN02 ao endpoint de zeramento (CA6/CA4) | atendido | A nova comparação está somente em `BudgetService.setBudget`; `zeroBudget` não foi alterado |
| Nenhuma migration ou implementação de outras tarefas | atendido | Diff completo contra `9b97af8590fee351707bcac7a41b01b7de117c53`; alterações limitadas aos arquivos previstos na Tarefa 6 |
| Alerta de auditoria, abandono, rede/401 e categoria inexistente no zeramento | fora desta tarefa | Tarefas 7, 8, 9 e pendência registrada na Tarefa 10 do plano |
| Testes frontend executados nesta revisão | atendido: **136 testes passaram** | Em `apps/web`: `npx.cmd ng test --watch=false --browsers=ChromeHeadless`; execução ampliada após bloqueio de inicialização do navegador |
| Testes backend | execução atribuída ao revisor de código; implementador informou 70 testes aprovados | Não reexecutados por este revisor; os testes e a implementação backend foram lidos no diff |

## Apontamentos
