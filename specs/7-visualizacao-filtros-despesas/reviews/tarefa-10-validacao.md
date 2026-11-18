# Validação — Tarefa 10

## Escopo e autorização

Correções autorizadas pelo autor (“Pode aprovar e corrigir”), conforme Tarefa 10 do plano. Os pareceres anteriores da Tarefa 6 foram preservados. Este registro documenta execução; não substitui revisão independente.

## RED

- Baseline reproduzida pelo orquestrador: 15 testes, 5 falhas e 10 sucessos, em `apps/web/retomada-tarefa-06.log`.
- Após ampliar testes e antes de alterar produção: 17 testes, 8 falhas e 9 sucessos, em `apps/web/tarefa-10-web-red.log`.
- As cinco regressões originais eram limpeza de filtros e quatro opções de ordenação. Novos cenários evidenciaram ausência de cartões mobile, overflow e ausência de navegação por teclado das abas.
- A medição inicial também encontrou ação desktop com 17px. O harness foi corrigido para copiar os estilos globais de todo o documento do Karma (inclusive links fora do `head`) e usar documento HTML em modo standards. A presença do token global `--spacing` agora é verificada explicitamente antes das medidas.

Comando específico, executado pelo orquestrador em `apps/web`:

```text
npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts
```

## Implementação encaminhada para GREEN

- Restaurados o contador `tabVersion`, os guards de obra/aba/filtros/ordenação e a limpeza imediata de registros/totais já entregues antes da Tarefa 6.
- Restaurado o botão de limpeza dentro do formulário; mantida a ação contextual no resultado vazio com filtros aplicados.
- Cartões com pares chave/valor abaixo de 640px, tabela nos demais tamanhos, abas organizadas em duas colunas no mobile.
- Abas com seleção visual, um único ponto de tabulação, setas/Home/End e foco acompanhando seleção; `tablist` fora do `tabpanel`.
- Viewports reais em iframe same-origin de 360px e 1280px, CSS global real, medidas de limites/overflow/ação e interação com filtros, abas e limpeza. Sem configuração ou dependência adicional.

## Limites preservados

Sem retry de despesas, geração global de consultas, ciclo A → B → A, nova proteção concorrente de páginas ou persistência de contexto da Tarefa 7. Sem backend, migrations, alterações de spec/plano/arquitetura ou dados demonstrativos. Sem commit ou stage.

## Resultado

Execuções pelo orquestrador em `apps/web`, fora do sandbox para permitir ChromeHeadless:

- `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts`: exit 0, 17 testes aprovados. Log: `apps/web/tarefa-10-web-green.log`.
- `npm test -- --watch=false --browsers=ChromeHeadless`: exit 0, 361 testes aprovados, incluindo navegação e sidebar. Log: `apps/web/tarefa-10-web-suite.log`.
- `npm run build`: exit 0; aviso de bundle inicial de 697,44 kB para orçamento de aviso de 500 kB. Log: `apps/web/tarefa-10-build.log`.

O patch isolado da Tarefa 10, comparado ao índice preexistente da Tarefa 6 antes de colocar a correção no índice, foi preservado em `apps/api/target/tarefa-10.diff` para delimitação da revisão.
