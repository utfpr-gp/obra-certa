APROVADO

# Parecer de Código — Tarefa 3 (rodada 2)

**Veredito:** APROVADO. **Os testes não foram executados**: o shell foi recusado (`permission.rejected`) nas duas tentativas, então o comando `.\mvnw.cmd ... test` não rodou. A aprovação vale pela leitura do código; o resultado dos testes precisa ser confirmado antes do PR.

## Apontamentos da rodada 1 verificados

1. **Duplicação do guard: resolvida, semântica preservada.** `NfeKeyGuard.java:20-23`: `ensureNotRegistered` (com `@Transactional`) faz `lockActiveById` na linha 21, antes da leitura, e delega a condição a `ensureNotRegisteredWithoutLock` na linha 22. A condição de contagem existe só em `NfeKeyGuard.java:27`. A trava continua antes da leitura, e o 404 de obra inexistente ou excluída continua vindo do `lockActiveById`. A regra de chave não aparece em nenhum outro lugar do diff.
2. **Preview sem trava: confirmado.** `NfeKeyGuard.java:26-29` não chama `lockActiveById` nem tem `@Transactional`. A consulta `countActiveExpensesByProjectIdAndNfeKey` (`ProjectRepository.java:24-29`) é um `count` simples, sem `@Lock` e sem `FOR UPDATE`. O `@Lock(PESSIMISTIC_WRITE)` está só em `lockActiveById` (`ProjectRepository.java:20-22`).
3. **Ordem posse → parse, com teste.** `NfeImportService.java:24-26` chama `findByIdAndUserIdAndDeletedAtIsNull` antes de `parser.parse`. O teste `preview404ParaObraAlheiaAntesDeLerOXml` (`NfeImportControllerPreviewTest`) usa `nfe-corrompida.xml` com o usuário alheio. Se o parse rodasse primeiro, a resposta seria 400, então o 404 prova a ordem. O teste também afirma o corpo (`status` 404 e a `message` de não encontrado), além de conferir que a contagem de despesas não mudou e que o storage não foi tocado.
4. **Motivo "não é NF-e" no HTTP: confirmado.** `NfeXmlParser.java:30` define `MSG_NAO_NFE`. `GlobalExceptionHandler.java:72-84` devolve `exception.getMessage()` no payload, no formato de §5.2.3. O fixture `nfe-outro-documento.xml` tem raiz `cteProc` no namespace `.../cte`, então cai em `localizarInfNFe` (`NfeXmlParser.java:98-101`) e não em DOCTYPE nem em XML corrompido. O teste `preview400ComMotivoQuandoODocumentoNaoEhNfe` afirma `containsString("não é NF-e")`.

## Demais verificações

- **`NfeImportService` sem escrita:** só tem `UserContextHelper`, `ProjectRepository` (somente `findByIdAndUserIdAndDeletedAtIsNull`), `NfeXmlParser` e `NfeKeyGuard`. Não há save, storage nem repositório de escrita. Aceito.
- **Construtor com `NfeKeyGuard`:** aceitável. É service chamando service, dentro da camada permitida por §5.2.1 (`Controller → Service → Repository`). O controller só depende de `NfeImportService` (`NfeImportController.java:12-14`), sem repositório. Aceito.
- **Escopo do §7.2 (Anti-IDOR):** o filtro por `userId` e `DeletedAtIsNull` é o mesmo padrão de `ProjectRepository.java:17`, usado em outros services e testes. Aceito.
- **Handlers novos:** `NfeInvalidXmlException` (400) e `NfeAlreadyRegisteredException` (409) estão em `GlobalExceptionHandler.java:72-99`, sem duplicata em `src/main`. Ambos seguem o `ApiErrorResponse` de §5.2.3.
- **Código morto:** não encontrei.

## Sugestões (não bloqueiam)

- `NfeKeyGuardTest.java:107`: o nome `readOnlyCheckRefusesAKeyActiveInTheProjectWithoutTakingLock` promete verificar que a trava não foi tomada, mas o teste só confere a exceção. Sugiro renomear para `readOnlyCheckRefusesAKeyActiveInTheProject`. A ausência de trava fica garantida só pela leitura de `NfeKeyGuard.java:26-29`.
- Duplicação de fixture: a montagem de usuário, obra, fornecedor e categoria (`categories.findAll().getFirst()`) aparece em `NfeKeyGuardTest.java:127-147` e em `NfeImportControllerPreviewTest.java` (método `preview409...`, e `user()`/`project()`). Vale extrair um helper de teste quando houver terceiro uso. Hoje são dois.
- `NfeImportControllerPreviewTest` tem um `@AfterEach` de limpeza em SQL manual, que depende da ordem de deleção por causa de FKs. Se outro teste de NF-e precisar da mesma limpeza, extrair.
- `GlobalExceptionHandler.java:72-99`: os handlers novos repetem o bloco de `ApiErrorResponse` que já se repete nos handlers existentes. Mantém o padrão atual; um helper privado reduziria o ruído, mas não é necessário agora.
- `NfeImportControllerPreviewTest` depende de `categories.findAll().getFirst()` com seed do Flyway. É o mesmo padrão de `NfeKeyGuardTest.java:136`, então não é apontamento. Só fica registrado como acoplamento ao seed.

## Observações fora do escopo deste diff

- `NfeXmlParser.java` não está no diff desta tarefa, então não foi julgado aqui. Se tiver teste próprio sem cobrir o namespace de `cteProc`/`NFe` em todos os ramos, é candidato a Issue de manutenção.
- Os handlers de `GlobalExceptionHandler` já existentes repetem o mesmo bloco. Candidato a refatoração de manutenção, separado desta tarefa.
