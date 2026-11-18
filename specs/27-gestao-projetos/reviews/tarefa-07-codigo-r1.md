# Parecer de Código — Tarefa 7 — Rodada 1

## Veredito

Apontamentos bloqueadores.

## Apontamentos

1. **[Alta]** A falha de `deleteProject()` não é tratada; a modal permanece sem feedback acionável quando a exclusão falha.
2. **[Média]** O teste do `ConfirmModal` depende de `buttons[1]`/`buttons[2]`, ficando acoplado à ordem interna do DOM.

## Sugestões

- Impedir confirmações repetidas enquanto a exclusão está em andamento.
- Cobrir sucesso da exclusão e limpeza do projeto ativo após resposta positiva.
- Usar seletores semânticos ou `data-testid`.

