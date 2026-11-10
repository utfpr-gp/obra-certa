APROVADO

# Parecer de Código — Tarefa 5 (rodada 2)

**Escopo avaliado:** `git diff --cached 7c9c4ce -- apps/api` (9 arquivos) + leitura dos consumidores do estado de comprovante.
**Régua:** `docs/architecture.md` §5.2, §6 (contratos US03/US04/US08), §7.4 e §9; `utf-rules.md` §4 e §4.1.
**Execução:** **não rodei os testes.** O shell aceita `git`, mas recusou o comando do `mvnw` (`Permission denied: shell`), inclusive dentro de `apps/api`. Parecer estritamente estático.

## Pendência bloqueante da rodada 1 — resolvida

1. **Download do XML agora devolve `.xml`.** `ExpenseReceiptService.java:30-32` introduz `DOWNLOAD_EXTENSIONS` com `application/xml` e `text/xml`, e `:95` passou a usá-lo no nome do arquivo. `ExpenseReceiptController.java:25-28` usa o `contentType` e o `filename` recebidos, então o endpoint entrega `comprovante-<uuid>.xml` com `application/xml`. O teste `ExpenseReceiptIntegrationTest.java:99-110` prova bytes, content type e `.xml` no `Content-Disposition`.
2. **Upload da US03 não foi ampliado.** `ExpenseReceiptService.java:28` (`EXTENSIONS`) continua só JPEG/PNG/PDF, e `validate` (`:82-89`) segue usando esse mapa. `application/xml` cai em `invalid()` → 400. A separação "allowlist de upload × mapa de extensão de download" está documentada nos comentários (`:27` e `:29`).

## Ajustes aceitos — verificados

- **(2) Atomicidade com gatilho na segunda linha + asserção forte:** `NfeImportServiceAtomicityTest.java:118-122` cria gatilho em `expenses` que dispara em `'Areia média lavada'` (2ª linha da fixture `nfe-valida.xml:24-33`); `:124-127` assere `DataAccessException` na cadeia de causas **e** a mensagem `'simulated nfe persistence failure'`. Complementado por `:129-132` (nada gravado, 1 `put`, `delete` da mesma chave). Sem fragilidade do tipo `isInstanceOf(Exception.class)`.
- **(3) Bytes enviados ao storage comparados com a fixture:** `NfeImportControllerPaymentTest.java:89-95` captura o `InputStream` do `put`, e `:129-130` compara o conteúdo com `nfe/nfe-valida.xml`. Cobre o que faltava (não só chave/tipo/tamanho).
- **(4) `log.warn` na falha do delete compensatório:** `NfeImportService.java:143-148`, com a chave e a exceção, e o erro original é repropagado em `:149`.
- **(5) `receipt_size = xml.length`:** `NfeImportService.java:141` e `:177`; o tamanho vem do conteúdo lido, não de `file.getSize()`.
- **(6) Prefixo da chave com `project.getId()`:** `NfeImportService.java:132`; `NfeImportServiceAtomicityTest.java:109` já asserta o prefixo `expenses/nfe/<id>/`.

## Fronteira transacional, ordem e montagem — corretas

- **Template `REQUIRES_NEW`:** `NfeImportService.java:79-80`; `confirm` deixou de ser `@Transactional` (`:96`), então o template é o dono da transação e `persist` (`:140`) roda nela.
- **Guarda `REQUIRED` na mesma transação:** `keyGuard.ensureNotRegistered` é chamado dentro de `persist` (`:156`); `NfeKeyGuard.java:19-23` usa `@Transactional` sem propagation, portanto participa e mantém o `FOR UPDATE` (`ProjectRepository.java:22`) até o commit/rollback do bloco.
- **Ordem:** posse `:99-100` → leitura do XML `:101` → parse `:102` → validações de item/categoria `:104-128` → tipo/pagamento `:130-131` → upload `:133-137` → transação `:139-141`. Os 400 ocorrem antes do upload (e os testes de 400 continuam verificando storage intocado, `NfeImportControllerConfirmTest.java:167/182/197/211`).
- **Compensação:** só no `catch` em volta de `transactions.execute` (`:142-150`), com a mesma `key` enviada e sem engolir o erro.
- **Primeira linha × linhas 2..N:** `firstItemNumber` (`:200-203`) usa `nItem = 1` ou a menor ordem; `:173-193` grava `UPLOADED` + metadados + `PendingPayment` somente nessa linha; as demais ficam `NONE`/nulos e mantêm apenas `paid` do checkbox (`:172`). `PAID` = `dueDate null` + `paid_at` início do dia UTC (`:178-184`); `PENDING` = `dueDate` de emissão (`:185-191`), coerente com `PaymentService`/US08. `ExpenseMapper` não expõe chave nem quebra com `PendingPayment` nulo.
- **Migration V11:** próxima de V10, `DROP`/`ADD` preserva todos os limites da V9 (`V9:7-12`) e só acrescenta os dois tipos XML; sem editar migration aplicada. As linhas `2..N` continuam passando na constraint (`NONE` sem metadados).

