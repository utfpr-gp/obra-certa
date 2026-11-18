# Parecer de Conformidade — Tarefa 5

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Quatro valores de ordenação válidos | atendido | `ExpenseSort.java:3-8`; `expense-registration.model.ts:64` |
| Padrão: compra mais recente | atendido | `ExpenseService.java:244, 285-287`; `accounts-page.component.ts:196-203` |
| Ordenação antes da paginação | atendido | `ExpenseService.java:263-264`; `ExpenseRepository.java:40-44` |
| Desempate estável | atendido | `ExpenseService.java:306-314` — ordenação secundária por `id ASC` |
| Quatro opções no frontend | atendido | `accounts-page.component.ts:199-204, 104-107` |
| Alteração retorna à página 1 | atendido | `accounts-page.component.ts:315-320` |
| Preserva filtros e aba | atendido | `accounts-page.component.ts:316-320`; `ExpenseService.java:263-264` |
| Parâmetros inválidos são rejeitados | atendido | `ExpenseService.java:271-303`; teste `ExpenseSortListingIntegrationTest.java:92-101` |
| Não antecipa estados/contextos futuros | atendido | Alterações limitadas à ordenação; registro em `tarefa-05-validacao.md` |
| Testes de integração e frontend executados | não atendido | `tarefa-05-validacao.md`, seção GREEN |

## Apontamentos

1. **Os testes solicitados não puderam ser executados nesta revisão** — `specs/7-visualizacao-filtros-despesas/reviews/tarefa-05-validacao.md` (seção GREEN).  
   Critério relacionado: a Tarefa 5 exige testes JUnit e `.spec.ts` para ordenação, desempates, paginação e preservação do contexto.  
   Evidência: não há resultado GREEN registrado; portanto, a conformidade foi confirmada estaticamente, mas não validada por execução.
