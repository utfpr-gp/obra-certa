# Validação após a auditoria final r4 da US06

Data: 09/11/2026. Base da revisão: `origin/develop` em `71b8e21`. A branch `feature/8-relatorios-graficos-gastos` parte dessa base e contém somente os 20 commits da US06 até `91fe2a7`. As entregas US04 e US05 já estão em `develop` pelos PRs #36 e #43.

## Suítes completas

- API: `mvnw.cmd clean test`, perfil `test`, PostgreSQL 16 descartável e Flyway com validação do schema. **348 testes aprovados**, sem falhas, erros ou ignorados. O pool de cinco conexões veio da configuração versionada em `df41c48`. A execução usou somente variáveis de conexão e perfil. Log local `apps/api/target-us06-audit-r5.log`.
- Frontend: `npm.cmd test -- --watch=false --browsers=ChromeHeadless` e `npm.cmd run build`. **443 testes aprovados** e build concluído. Logs locais `apps/web/us06-audit-r5-web.log` e `apps/web/us06-audit-r5-build.log`.

## Regressões do layout do PDF

Em uma cópia isolada do frontend, o teste presente em cada commit foi executado primeiro com o serviço do commit pai e depois com o serviço corrigido. A comparação altera somente o serviço e mantém o teste de cada par. Em todos os casos, a primeira execução teve uma falha de asserção e 12 testes aprovados. A segunda teve 13 aprovados.

| Commit | Comportamento reproduzido |
| --- | --- |
| `8aafd28` | A versão anterior repetia o cabeçalho do detalhamento no painel de totais. |
| `f3ece2e` | A versão anterior mantinha a linha de cabeçalho oculta e não fixava o alinhamento da tabela de totais. |
| `76f518f` | A versão anterior separava os totais da tabela de detalhamento. |

As seis execuções usaram `ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/reports/report-visual-export.service.spec.ts`. Os resultados foram conferidos durante a execução. Os logs temporários da cópia foram limpos pelo Angular junto com seu cache durante a validação final. A reprodução comprova a sensibilidade dos testes às regressões. A ordem histórica de escrita das alterações continua documentada no registro da rodada 4.

## Encaminhamento dos apontamentos

- Itens 1 e 2: suítes completas reexecutadas e regressões do PDF reproduzidas. A reprodução complementa o relato histórico sobre o RED.
- Itens 3 e 4: a atribuição da validação visual está documentada em `validacao-visual-ca11.md`. A mensagem de obra não localizada na exportação foi corrigida em `3761cc3` e está coberta pela suíte frontend.
- Item 5: a massa demonstrativa sem referências foi removida durante o ajuste solicitado. O protótipo permanece no histórico da tarefa 1.
- Itens 6 e 7: o índice de specs registra as validações atuais e o PRD identifica a US06 como implementada localmente. O parecer final independente continua pendente.
