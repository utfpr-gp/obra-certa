# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Todas inclui despesas ativas | atendido | `ExpenseRepository.java:23-27` |
| Pendentes inclui todas as não quitadas, inclusive vencidas | atendido | `ExpenseRepository.java:27` |
| Vencidas somente não quitadas com vencimento anterior à referência | atendido | `ExpenseRepository.java:28-31` |
| Vencimento do dia não é vencido; nulo fica fora de Vencidas | atendido | `ExpenseRepository.java:28-31` |
| Pagas somente quitadas, inclusive paga à vista sem `PendingPayment` | atendido | `ExpenseRepository.java:32`; ausência de dependência de `pp` |
| Uma única data de referência definida pela API | atendido | `ExpenseService.java:241-245`; `ExpensePageResponseDTO.java:13` |
| Quatro abas disponíveis sem resultados | atendido | `accounts-page.component.ts:86-90`; teste `accounts-page.component.spec.ts:10-34` |
| Troca de aba retorna à primeira página | atendido | `accounts-page.component.ts:128-131` |
| Isolamento por proprietário/obra e exclusão lógica preservados | atendido | `ExpenseRepository.java:21-24`; `ExpenseService.java:237-242` |
| Cobertura de integração dos recortes | atendido | `ExpenseSituationListingIntegrationTest.java:58-80` |

## Apontamentos

Os comandos de teste solicitados não foram executados porque não há shell disponível nesta sessão. Portanto, os resultados acima são baseados em inspeção estática dos arquivos e dos testes existentes.
