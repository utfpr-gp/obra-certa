# Decisões — Auditoria final da Issue #5, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| AF-01 | Alerta de teto não aparece no cadastro quando a despesa foi salva e o comprovante falhou. | auditoria-final-r1.md | aceito | O autor esclareceu que o estouro deve ser registrado e apenas alertado, sem impedir o cadastro. Após confirmar que a correção preservaria esse comportamento, autorizou: “Pode realizar a correção”. |

A correção cobre a combinação CA5 + CA6: manter o lançamento financeiro e o alerta de falha do comprovante, exibindo também o alerta de orçamento atingido ou ultrapassado. Não criar bloqueio de orçamento, tabela de idempotência ou recuperação de sessão. A tarefa 9 de fechamento é nova e não restaura as antigas tarefas 9 e 10 retiradas pelo autor.
