# Parecer de Conformidade — Tarefa 6C — Rodada 1

## Veredito

Apontamento bloqueador.

## Apontamento

1. **[Média]** `Auth.isAuthenticated()` aceita JWT semanticamente incompleto ou com algoritmo arbitrário: exige estrutura, `alg` não vazio e `exp` futuro, mas não exige identidade (`sub`/`userId`), emissor ou algoritmo esperado.

