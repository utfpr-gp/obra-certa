# Parecer de Conformidade — Tarefa 6 — Rodada 1

## Veredito

Apontamentos bloqueadores.

## Apontamentos

1. **[Alta]** O nome atualizado não é refletido reativamente na Home. `HomePageComponent` ainda consome `ObraMockService.activeObra`, enquanto o modal atualiza apenas `ActiveProjectService`. Isso viola o CA3, que exige a atualização na Navbar, cabeçalho da Home e seletor.
2. **[Média]** O atalho “Definir Orçamentos” navega sem fechar o modal, podendo deixar o overlay aberto sobre a rota `/orcamentos`.
3. **[Baixa]** O teste de erro verifica apenas o campo `name`; não comprova a preservação de todos os valores nem uma nova submissão.

