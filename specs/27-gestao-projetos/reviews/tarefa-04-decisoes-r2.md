# Decisões — Tarefa 4, rodada 2

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | O teste obrigatório não foi executado no ambiente do revisor. | conformidade | recusado | O teste foi executado no ambiente principal contra PostgreSQL 16 real: 2 testes, 0 falhas, 0 erros, BUILD SUCCESS. |
| 2 | O service usa `LocalDateTime.now()` em vez de `Clock` injetável. | conformidade/código | aceito | O apontamento foi aceito como pendência técnica da tarefa. O limite de duas rodadas impede uma nova correção nesta Issue. |
| 3 | A migration usa `TIMESTAMP(6)` em vez de `timestamptz`. | código | aceito | O apontamento foi aceito como pendência de compatibilidade temporal da migration. O limite de duas rodadas impede uma nova correção nesta Issue. |
| 4 | Sugestão de testar explicitamente `PendingPayment`. | conformidade/código | aceita como melhoria futura | A propagação está implementada e coberta indiretamente; a verificação explícita pode ficar para uma tarefa futura. |
