# Parecer de Código — Tarefa 6 — Rodada 1

## Veredito

Apontamentos bloqueadores.

## Apontamentos

1. **[Alta]** O carregamento inicial da Navbar não possui tratamento de erro. O `subscribe` de `getProjects()` tem apenas callback de sucesso; falhas HTTP ou de rede terminam sem feedback ao usuário e deixam ambígua a diferença entre lista vazia e erro.
2. **[Alta]** O modal pode permanecer aberto durante a navegação para `/orcamentos`, pois `goToBudgets()` não emite fechamento nem altera o estado mantido pela Navbar.

## Sugestões não bloqueadoras

- Adicionar teste explícito da atualização reativa do nome na Navbar.
- Cobrir preservação do formulário também no fluxo de criação.
- Centralizar a extração do identificador do usuário em serviço existente ou dedicado.

