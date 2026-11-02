# Parecer de Conformidade — Tarefa 2

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — distribuição real com valores, percentuais e legenda | atendido | `ReportService.java:49-63`; `reports-page.component.html:42-45` |
| CA5 — obra alheia/inexistente retorna 404 | atendido | `ReportService.java:41-42`; `GlobalExceptionHandler.java:50-61` |
| CA6 — despesas excluídas fora dos agregados | atendido | `ExpenseRepository.java:92-109` |
| Obra válida sem despesas em estado vazio | atendido | `ReportService.java:49-63`; `reports-page.component.ts:30`; `reports-page.component.html:5` |
| Loading, erro, retry e respostas atrasadas | atendido | `reports-page.component.ts:64-92`; `reports-page.component.html:2-3` |
| 401 pelo fluxo existente | atendido | `auth-interceptor.ts:21-22` |
| Demonstrativo retirado do fluxo real | atendido no fluxo, mas com resíduo | `reports-page.component.ts:26-30`; `reports-demo.data.ts:9-10` |
| CA2, PDF real e migration | fora desta tarefa | `specs/.../plan.md:42-45` |

## Apontamentos

### Bloqueantes

1. **Os testes solicitados não puderam ser executados nesta sessão; portanto, não há confirmação do resultado atual do backend/frontend.** Os logs disponíveis referem-se a outros comandos/testes, não aos comandos direcionados da Tarefa 2.

2. **A cobertura dos testes versionados não comprova integralmente os critérios alegados.** `ReportServiceTest.java:23-50` usa métodos mockados chamados `sumActive...`, mas não verifica efetivamente que despesas com `deletedAt` são excluídas; também não cobre obra válida sem despesas. O teste de respostas atrasadas (`reports-page.component.spec.ts:42-54`) não valida efetivamente o descarte pelo nome da obra, pois `projectName` não é renderizado na página.

### Sugestões

1. Remover ou atualizar o artefato demonstrativo e seu comentário pendente `TODO #8` em `reports-demo.data.ts:9-10`, para evitar indicar que a integração ainda não foi concluída.

2. Adicionar testes explícitos para retry após erro, estado vazio e exclusão lógica no repositório/serviço.