## Sugestões (não bloqueiam)

1. **Travar a fronteira do upload em teste:** o caso `application/xml` não está na lista de rejeições de `ExpenseReceiptIntegrationTest.java:112-115`. O código está correto, mas o requisito "não ampliar o upload" ficaria protegido por um caso `receipt.xml,application/xml,text` nessa `@CsvSource`.
2. **Duplicação `EXTENSIONS` × `DOWNLOAD_EXTENSIONS`** (`ExpenseReceiptService.java:28-32`): três entradas repetidas. Derivar o mapa de download do mapa de upload + XML (ou um teste unitário) evita que um tipo novo de upload volte a baixar como `.null`.
3. **Plano não alinhado:** `specs/11-importacao-despesas-nfe/plan.md:94` continua apontando o teste de atomicidade em `.../service/NfeImportServiceAtomicityTest.java`, embora o arquivo esteja em `.../controller/`; e a lista não inclui `ExpenseReceiptService.java`/`ExpenseReceiptIntegrationTest.java`, alterados nesta correção. É a única das sugestões promovidas na rodada 1 que não foi aplicada.
4. **Cobertura de ramos introduzidos:** ainda sem teste para falha do `storage.delete` na compensação, fallback de `firstItemNumber` (nota sem `nItem=1`) e normalização de `xmlContentType` (`text/xml`, nulo, tipo não-XML: `NfeImportService.java:209-213`).
5. **Duas origens para `payment`:** `NfeImportController.java:34` prefere a parte multipart e cai para `request.payment()`. Funciona e é transporte, mas vale um comentário curto ou mover a precedência para o service.
6. **Import não usado:** `org.hamcrest.Matchers.containsString` em `NfeImportControllerConfirmTest.java:40` (herdado da rodada 1).
7. **Otimização opcional:** o upload ocorre antes da guarda de chave, então uma duplicata sobe e apaga o objeto (`NfeImportControllerConfirmTest.java:229-233`). É a decisão 8 do plano; se quiser evitar o round-trip, um `ensureNotRegisteredWithoutLock` antes do `put` mantém a trava dentro da transação.

## Observações fora do escopo deste diff

- **Tela de despesa:** `apps/web/.../expense-detail.component.ts` ainda recalcula a extensão (`jpeg/png/pdf`, resto → `jpg`) e o rótulo de substituição continua falando só em JPEG/PNG/PDF. Deferido à Tarefa 8 pela decisão da rodada 1; não conta contra este parecer.
- **Falha de banco retorna 500 não estruturado:** não há `@ExceptionHandler` genérico em `GlobalExceptionHandler.java`; comportamento anterior ao diff, agora exercitado pelo teste de atomicidade. Candidato a manutenção.
- **`POST /imports` sem `Location`** (`NfeImportController.java:27-28`): já registrado nas rodadas anteriores; manutenção.
- **`architecture.md`** segue sem descrever a V11 e a regra "pagamento só na primeira linha" do `/nfe/imports`; fechamento de documentação.
- **Testes não executados** neste parecer por bloqueio de shell para `mvnw`; sem `target/surefire-reports` disponível para evidência secundária.

## Execução do orquestrador

Rodei a suíte a partir de `apps/api` com PostgreSQL local (`obracerta_test`): 98 testes, 0 falhas, 0 erros, `BUILD SUCCESS` (`NfeImportControllerConfirmTest` 7, `NfeImportControllerPaymentTest` 4, `NfeImportControllerPreviewTest` 8, `NfeImportServiceAtomicityTest` 3, `ExpenseServiceTest` 12, `NfeKeyGuardTest` 8, `ExpenseReceiptIntegrationTest` 23, `ExpenseReceiptRemovalIntegrationTest` 11, `ExpenseReceiptReplacementIntegrationTest` 21, `ReceiptMultipartErrorTest` 1).
