# Histórico de TDD — Tarefa 1, rodada de revisão 2

Data: 31/10/2026.

## Escopo aceito

Os dois apontamentos de código e a sugestão de normalização foram aceitos pelo autor em `tarefa-01-decisoes-r1.md`. Um implementador novo recebeu somente essas correções e os critérios originais da Tarefa 1.

## Execução

Comando executado pelo orquestrador em `apps/web`, com permissão para iniciar Chrome:

```powershell
npx.cmd --no-install ng test --watch=false --browsers=ChromeHeadless '--include=src/app/features/expenses/expense-edit.spec.ts' '--include=src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.spec.ts'
```

1. Testes novos/adaptados foram escritos antes das correções. RED: **19 testes, 6 falhas e 13 sucessos**. Log local: `apps/web/expense-edit-r2-red-root.log`. Foram reproduzidas a máscara ausente e a exceção `RangeError` com quantidade extrema.
2. O implementador aplicou a máscara de digitação BRL e a validação dos operandos antes de `BigInt`, e normalizou os dois arquivos autorizados.
3. Primeira execução após as correções: **19 testes, 2 falhas e 17 sucessos**. Log local: `apps/web/expense-edit-r2-green-root.log`. A digitação monetária e os casos de quantidade inválida passaram. Os dois casos de preenchimento inicial permaneceram falhando: o valor exibido continuou sem máscara, como `1234.56`, em vez de `R$ 1.234,56`.

Os mesmos testes de preenchimento inicial falharam no RED e depois das correções pelo mesmo motivo. Aplicando literalmente a regra 2 de `.agents/rules/utf-rules.md`, o orquestrador interrompeu o trabalho e o implementador confirmou: **“Estourei o limite de 2 rodadas de TDD.”** Não foi feita outra alteração ou execução de correção após esse ponto.

## Normalização comprovada

Os hashes SHA-256, calculados antes e depois removendo somente os caracteres CR, permaneceram iguais:

- `ExpenseService.java`: `D7916C025756347FE329B8ABE4D86136CDF96A407108F36E97C483ED00AEFA1F`.
- `expense-detail.component.ts`: `A54FF0B46A2AC0F38B0718EA32F2819464E891220CC4C4220D72D61BF05696BA`.

Isso comprova que a normalização preservou todo o conteúdo restante desses dois arquivos. `git diff --check -- apps/api apps/web` passou nas mudanças não staged da correção; as mudanças da rodada 1 continuam staged e não foram substituídas automaticamente.

## Situação preservada

- Correções parciais mantidas no working tree, sem descarte.
- Pareceres da rodada 1 e decisões do autor preservados sem edição.
- Nenhuma segunda revisão independente foi iniciada: a implementação corretiva não concluiu o TDD. O limite atingido é de TDD, não uma terceira rodada de revisão.
- Plano continua com a Tarefa 1 pendente. Nenhum commit de código foi realizado.
- Aguardando decisão do autor sobre a retomada e a interpretação do contador de TDD diante do RED esperado e do primeiro GREEN ainda falho. Sem autorização explícita para mudar essa regra, não há terceira tentativa.
