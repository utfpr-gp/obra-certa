REPROVADO

# Parecer de Conformidade — Tarefa 10 (rodada 1)

**Veredito:** REPROVADO (2 bloqueantes + 1 de escopo).

1. **404 do preview cai no texto de conexão com "Tentar novamente".** `nfe-import-dialog.component.ts:319`. O escopo (3) do plano é geral: 404 (obra inexistente, excluída ou alheia) deve usar a `message` do servidor. Não há teste de 404 no preview.
2. **Teste do 401 na confirmação é vacuoso.** `nfe-import-dialog.component.spec.ts:738-757`. O logout do interceptor fecha o diálogo antes da checagem do banner; o `expect(el('nfe-confirm-error')).toBeNull()` passa mesmo sem o `return` de `ts:200`.
3. **Escopo** — o 404 do preview era o caso de "obra alheia" da Tarefa 3 e aparecia como erro de conexão.

Sugestões: `aria-describedby` órfão no botão Confirmar (`html:261`, condição diferente do alvo); selects e checkbox habilitados em `notFound`; `nfeImportRefreshPending` consumido antes das guardas em `accounts-page` `loadPage`; `stopPropagation` residual no container.

## Execução do orquestrador
Shell negado ao revisor. Orquestrador rodou dialog+entry+service: 57 SUCCESS; build OK.

Resolução: rodada 2 (ver `tarefa-10-*-r2.md`).
