# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — API rejeita data ausente, nula, vazia, inválida ou anterior à despesa com 400, sem alteração financeira | atendido | `apps/api/src/main/java/com/obracerta/controller/PaymentController.java:26`; `apps/api/src/main/java/com/obracerta/model/dto/payment/PaymentSettlementRequestDTO.java:7`; `apps/api/src/test/java/com/obracerta/controller/PaymentSettlementIntegrationTest.java:76`. |
| CA3/CA4 — Aceita data igual à compra e futura; persiste início do dia UTC | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:72`; `PaymentSettlementIntegrationTest.java:84`. Resposta e instante persistido são comparados. |
| CA4 — Altera despesa e pagamento atomicamente, sem gravação parcial em falha | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:57`; `PaymentSettlementIntegrationTest.java:173`. Falha real de constraint PostgreSQL comprova rollback dos dois registros. |
| CA4 — Preserva vencimento, histórico, valores, categoria, fornecedor, comprovante e orçamento | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:75`; `PaymentSettlementIntegrationTest.java:84`. Compara os registros persistidos antes e depois. |
| CA4 — Repetição sequencial preserva primeira data, não duplica e dispensa validação cronológica da transição já concluída | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:70`; `PaymentSettlementIntegrationTest.java:103`. |
| CA4 — Concorrência real preserva primeira data confirmada e retorna o mesmo estado | atendido | `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:20`; `PaymentSettlementIntegrationTest.java:107`. Identifica os PIDs participantes, comprova espera simultânea ligada ao bloqueador e compara respostas com o banco após os commits. |
| CA6/CA4 — Autorização anterior à idempotência; 404 sem escrita para terceiros, vínculo cruzado, inexistentes e excluídos | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:60`; `PaymentSettlementIntegrationTest.java:184`. Inclui obra, despesa e pagamento excluídos. |
| CA9 — API mantém 401 para JWT ausente, inválido e expirado, sem escrita | atendido | `PaymentSettlementIntegrationTest.java:215`. Cadeia real de segurança habilitada. |
| CA1, CA2 e CA6 na leitura | fora desta tarefa | Entrega da tarefa 1; regressão de alertas reexecutada. |
| CA3 no modal, CA4 na apresentação do navegador, CA5, CA7, CA8 e CA9 na interface | fora desta tarefa | `specs/10-alertas-vencimento-pagamentos/plan.md:39`. |

O ajuste aceito foi verificado: a sincronização usa `pg_backend_pid()` dentro das transações participantes e `pg_blocking_pids()`, restringindo a contagem às duas sessões identificadas. Não depende mais do texto ou alias da consulta de produção. Os futuros somente terminam após o commit de suas transações.

Conferi `tarefa-02-decisoes-r1.md`, `tarefa-02-validacoes-r2.md` e os relatórios Surefire atuais: **22 testes passaram**, sendo 12 de quitação, 3 de alertas e 7 de regressão da edição US04, sem falhas, erros ou ignorados. Não repeti testes; os três unitários previamente aprovados permanecem aplicáveis, pois esta rodada alterou somente o teste integrado.

Produção, contratos e migrations foram preservados nesta correção. As quatro alterações documentais preexistentes continuam excluídas da avaliação. Nenhum arquivo foi alterado.

## Apontamentos
