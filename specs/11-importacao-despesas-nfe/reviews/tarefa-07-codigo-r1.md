APROVADO

# Parecer de Código — Tarefa 7

Não rodei a suíte: o comando pedido (`.\\mvnw.cmd -B "-Dtest=NfeImportConcurrencyTest,NfeImportControllerConfirmTest,NfeKeyGuardTest" "-Dspring.profiles.active=test" test`, em `apps/api`) foi tentado e o ambiente negou execução de shell (`Permission denied: shell`). O parecer é baseado em leitura do diff, do código de produção testado e dos testes vizinhos.

## Verificação contra o foco do despacho

- Sem `@Transactional` na classe (`NfeImportConcurrencyTest.java:54-57`) e fixture commitado por `saveAndFlush` fora de transação de teste (`:83-85`) — a concorrência é real, não simulada no mesmo `EntityManager`.
- `ExecutorService` + `CountDownLatch` (`:105`, `:115-118`), conexão JDBC crua com `autoCommit=false` e `select ... for update` na mesma linha que `lockActiveById` trava (`:106-113` × `ProjectRepository.java:19-22`; `NfeKeyGuard.java:21`, chamado em `NfeImportService.java:156`).
- Barreira por `pg_stat_activity`/`wait_event_type='Lock'` com deadline de 15 s e falha explicativa (`:162-177`); `Thread.sleep(20)` é poll limitado, não espera cega.
- Asserções: exatamente `201`/`409` (`:128-130`), mensagem de domínio no corpo do 409 (`:131-132`), 2 linhas (2 itens em `nfe-valida.xml`), `count(distinct nfe_key)=1`, 1 `pending_payments`, 1 fornecedor (`:134-142`), 2 `put` e 1 `delete`, com a chave apagada fora de `receipt_key` (`:144-149`).
- Higiene: conexão bloqueadora em try-with-resources com `rollback` explícito (`:106-122`), pool desligado em `finally` (`:150-152`).
- `@AfterEach` na ordem das FKs (`pending_payments` → `expenses` → `budgets` → `projects` → `suppliers` → `users`), filtrado pelo fixture, sem tocar nas categorias semeadas (`:215-228`).
- Mocks: `ConcurrentLinkedQueue` para as chaves (`:76-77`) e stubs instalados uma única vez antes das threads (`:92-99`); nenhum estado mutável compartilhado incorreto; sem catch vazio, código morto ou import não usado.
- Escopo: só o arquivo novo; nada em `NfeImportService`/`NfeKeyGuard`/`ProjectRepository`, nenhuma migration/índice único, nada da Tarefa 9.

## Sobre a afirmação do relatório (vermelho com `[201, 201]` removendo a trava)

Procede, e a asserção que discrimina **não** é a barreira, é o par `containsExactlyInAnyOrder(201, 409)` (`:128-130`) somado às contagens de storage (`:144-145`). Confirmei no código que o upload acontece antes do bloco transacional (`NfeImportService.java:133-137` × `:139-141`), então no cenário sem trava as duas requisições sobem o XML, passam pela leitura de chave e chegam ao `INSERT` de `expenses`. Esse `INSERT` toma `FOR KEY SHARE` na linha de `projects`, que conflita com o `FOR UPDATE` do `blocker` — ou seja, a barreira é satisfeita por **espera de FK**, não pela trava da obra. Liberada a conexão, as duas gravam e as duas respondem `201`; a asserção de resultado fica vermelha. A barreira, portanto, prova sobreposição, não prova a trava — e o próprio plano registra essa consciência (`specs/11-importacao-despesas-nfe/plan.md:109`, decisão 2).

## Sugestões (não bloqueiam)

1. **Barreira não restrita às sessões das requisições** — `NfeImportConcurrencyTest.java:166-171`. Conta qualquer sessão do banco com `wait_event_type='Lock'` (`pid <> pg_backend_pid()`), inclusive espera de FK e, em ambiente com carga no mesmo banco, sessões alheias. O teste vizinho já resolve isso de forma estrita (`PaymentSettlementIntegrationTest.java:133-144`, com `pg_backend_pid()` por thread e `pg_blocking_pids`). Consequência concreta no sentido "verde sem trava": se a barreira for satisfeita por uma sessão alheia enquanto só uma requisição está bloqueada, o release antecipado pode deixar a segunda requisição checar a chave **depois** do commit da primeira e devolver `409` — verde sem serialização real. Também é a origem mais provável de instabilidade futura do teste.
2. **Acoplamento à ordem "upload antes da trava"** — `:144-145`. `putKeys.hasSize(2)`/`deletedKeys.hasSize(1)` fixam um detalhe de implementação (decisão explícita do plano em `plan.md:109`, decisão 3). Se alguém mover o upload para dentro da transação, depois da trava, o comportamento contratual (um 201, um 409, nenhum objeto órfão) continua correto e o teste fica vermelho. Vale um comentário no teste ligando essas asserções ao CA8 para que a próxima refatoração saiba o que está sendo preservado.
3. **Interrupção em `sleepBriefly`** — `:179-185`: restabelece o flag e o laço continua; como o flag fica setado, os `Thread.sleep` seguintes lançam imediatamente e o laço passa a girar em CPU até o deadline. Melhor abortar (ou `fail`) ao ser interrompido.
4. **Caminho de falha da barreira** — `:120-122` e `:150-152`: se `awaitTwoSessionsWaitingOnTheProjectLock()` falhar, o `rollback` não é executado (a conexão fecha e faz rollback implícito, então não há vazamento de lock) e as `Future`s não são aguardadas; o `@AfterEach` pode rodar os `DELETE` enquanto uma requisição interrompida ainda tenta gravar. `awaitTermination` curto antes do `shutdownNow`/após ele fecha essa janela.
5. **Forma do 409** — `:132`: só verifica substring da mensagem. As outras asserções de contrato de erro no repo verificam `$.status`/`$.path`; aqui bastaria desserializar o corpo para conferir `status=409` e o path do endpoint.

## Observações fora do escopo deste diff

- `git status` mostra `specs/11-importacao-despesas-nfe/plan.md` modificado; está fora do recorte `apps/api` e não foi objeto deste parecer.
- `NfeKeyGuardTest` (pré-existente) cria usuários/obras/fornecedores sem `@AfterEach`, deixando fixture no banco de testes. Não afeta este teste (que filtra por projeto próprio), mas é candidato a manutenção.

## Execução do orquestrador

Rodei a suíte a partir de `apps/api` com PostgreSQL local: 46 testes, 0 falhas, `BUILD SUCCESS` (`NfeImportConcurrencyTest` 1).
