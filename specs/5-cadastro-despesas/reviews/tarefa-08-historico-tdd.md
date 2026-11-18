# Histórico de implementação — Tarefa 8

## Interrupção antes da primeira revisão

O primeiro ciclo demonstrou RED real na interface: 11 falhas nos 13 testes novos de contexto. Após a implementação, a execução focada do orquestrador aprovou 59 testes web, incluindo os 13 novos.

O teste novo `persistsInTheValidatedPayloadProjectWhenAnotherProjectIsSelectedForTheNextOperation` apresentou `EmptyResultDataAccessException`, ao consultar por JDBC uma despesa não encontrada, em duas execuções. A primeira execução escalada concluiu sem que a ferramenta devolvesse sua saída; o orquestrador repetiu a execução antes de recuperar o resultado anterior. Após a auditoria dos relatórios e horários, a equipe interrompeu o trabalho por atingir o limite de duas falhas pelo mesmo motivo.

As mudanças permaneceram sem commit e sem pareceres de revisão da tarefa 8. A suíte web completa e a compilação ainda não estavam concluídas.

## Autorização de retomada

Em 2026-10-29, após receber o relato da interrupção, o autor determinou: “Retome a investigação e realize o ajuste”.

A retomada deve investigar a consulta do teste, corrigir a causa antes de qualquer repetição e então concluir os testes, a compilação e as revisões independentes. O histórico e o limite atingido ficam preservados; a próxima revisão continua sendo a rodada 1, pois nenhum parecer da tarefa 8 foi emitido. O status da spec e as migrations aplicadas permanecem intocados.

## Diagnóstico e validação após o ajuste

O implementador confirmou que a segunda criação era consultada por JDBC sem o `flush()` que já existia após a primeira criação. Acrescentou apenas `expenses.flush()` antes dessa segunda consulta, mantendo as verificações e o código de produção da API intactos.

O orquestrador executou a validação após o ajuste: `ExpenseRegistrationIntegrationTest` passou com 16 testes, sem falhas, erros ou ignorados, usando PostgreSQL real; a suíte Angular completa passou com 248 testes; `npm run build` terminou com código 0 e o aviso conhecido de orçamento do pacote inicial. Esses resultados são de testes, não substituem os pareceres independentes da rodada 1.
