# Tarefa 10 — Validação da correção aceita na rodada 2

Correção autorizada pelo autor: “Pode ajustar”. Escopo: encerrar o carregamento quando um intervalo inválido é aplicado enquanto existe uma consulta pendente.

## TDD

Comando executado pelo orquestrador em `apps/web`:

```text
npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts
```

- RED: 4 falhas novas e 17 testes aprovados, conforme retorno do orquestrador. As falhas demonstraram `loading` verdadeiro, indicador ainda presente e `aria-busy="true"` após aplicar o intervalo inválido. Log informado: `tarefa-10-r2-red.log`.
- GREEN: 21 de 21 testes aprovados, conforme retorno do orquestrador, após acrescentar `this.loading.set(false)` em `showInvalidFilters()`.
- Cobertura nova: compra e vencimento, cada um com resposta antiga de sucesso e de erro. Os testes verificam o carregamento antes da validação e seu encerramento imediatamente após a validação e após a resposta antiga; também verificam ausência de nova consulta inválida, resultados, totais e erro de consulta.

## Limites

Os guards existentes foram preservados. Não houve alteração de contexto, retry, arquitetura, backend ou CSS. Não foi necessário refatorar. A suíte frontend completa foi executada pelo orquestrador: `npm test -- --watch=false --browsers=ChromeHeadless`, exit 0, 365/365 testes aprovados. Log: `apps/web/tarefa-10-r2-suite.log`. Este registro não declara aprovação da revisão nem conclusão da tarefa.
