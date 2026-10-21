# Parecer de Conformidade — Tarefa 10 — Rodada 2

## Veredito
**APROVADO**

## Apontamentos da rodada 1
- **Item 1 (suíte):** **resolvido.** Os relatórios Surefire em `apps/api/target/surefire-reports` totalizam **20 testes, 0 falhas, 0 erros, 0 skipped**, distribuídos em 8 classes: `ProjectControllerTest` (3), `ProjectAntiIdorIntegrationTest` (1), `ProjectValidationTest` (3), `ProjectSchemaMigrationTest` (5), `ObracertaBackendApplicationTests` (1), `ProjectRepositoryTest` (3), `ProjectLifecycleTest` (2) e `ProjectServiceTest` (2). Todos os XMLs compartilham o mesmo `surefirebooter-20261021034319156` (`2026-10-21T03:43:18.974`), caracterizando **uma única execução completa**. Isso corrobora o 20/20 relatado pelo orquestrador e pelo implementador. O log do Maven com a string `BUILD SUCCESS` não está na árvore; o artefato verificável são os relatórios.
- **Itens 2/3 (fieldErrors/campos sensíveis):** **resolvidos.** `ProjectControllerTest.java:91` trocou `isArray()` por `jsonPath("$.fieldErrors").isEmpty()`, coerente com `GlobalExceptionHandler.java:28` (`List.of()`) e com `docs/architecture.md:287` (`"fieldErrors": []`). As linhas `:92-99` adicionam `doesNotExist()` para `id`, `userId`, `name`, `location`, `deletedAt`, `stackTrace`, `trace` e `exception`, alinhadas ao record fechado `ApiErrorResponse.java:6-13` e à proibição de stack trace em `docs/architecture.md:295`. O helper é aplicado aos três verbos: GET (`:63`), PUT (`:71-73`) e DELETE (`:81`). Observação residual: as asserções continuam estruturais contra o record fechado, mas isso foi aceito como endurecimento; não é bloqueador.
- **Item 4 (comentário):** **resolvido.** O Javadoc de classe (`ProjectControllerTest.java:27-32`) separa corretamente o que a fatia prova — mapeamento 404 para o payload padrão, com `ProjectService` mockado e filtros desligados — do que é prova real de posse/Anti-IDOR. A referência é fiel: `ProjectAntiIdorIntegrationTest.java:70-83` prova GET de obra alheia vs. ID inexistente com payload normalizado idêntico e sem mutação; `ProjectLifecycleTest.java:181-196` prova PUT/DELETE de obra alheia com 404 e obra intacta. Não há alegação de Anti-IDOR que o mock sustente. Os nomes dos testes foram mantidos conforme a decisão.

## Regressões
Nenhuma identificada.

- `git diff --name-only` retorna somente `apps/api/src/test/java/com/obracerta/controller/ProjectControllerTest.java`; `git status --short` mostra apenas esse arquivo modificado e os três pareceres da rodada 1 como não rastreados. Não há mudança em produção, DTO, exceção, handler, service, controller ou migration.
- Não há mascaramento: busca por `@Disabled` em `apps/api/src/test` não retorna nada; `pom.xml:108-115` configura apenas `argLine` do Surefire, sem `<excludes>` ou `skipTests`.
- As novas asserções são apenas de teste e não alteram o comportamento da API; o relatório verde da classe confirma que o contrato atual as satisfaz.
- Itens 5–10 da decisão permanecem dívida aceita e não foram reabertos. `UserControllerTest` inerte e ausência de testes 401/403 continuam fora do escopo.

## Apontamentos novos
Nenhum. **Não há bloqueadores.**

## Testes executados
- **Não reexecutei a suíte neste harness:** `mvn -v`, `apps\api\mvnw.cmd -v` e `cmd /c dir` retornaram `Permission denied: shell`; cmdlets PowerShell também foram negados. Registro a limitação, sem inventar resultado.
- **Relatórios conferidos diretamente:** `ProjectControllerTest.txt` → `Tests run: 3, Failures: 0, Errors: 0, Skipped: 0`; `ProjectAntiIdorIntegrationTest.txt` → 1/0/0/0; `ProjectValidationTest.txt` → 3/0/0/0; `ProjectSchemaMigrationTest.txt` → 5/0/0/0; `ObracertaBackendApplicationTests.txt` → 1/0/0/0; `ProjectRepositoryTest.txt` → 3/0/0/0; `ProjectLifecycleTest.txt` → 2/0/0/0; `ProjectServiceTest.txt` → 2/0/0/0. Total: **20/20**.
- **Execução única:** os oito XMLs apontam para o mesmo `surefirebooter-20261021034319156` (`2026-10-21T03:43:18.974`), e o XML de `ProjectControllerTest` lista os três testes `returnsNotFoundWithoutExposingAnotherUsersProjectOnGet/OnPut/OnDelete`, todos sem falha.
- **Análise estática complementar:** `GlobalExceptionHandler.java:17-29` devolve `status` 404, `error` via `HttpStatus.NOT_FOUND.getReasonPhrase()` (“Not Found”), `message` via `exception.getMessage()` (“Projeto não encontrado” em `ResourceNotFoundException.java:5-6`), `path` via `request.getRequestURI()` e `fieldErrors` vazio; o teste afirma exatamente esses valores em `ProjectControllerTest.java:85-99`.

## Conclusão
A Tarefa 10 está **conforme** ao plano e à decisão (A). Os três ajustes da rodada 1 estão presentes e corretos: `fieldErrors` vazio, campos sensíveis ausentes e comentário de classe fiel ao alcance da fatia. O contrato 404 está mais forte e continua correto, com GET, PUT e DELETE passando pelo mesmo helper. Não há mudança de produção nem mascaramento, e a suíte completa está verde nos relatórios Surefire (20/20, sem falhas, erros ou skips). A única limitação é a impossibilidade de reexecução independente neste shell, já suprida pelos relatórios e pelas duas execuções relatadas. Recomendo seguir para o Pull Request.
