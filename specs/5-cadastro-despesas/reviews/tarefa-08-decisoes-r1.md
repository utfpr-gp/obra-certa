# Decisões — Tarefa 8, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | A consulta individual não carrega quando a obra ativa é inicializada depois do construtor, impedindo abertura direta ou recarga da página | conformidade e código | aceito | O autor determinou: “Realize o ajuste desse ponto”. |

O mesmo defeito foi identificado pelos dois revisores. A correção deve aguardar a inicialização da obra ativa e carregar a consulta, mantendo o descarte de respostas de contextos anteriores e a proteção A → B → A. Um implementador novo executará a correção; a próxima revisão é a rodada 2. Os pareceres da rodada 1 permanecem preservados.
