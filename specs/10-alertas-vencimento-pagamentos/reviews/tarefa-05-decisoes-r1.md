# Decisões — Tarefa 5, rodada 1

O autor aceitou o apontamento bloqueante da conformidade.

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Os testes de filtros/ordenação ainda fabricam eventos e chamam handlers do componente diretamente, em vez de interagir somente pela interface. | conformidade | aceito | Autor solicitou corrigir os testes para exercitar os controles visíveis. |

## Registro da intervenção orientada pelo autor

Após o implementador anterior atingir o limite de duas falhas de TDD, o autor analisou o fluxo do `<details>` e forneceu o diagnóstico e a estratégia determinística para o evento `toggle`. A correção da Tarefa 5 foi então executada por um novo implementador, sob essa orientação; o orquestrador não alterou código. O revisor de conformidade da rodada 1 apontou que ainda restavam interações por eventos fabricados e handlers diretos; o autor aceitou esse apontamento para correção na rodada 2.
