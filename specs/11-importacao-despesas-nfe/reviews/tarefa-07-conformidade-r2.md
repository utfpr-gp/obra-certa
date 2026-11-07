APROVADO

# Parecer de Conformidade — Tarefa 7 (rodada 2)

**Nota de execução:** não rodei os testes. O `shell` está bloqueado nesta sessão (`Permission denied: shell`), então não pude executar `.\mvnw.cmd -B "-Dtest=NfeImportConcurrencyTest" "-Dspring.profiles.active=test" test`. A verificação abaixo é estática (leitura do teste, do código de produção e do plano).

## Apontamento 1 da rodada 1 — resolvido

| Onde | Evidência |
| --- | --- |
| Plano | `plan.md:107` — descreve explicitamente: "no estado entregue, o teste nasce VERDE e é de **caracterização**", com o registro do desvio e a sensibilidade verificada (`ensureNotRegistered` → `ensureNotRegisteredWithoutLock` produz `[201, 201]`). Não há mais a afirmação de RED. |
| Comentário da classe | `NfeImportConcurrencyTest.java:55-58` — repete o mesmo: caracterização, nasceu verde porque a trava existe desde a Tarefa 1, valor de fixar CA10/CA8 e quebrar se a trava sair; sensibilidade registrada (`sem ensureNotRegistered, o resultado vira [201, 201]`). |
| Código citado existe | `NfeKeyGuard.java:20-29` (`ensureNotRegistered` com `lockActiveById`, e o `ensureNotRegisteredWithoutLock` usado na chamada de sensibilidade), `ProjectRepository.java:20-22` (`PESSIMISTIC_WRITE`), `NfeImportService.java:156` (trava dentro do bloco transacional). |

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA10 — segundo clique enquanto o primeiro processa → somente uma importação | atendido | `NfeImportConcurrencyTest.java:109-135` — duas confirmações reais em paralelo, com barreira determinística (`pg_stat_activity`, linhas 167-182) sobre a mesma linha de `projects`; afirma `[201, 409]` em qualquer ordem. |
| CA10 — "somente uma importação é gravada" (prova no banco) | atendido | `:139-147` — 2 linhas (os 2 itens do XML), 1 `nfe_key` distinta, 1 `pending_payments`, 1 fornecedor. A fixture `nfe/nfe-valida.xml` tem exatamente 2 `det`, então o "N" está correto. |
| CA8 em concorrência — nada parcial e sem duplicata | atendido | `:139-154` — a perdedora não deixa linha (contagem == 2), e a compensação do upload é afirmada: 2 `put`, 1 `delete`, e a chave apagada não é a referenciada em `expenses`. Corresponde ao fluxo de `NfeImportService.java:139-150` (falha do bloco transacional → `storage.delete` → propaga). |
| CA3 como contexto — recusa informa nota já registrada | atendido | `:136-137` — corpo do 409 contém "A nota fiscal já foi registrada" (`NfeAlreadyRegisteredException.java:6` + `GlobalExceptionHandler.java:86-87`). |

## Apontamentos bloqueantes

Nenhum.

## Sugestões (não bloqueantes)

1. O teste depende de `pg_stat_activity` e da sessão bloqueadora — se o ambiente de CI tiver `pg_stat_activity` com visibilidade restrita ao próprio usuário, a barreira pode ver menos sessões e falhar por timeout, não por regressão. Vale checar na primeira execução real.
2. As sugestões registradas como não promovidas na rodada 1 permanecem como estão, sem reabertura.

## Execução do orquestrador

`NfeImportConcurrencyTest` já foi executado pelo orquestrador na rodada 1: 1 teste verde; suíte de importação com 46 testes, 0 falhas.
