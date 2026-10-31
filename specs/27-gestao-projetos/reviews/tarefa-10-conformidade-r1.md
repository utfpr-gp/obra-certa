# Parecer de Conformidade — Tarefa 10

## Veredito
**APROVADO COM RESSALVAS**

A implementação atende ao desenho pedido pelo plano e ao contrato real da API. A ressalva é de **prova**: o critério obrigatório "`mvnw.cmd test` completo verde" não pôde ser verificado nesta revisão (harness bloqueou `mvnw`/`docker` e não existe nenhum relatório Surefire na árvore). Não afirmo suíte verde.

## Critérios cobertos

- **CA7 (prova de 404 uniforme):** atendido no nível da fatia. O helper `assertNotFoundPayload` (`ProjectControllerTest.java:78-88`) é aplicado aos três verbos — GET (`:57`), PUT (`:65-67`), DELETE (`:75`) — e todos passam pelo `ProjectController` real e pelo `GlobalExceptionHandler` (`GlobalExceptionHandler.java:17-29`), não por um handler mockado. O payload afirmado bate com `ApiErrorResponse` (`ApiErrorResponse.java:6-13`): `timestamp`, `status` 404, `error` "Not Found", `message`, `path`, `fieldErrors` array.
- **Contexto do `@WebMvcTest`:** atendido. Os mocks `TokenService` (`:46-47`) e `UserRepository` (`:49-50`) são exatamente os mesmos de `ProjectValidationTest.java:31-38`, que já carrega em HEAD; `SecurityFilter` (`SecurityFilter.java:20-24`) depende só desses dois beans. `@AutoConfigureMockMvc(addFilters = false)` (`:28`) mantém o padrão da classe vizinha.
- **PUT chega ao service com corpo válido:** atendido. `VALID_UPDATE_BODY` (`:36-38`) usa `NEW_CONSTRUCTION`/`IN_PROGRESS`, que existem em `ProjectType.java:4` e `ProjectStatus.java:4`, e `name`/`type`/`status` satisfazem `ProjectUpdateDTO.java:10-15`. Sem 400 de validação, o fluxo entra em `projectService.update(...)` (`ProjectController.java:40-45`) e o mock lança a exceção.
- **DELETE usa `doThrow` corretamente:** atendido — `doThrow(...).when(projectService).delete(PROJECT_ID)` (`:72-73`) é a forma correta para método `void` (`ProjectService.java:95`).
- **Contrato de idioma (decisão A):** atendido. `NOT_FOUND_MESSAGE = "Projeto não encontrado"` (`:35`) é idêntico a `ResourceNotFoundException.java:6`, e o comentário `:33-34` registra a decisão; `error` continua em inglês, coerente com `docs/architecture.md:280-289`.
- **Sem mascaramento:** atendido. Nenhum `@Disabled` em `apps/api/src/test` (busca por `Disabled|excludes|skipTests|surefire` só encontra `Dockerfile:6` e a configuração de `argLine` em `pom.xml:108-115`, sem `<excludes>`). Portanto a classe roda na suíte.
- **Escopo de produção intocado:** atendido. `git diff --stat` = 1 arquivo, 56 inserções / 9 remoções, só o teste. Nenhuma mudança em `exception/`, DTO, controller ou migration; a decisão A não exigia mudança de produção.
- **Cobertura ponta a ponta de CA7 (já existente, reforça a fatia):** GET em `ProjectAntiIdorIntegrationTest.java:70-83` (obra alheia vs. id inexistente com payload idêntico) e PUT/DELETE em `ProjectLifecycleTest.java:181-196` (404 e obra intacta).
- **"Alternar" do CA7:** fora do escopo desta tarefa — não existe endpoint de alternância na API (busca por `PatchMapping|activate|active` em `src/main/java` não retorna nada); a alternância é estado de cliente (`localStorage`, CA2). O plano pediu apenas GET/PUT/DELETE.

## Apontamentos

1. **[Alta] Critério obrigatório "suíte completa verde" não comprovado** — `apps/api/target` não existe (nenhum `surefire-reports` para conferir), e `git diff --stat` mostra só o teste alterado, sem qualquer artefato de execução. Tentei rodar o roteiro do despacho (`docker exec ... psql`, `mvnw.cmd test`, inclusive via `cmd /c` e com `workdir` em `apps/api`) e todas as tentativas retornaram `Permission denied: shell`; neste harness o shell só liberou comandos `git`. Sem `pom.xml:108-115` ter `<excludes>`, a classe roda — logo o risco de pipeline vermelho não está descartado, apenas não verificado. **Ação:** rodar a suíte completa no ambiente autorizado e anexar a saída/relatórios antes do PR. *Se* a execução ficar verde, este apontamento cai e o veredito é APROVADO.

2. **[Baixa] Asserções de "não exposição" são tautológicas na fatia** — `jsonPath("$.name").doesNotExist()` e `jsonPath("$.location").doesNotExist()` (`ProjectControllerTest.java:86-87`) não podem falhar para nenhum `ApiErrorResponse`, pois o record não tem esses campos (`ApiErrorResponse.java:6-13`). O nome dos testes ("...WithoutExposingAnotherUsersProject...") sugere uma prova de anti-IDOR que a fatia não dá, já que `ProjectService` está mockado e lança a exceção independentemente de dono. A prova real está nas camadas de integração (`ProjectAntiIdorIntegrationTest.java:79-83`, `ProjectLifecycleTest.java:181-196`), que cobrem o mesmo critério. Sem ação obrigatória — registro para não se superestimar a cobertura da fatia.

3. **[Baixa] Dívida pré-existente, fora desta tarefa:** `UserControllerTest.java:14-20` tem todos os `@Test` comentados, então o CI "passa" sem exercitar `/api/users`. Não é bloqueador da Tarefa 10; fica registrado como risco.

## Testes executados

- **Não executados.** O harness negou `shell` para `docker`, `mvnw.cmd`, `cmd /c` e `.\mvnw.cmd -v` (`Permission denied: shell`); só `git status`, `git diff` e `git log` foram liberados.
- **Relatórios existentes:** nenhum. `apps/api/target` não existe (`glob apps/api/target/**/*` → vazio), portanto não há `surefire-reports` para conferir — nem verdes, nem vermelhos.
- **Limitação registrada:** não afirmo suíte verde. A análise acima é estática (diff completo, contrato, enums, assinaturas de serviço, mocks e configuração do Surefire).
- **Ponto a confirmar na execução:** a mensagem acentuada em `:83` é a única asserção não-ASCII da suíte de controllers; se a execução real acusar divergência em `$.message`, verificar charset da resposta do `MockMvc` antes de suspeitar do contrato.

## Conclusão

A Tarefa 10 está **implementada conforme o plano e a decisão (A)**: contexto do `@WebMvcTest` corrigido com os mocks do `SecurityFilter`, contrato real afirmado em português, GET/PUT/DELETE cobertos pelo mesmo helper, nenhum mascaramento e nenhuma mudança de produção, DTO, exceção ou migration. O único item pendente é o critério obrigatório de execução da suíte completa, que este revisor não conseguiu rodar nem comprovar por relatórios. Antes do Pull Request, rode `mvnw.cmd test` completo contra o `obracerta_test` e anexe o resultado; com isso verde, o parecer passa a APROVADO.
