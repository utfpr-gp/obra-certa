REPROVADO

# Parecer de Código — Tarefa 10 (rodada 1)

**Veredito:** REPROVADO — 1 bloqueante.

1. **Botão Confirmar com `aria-describedby` órfão.** `nfe-import-dialog.component.html:261`. Usa `missingItems().length`, mas o alvo `#nfe-missing-categories` só existe quando `missingSummary()` é verdadeiro (html:115). Com categorias carregando ou em erro, aponta para id inexistente. Regra: a mesma condição que renderiza o alvo deve governar a referência. Os selects já estavam corretos.

Sugestões: `(click)="$event.stopPropagation()"` sem dependência clara (html:5); selects e checkbox habilitados em `notFound`; consumir `nfeImportRefreshPending` depois das guardas em `accounts-page`; `payment-modal.spec` caso novo com `flush({}, 500)` não asserido.

## Execução do orquestrador
Shell negado ao revisor. Orquestrador rodou dialog+entry+service: 57 SUCCESS; build OK.

Resolução: rodada 2 (ver `tarefa-10-*-r2.md`).
