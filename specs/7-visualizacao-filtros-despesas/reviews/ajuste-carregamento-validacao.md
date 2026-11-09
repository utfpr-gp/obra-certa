# Validação — ajuste complementar de carregamento

Data: 2026-11-01. Ciclo próprio `ajuste-carregamento`, rodada 1, autorizado pelo autor após relatar aparência de recarga da página ao trocar abas e filtros. Não reabre a Tarefa 10 nem altera o plano.

## Diagnóstico e alteração

`loadPage` limpa corretamente os signals de despesas e totais antes da consulta. O template anterior desmontava os três cards quando `totals` se tornava nulo e substituía a listagem por um texto curto. Isso deslocava o painel, filtros e conteúdo durante cada GET.

Os três containers de totalizadores agora permanecem montados enquanto há obra ativa. Durante a consulta, seus valores apresentam placeholders com identificação acessível e estado ocupado; valores indisponíveis não são convertidos em zero. Sem obra ativa, os totalizadores não aparecem. Respostas vazias confirmadas continuam mostrando os totais zerados fornecidos pela API.

O corpo dos resultados reserva sua altura renderizada anterior somente durante o carregamento e apresenta status localizado. Apenas a dimensão é preservada: os signals continuam `expenses=[]` e `totals=null`, sem cópia de resposta financeira anterior. Cabeçalho, abas, filtros e painel permanecem montados. Durante a espera, a paginação também substitui os metadados da resposta anterior por indicação de atualização. Após sucesso ou erro, o corpo recupera altura natural.

Os parâmetros, chamadas GET, identidade de consulta, descarte de respostas antigas, erros, tentativa manual e fluxo de sessão existentes foram preservados. Não há cache de dados, atraso artificial ou mudança de contrato.

## TDD e verificações

Execuções centralizadas pelo orquestrador, em `apps/web`, com ChromeHeadless:

- RED: `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts` — 3 falhas e 18 sucessos. As falhas demonstraram ausência dos três cards no carregamento inicial e quebra de identidade/posição nos dois viewports. Log: `apps/web/ajuste-carregamento-red.log`.
- GREEN direcionado: `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts --include=src/app/features/expenses/accounts-context.spec.ts` — 40 sucessos.
- Suíte completa: `npx.cmd ng test --watch=false --browsers=ChromeHeadless` — 388 sucessos, incluindo as asserções finais de rolagem. Log: `apps/web/ajuste-carregamento-suite.log`.
- Build: `npm.cmd run build` — saída 0, bundle inicial de 706,08 kB. Permanece o aviso de orçamento de 500 kB já existente no baseline anterior. Log: `apps/web/ajuste-carregamento-build.log`.

Os iframes reais de 360 e 1280 px existentes foram ampliados, preservando a cobertura de todos os campos CA1. As consultas permanecem pendentes via `HttpTestingController` durante ações de aba, aplicação de filtro, ordenação e paginação. As verificações cobrem um GET por ação e respectivos parâmetros, identidade dos containers, posições e alturas, altura do painel, rolagem estável, aba selecionada, status acessível, ausência de linhas, moedas e contagem de páginas antigas, signals limpos e apresentação dos resultados após a resposta.

Os testes de contexto existentes receberam asserções de ausência de totalizadores sem obra e de ausência de moeda antiga/carregamento após falhas de rede e servidor, preservando seus cenários de resposta atrasada, tentativa manual e sessão.

## Limites

Alterações restritas ao componente, seus testes e este registro. Sem backend, serviços, contratos, spec, plano, stage ou commit. Os ajustes visuais anteriormente preparados e as demais alterações de outros agentes foram preservados. A inspeção visual no navegador e as revisões independentes são conduzidas pelo orquestrador.
