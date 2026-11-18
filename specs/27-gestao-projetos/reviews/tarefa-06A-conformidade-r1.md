# Parecer de Conformidade — Tarefa 6A — Rodada 1

## Veredito

Apontamentos bloqueadores.

## Apontamentos

1. **[Alta]** A Home ainda usa `ObraMockService.activeObra` para alertas, totais, categorias, contas e gastos, embora o cabeçalho use `ActiveProjectService.activeProject`. Isso mantém uma fonte paralela e pode misturar o nome de uma obra com os dados de outra, contrariando a integração exigida.
2. **[Média]** O teste da Home valida apenas a alteração do nome no cabeçalho e não prova a integração completa dos dados dependentes da obra ativa.

