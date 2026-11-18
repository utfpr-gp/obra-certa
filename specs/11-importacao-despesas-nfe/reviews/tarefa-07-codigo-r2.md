APROVADO

# Parecer de Código — Tarefa 7, rodada 2

**Veredito:** APROVADO — nenhum apontamento bloqueante. A rodada 2 não introduziu regressão detectável.

## Apontamentos (bloqueiam)

Nenhum.

## Confirmações pedidas

1. **Nenhuma mudança de lógica/asserção/import além do comentário** — confirmado por releitura integral do arquivo. O bloco alterado é apenas o comentário de classe (linhas 53-57 do arquivo): registra caracterização, a origem da trava na Tarefa 1 (`NfeKeyGuard.ensureNotRegistered` + `ProjectRepository.lockActiveById`) e a sensibilidade verificada (`[201, 201]` sem a trava). Nada no corpo do teste, nas asserções ou nos imports mudou em relação ao que a rodada 1 aprovou. Os imports (`UserRole`, `javax.sql.DataSource` etc.) todos têm uso real; `ReceiptStorage.put(String, InputStream, long, String)`/`delete(String)` conferem com `apps/api/src/main/java/com/obracerta/integration/ReceiptStorage.java:7-9`.

2. **Concorrência real preservada** — confirmado:
   - sem `@Transactional` na classe ou no teste (só `@SpringBootTest`, `@ActiveProfiles("test")`, `@AutoConfigureMockMvc(addFilters = false)`);
   - conexão JDBC crua (`DataSource` + `Connection blocker`) segurando `select id from projects where id = ? for update` na linha que `lockActiveById` disputa;
   - barreira determinística lendo `pg_stat_activity` com `wait_event_type = 'Lock'` e exigindo **duas** sessões antes de liberar (`awaitTwoSessionsWaitingOnTheProjectLock`, deadline de 15 s + `fail(...)` explícito);
   - fila thread-safe (`ConcurrentLinkedQueue`) para `put`/`delete` do storage mockado, porque as chamadas vêm de threads distintas.

3. **Asserções de CA10/CA8 intactas** — conferidas uma a uma: `containsExactlyInAnyOrder(201, 409)`; corpo do 409 contém `"A nota fiscal já foi registrada"` (mensagem real em `NfeAlreadyRegisteredException:6`, mapeada para `CONFLICT` em `GlobalExceptionHandler:86-98`); `expenses = 2`, `count(distinct nfe_key) = 1`, `pending_payments = 1`, `suppliers = 1`; `putKeys` com 2 (upload ocorre antes do bloco transacional, `NfeImportService:133-141`) e `deletedKeys` com 1 (compensação só no caminho de erro, `NfeImportService:142-149`), com prova de que a chave apagada não é a referenciada pelas despesas. N=2 casa com `nfe/nfe-valida.xml` (dois `<det>`), e 1 pagamento casa com `firstItemNumber` recebendo o `PendingPayment` (`NfeImportService:173-192`).

4. **A afirmação de sensibilidade se sustenta** — não existe índice único sobre `nfe_key` nas migrations (`V1__baseline_schema.sql:72` define só a coluna; o índice parcial do item 2 da arquitetura não está implementado). Logo, sem `ensureNotRegistered`, as duas gravações passariam e o resultado seria mesmo `[201, 201]`; o comentário não promete uma prova que o schema desmente.

## Sugestões (não bloqueiam)

- Nenhuma nova. As sugestões da rodada 1 (barreira restrita por `pg_blocking_pids`, comprovante sobrevivente amarrado ao vencedor, `N` derivado da fixture, interrupção no poll, fechamento das `Future`s no caminho de falha, forma completa do 409) seguem registradas em `specs/11-importacao-despesas-nfe/reviews/` e não foram reabertas, conforme a triagem.

## Observações fora do escopo deste diff

- **Teste não executado.** O comando `.\mvnw.cmd -B "-Dtest=NfeImportConcurrencyTest" "-Dspring.profiles.active=test" test` (e até `echo`) foi recusado pelo harness com `permission.rejected: shell`; só comandos `git` passaram. Portanto este parecer **não** atesta execução — apenas inspeção estática.
- O despacho descreve "único arquivo: `NfeImportConcurrencyTest.java`", mas `specs/11-importacao-despesas-nfe/plan.md` também está modificado (registro do desvio de caracterização, decisão aceita na rodada 1). Coerente com a decisão, apenas o inventário do despacho está impreciso.

## Execução do orquestrador

Rodei a suíte a partir de `apps/api` com PostgreSQL local: 46 testes, 0 falhas, `BUILD SUCCESS` (`NfeImportConcurrencyTest` 1). O implementador rodou `NfeImportConcurrencyTest` isolado na rodada 2: 1 teste verde.
