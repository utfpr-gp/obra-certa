# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — API rejeita data ausente, nula, vazia, inválida ou anterior à despesa com 400 e sem alteração financeira | atendido | `apps/api/src/main/java/com/obracerta/controller/PaymentController.java:26`; `apps/api/src/main/java/com/obracerta/model/dto/payment/PaymentSettlementRequestDTO.java:7`; `apps/api/src/main/java/com/obracerta/service/PaymentService.java:72`; `apps/api/src/test/java/com/obracerta/controller/PaymentSettlementIntegrationTest.java:68`. |
| CA3/CA4 — Aceita data igual à compra e futura; persiste início do dia UTC | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:77`; `PaymentSettlementIntegrationTest.java:79`. O teste compara resposta e instante consultado diretamente no PostgreSQL. |
| CA4 — Quitação atômica de despesa e pagamento; falha não deixa gravação parcial | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:57`; `PaymentSettlementIntegrationTest.java:134`. O teste provoca falha real por constraint PostgreSQL e compara os registros anteriores e posteriores. |
| CA4 — Preserva vencimento, histórico e demais campos financeiros | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:75`; `PaymentSettlementIntegrationTest.java:80`. Compara as colunas da despesa, pagamento e orçamento, descontando somente as alterações esperadas. |
| CA4 — Repetição sequencial preserva primeira data e não duplica pagamento; validação cronológica aplica-se à transição | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:70`; `PaymentSettlementIntegrationTest.java:99`. Repetição com data anterior à compra retorna o estado original. |
| CA4 — Repetições concorrentes preservam uma única primeira data persistida | atendido | `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:20`; `PaymentSettlementIntegrationTest.java:103`. Duas transações reais são observadas simultaneamente esperando o bloqueio; ambas retornam a mesma data, confirmada no banco, com um único pagamento. |
| CA6/CA4 — Autoriza antes da idempotência; recusa vínculo cruzado, recursos alheios, inexistentes e excluídos com 404 sem gravação | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:60`; `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:22`; `PaymentSettlementIntegrationTest.java:145`. Inclui pagamento excluído e tentativa de terceiro sobre recurso já quitado. |
| CA9 — API mantém 401 para JWT ausente, inválido ou expirado, sem escrita | atendido | `PaymentSettlementIntegrationTest.java:176`. Executa a cadeia real de segurança, sem identidade simulada nem filtros desabilitados. |
| CA1, CA2 e CA6 na leitura | fora desta tarefa | Entregues na tarefa 1; `PaymentAlertsIntegrationTest` foi reexecutado como regressão. |
| CA3 no modal, CA4 na apresentação do navegador, CA5, CA7, CA8 e CA9 na interface | fora desta tarefa | `specs/10-alertas-vencimento-pagamentos/plan.md:39`. Esta etapa entrega somente a quitação na API. |

Conferi os relatórios Surefire atuais: **12 testes de quitação, 3 de alertas, 7 da edição de pagamento existente e 3 unitários passaram**, sem falhas, erros ou testes ignorados. Usei a execução realizada pela raiz e seus relatórios, sem repetir acesso bloqueado ao PostgreSQL.

O diff mantém a edição completa da US04, não altera migrations e não acrescenta frontend nesta etapa. As quatro alterações documentais preexistentes foram excluídas da avaliação. Nenhum arquivo foi alterado.

## Apontamentos
