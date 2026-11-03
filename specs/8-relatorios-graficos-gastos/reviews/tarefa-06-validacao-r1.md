# Validação — Tarefa 6, rodada 1

Base: `6dcc15de9ae0dab59d3951c34aff245f68505300`.

## Aceite e início

O autor aceitou a proposta de PDF visual com a lista individual de despesas, a explicação do tutor antes da implementação e o fechamento da tarefa 4. A tarefa 4 foi commitada separadamente em `6dcc15d`; a proposta foi incorporada à spec e ao plano como CA11/tarefa 6, preservando o campo de aprovação da spec. Um implementador de contexto limpo foi despachado.

## Decisões de implementação

- A captura visual e a lista individual devem usar os dados do mesmo retorno autorizado da API. Foi escolhida uma operação interna JSON com relatório completo, nome seguro e apêndice PDF base64, gerados a partir de um snapshot de leitura consistente. O endpoint PDF existente conserva seu comportamento.
- A apresentação de exportação é isolada, compartilhando a apresentação da página, com todas as categorias e layout desktop. O filtro visível não é modificado.
- As bibliotecas de captura e composição precisam ser verificadas e fixadas antes do RED, com carregamento sob demanda.

## Dependências antes do RED

O implementador consultou a documentação oficial das bibliotecas. A consulta npm inicial no sandbox falhou por resolução de rede; a instalação foi executada pelo orquestrador com permissão ampliada:

`npm.cmd install --save-exact html-to-image@1.11.13 pdf-lib@1.17.1 --fetch-retries=0 --fetch-timeout=15000`

Resultado: saída 0, seis pacotes adicionados, versões diretas exatas no manifesto/lockfile. O audit da árvore completa relatou vulnerabilidades; uma consulta específica ao relatório não listou `html-to-image`, `pdf-lib` ou as dependências adicionadas entre os pacotes afetados. Não foi executado `npm audit fix`, nem atualizada a árvore fora da necessidade da tarefa. O npm também informou scripts bloqueados de pacotes já existentes; o funcionamento será conferido pelos testes e build normais.

## RED

- Backend: o implementador executou Maven com perfil `test` e conexão isolada explícitos. A compilação dos testes falhou pela ausência dos métodos `generateAppendix`/`exportSnapshot` e do contrato `ReportExportDTO`, antes de alterar produção. Log temporário `apps/api/task6-red.log`.
- Frontend: o orquestrador executou `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/reports/**/*.spec.ts --include=src/app/core/services/report.service.spec.ts --include=src/app/app.routes.spec.ts`. Saída 1 por serviço `report-visual-export.service` inexistente, contrato `ReportExport` não exportado e operação `exportSnapshot` ausente, além de diagnóstico secundário de tipo implícito. Log temporário `apps/web/tarefa6-red.log`.
- A produção Angular só foi liberada após esse resultado. Os testes incluem montagem/captura, paginação, falhas locais/remotas, exportação global sem alterar o filtro e descarte por contexto/abandono.

## Ambiente

PostgreSQL 16 descartável exclusivo: container `obra-certa-us06-task6-tests`, porta local 55440, banco `obracerta_task6_test`. Usar perfil `test` e conexão explicitamente fornecida por `SPRING_DATASOURCE_*`, Flyway habilitado e `ddl-auto=validate`. Não usar o banco de desenvolvimento nos testes.
