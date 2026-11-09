# Parecer de Conformidade — Tarefa 1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Listagem real e paginação | atendido | `ExpenseController.java:27-35`; `ExpenseService.java:229-240`; `ExpenseRepository.java:16-28`; `accounts-page.component.ts:31-68` |
| CA8 — Isolamento e exclusão lógica | atendido | `ExpenseService.java:231-234`; `ExpenseRepository.java:18-22`; `ExpenseListingIntegrationTest.java:69-84` |

A implementação limita o tamanho efetivo a 15, valida posse e exclusão lógica da obra, ignora despesas excluídas, inclui despesas pagas sem `PendingPayment`, retorna os campos exigidos, oferece paginação, consulta individual e “Cadastrar conta”. A listagem não chama `ReceiptStorage`; apenas mapeia dados financeiros (`ExpenseMapper.java:14-25`).

## Apontamentos

1. **Sugestão — os testes da tarefa têm cobertura insuficiente para comprovar integralmente CA1 e CA8** — `ExpenseListingIntegrationTest.java:38-84` e `accounts-page.component.spec.ts:8-38`  
   Critério violado: evidência de teste para CA1/CA8 (spec.md:84 e 91).  
   Evidência: o teste Angular não verifica explicitamente data de compra, vencimento, valor e situação renderizados; o teste de API também não verifica campos completos, ausência de acesso a comprovantes ou isolamento de despesas de uma obra alheia. A implementação observada atende esses pontos, mas os testes não os demonstram integralmente.

Os comandos solicitados não puderam ser executados neste ambiente de revisão; os logs existentes não foram tratados como resultado da execução atual. Também não foi possível obter o `git diff` solicitado, portanto a análise foi feita sobre os arquivos presentes no working tree.
