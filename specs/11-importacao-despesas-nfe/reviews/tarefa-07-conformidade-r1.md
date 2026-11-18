REPROVADO

# Parecer de Conformidade — Tarefa 7

**Testes não executados.** Tentei rodar `.\mvnw.cmd -B "-Dtest=NfeImportConcurrencyTest,NfeImportControllerConfirmTest,NfeKeyGuardTest" "-Dspring.profiles.active=test" test` a partir de `apps/api`; o shell foi recusado com `permission.rejected: Permission denied: shell` (só `git` passou). O parecer é estático e não substitui a execução verde — quem tiver shell precisa rodar antes do PR, sobretudo porque este teste é o único a exercitar a corrida real.

## Critérios verificados

| Critério / decisão | Situação | Onde |
| --- | --- | --- |
| **CA10** — duas confirmações simultâneas da mesma nota: exatamente um 201 e um 409, com uma única importação gravada | atendido (estático) | `NfeImportConcurrencyTest.java:128-137` (201/409, `containsExactlyInAnyOrder`), `:134` (2 linhas), `:135-137` (1 `nfe_key`) |
| **CA10** — a recusa é a mensagem de chave registrada, não erro genérico | atendido | `NfeImportConcurrencyTest.java:131-132`; `NfeAlreadyRegisteredException.java:6`; `GlobalExceptionHandler.java:86-98` |
| **CA8 (concorrência)** — a perdedora não deixa linhas nem pagamento | atendido | `NfeImportConcurrencyTest.java:134` (só as 2 do vencedor), `:138-140` (1 `pending_payments`), `:141-142` (1 fornecedor) |
| **CA8 (concorrência)** — o XML da perdedora é compensado e não é o referenciado | atendido | `NfeImportConcurrencyTest.java:144-149` (2 `put`, 1 `delete`, chave apagada fora dos `receipt_key`); `NfeImportService.java:139-150` |
| **CA3 (contexto)** — chave já ativa na obra bloqueia sem gravar | atendido na concorrência | `NfeImportConcurrencyTest.java:128-137`; `NfeKeyGuard.java:18-23`; `ProjectRepository.java:19-22` |
| **Decisão (1)** — `addFilters=false` + `@MockBean UserContextHelper` | atendido | `NfeImportConcurrencyTest.java:55-56, 69, 90` |
| **Decisão (2)** — sobreposição determinística com conexão JDBC crua segurando `FOR UPDATE` e duas sessões em `pg_stat_activity` com `wait_event_type='Lock'` antes de liberar | atendido | `NfeImportConcurrencyTest.java:106-122` (lock + rollback só depois da espera), `:162-177` (espera com `fail` explícito) |
| **Decisão (3)** — 2 `put`, 1 `delete`, chave apagada não referenciada | atendido | `NfeImportConcurrencyTest.java:144-149` |
| **Decisão (4)** — escopo é a mesma nota | atendido | uma única fixture/chave (`:204-207`); `nfe-valida.xml:4` |
| **Fronteira** — sem migração, sem índice, sem Tarefa 9 | atendido | diff de `apps/api` = 1 arquivo de teste; nada em `apps/web`/`db/migration` |
| **Registro honesto de que o teste é de caracterização (nasceu verde)** | **não atendido** | `NfeImportConcurrencyTest.java:52-53` não diz isso; `plan.md:105-110` não tem "desvio registrado" e mantém `plan.md:107` |

## Apontamentos bloqueantes

1. **O teste não registra em lugar algum que nasceu verde / é de caracterização, e o plano ainda o descreve como RED** — `plan.md:107` ("Falha antes da trava de obra existir, quando as duas gravações podem passar pela checagem de leitura ao mesmo tempo") e `NfeImportConcurrencyTest.java:52-53`.
   Critério violado: item de verificação do despacho ("o teste registra honestamente ser de caracterização"); é a mesma exigência de honestidade de RED do método, que na Tarefa 2A foi cumprida com "desvio registrado na execução" (`plan.md:55`, itens (b) e (c)).
   Evidência: a trava `FOR UPDATE` já existia desde a Tarefa 1 (`NfeKeyGuard.java:18-23`, `ProjectRepository.java:19-22`) e o diff desta tarefa não toca código de produção — logo o teste não tinha como falhar antes, e a frase do plano não é reproduzível no estado entregue. Diferente das tarefas anteriores, a Tarefa 7 (`plan.md:105-110`) não traz nota de desvio. Não há CA violado; o problema é a ausência do registro que separa "teste primeiro" de "teste de caracterização".

## Sugestões (não bloqueiam)

1. **A espera de sobreposição é mais frouxa que o padrão já existente no repositório.** `NfeImportConcurrencyTest.java:166-171` conta qualquer sessão com `wait_event_type='Lock'` no banco, sem amarrar as duas sessões ao bloqueador nem identificar os PIDs das requisições. O `PaymentSettlementIntegrationTest.java:133-144` faz melhor: captura o PID do bloqueador e de cada requisição e usa `pg_blocking_pids` para provar que as duas estão bloqueadas por ele. Hoje a asserção passa porque não há outro Lock concorrente, mas fica vulnerável a ruído se a suíte ganhar paralelismo.
2. **Falta amarrar o comprovante sobrevivente ao vencedor.** `NfeImportConcurrencyTest.java:147-149` só prova que a chave apagada não aparece nos `receipt_key`. Vale também afirmar que o `receipt_key` remanescente não é nulo e é uma das duas `put` (idealmente a que não foi apagada), senão uma regressão em que o vencedor também apaga passaria com 2 linhas "órfãs".
3. **O `N` de linhas está fixo em 2** (`NfeImportConcurrencyTest.java:134`) enquanto o comentário fala "N linhas do XML". Derivar de `nfe-valida.xml` (ou documentar que a fixture tem 2 itens) evita que uma edição futura da fixture deixe a asserção desatualizada.

## Execução do orquestrador

Rodei `NfeImportConcurrencyTest` junto da suíte de importação a partir de `apps/api` com PostgreSQL local: 46 testes, 0 falhas, `BUILD SUCCESS` (`NfeImportConcurrencyTest` 1).
