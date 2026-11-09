# Validação na retomada — Tarefa 2

Data: 01/11/2026. Base: `e1cddbf5e53dd2e099d953071b06c1d2be171938`.

Os pareceres de código e conformidade r2 estão APROVADOS. Esta validação de execução não substitui nem altera esses pareceres e não constitui uma terceira rodada de revisão.

## Frontend

Comando em `apps/web`: `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts`.

A primeira execução não iniciou o Chrome no sandbox. A repetição fora dele executou os três testes: 3 falhas, 0 sucessos.

- `renders expense fields, pagination, individual link and registration action`: TypeError ao ler `name` de objeto undefined no template.
- `clears stale results, shows a readable error and retries the same page`: mesmo TypeError no template.
- `keeps all four situation tabs available, changes tab and resets to first page`: linha 30 esperava página 0, mas recebeu 3.

## API

Comando em `apps/api`: `.\mvnw.cmd -Dtest=ExpenseSituationListingIntegrationTest test -q`.

A primeira execução foi bloqueada pelo acesso ao arquivo de log externo. Na repetição fora do sandbox, os dois testes não chegaram ao comportamento: o contexto falhou ao aplicar `V2__create_projects_and_project_fk.sql` no H2, que rejeitou `CREATE INDEX ... WHERE deleted_at IS NULL`. Resultado: 2 erros de inicialização, 0 falhas de asserção. A migration não foi alterada.

## Encaminhamento

Nenhuma correção, alteração de checklist ou commit foi realizado. A leitura didática para aceite do commit fica suspensa diante das falhas atuais. Duas rodadas de revisão já estão registradas: não despachar uma terceira automaticamente. A decisão de encaminhamento cabe ao autor.

O plano também mantém a Tarefa 1 desmarcada apesar do commit existente; suas correções remanescentes estão descritas na Tarefa 8. Alterações preexistentes fora da Tarefa 2 foram preservadas.
