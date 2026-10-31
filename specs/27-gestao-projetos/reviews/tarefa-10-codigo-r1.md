# Parecer de Código — Tarefa 10

## Veredito
**APROVADO COM RESSALVAS**

## Pontos fortes

- **Contexto corrigido com os mocks mínimos.** O `SecurityFilter` depende apenas de `TokenService` e `UserRepository` (`SecurityFilter.java:20-24`), e o teste adiciona exatamente esses dois `@MockBean` (`ProjectControllerTest.java:46-50`), no mesmo padrão de `ProjectValidationTest.java:31-38`. Não há mock sobrando.
- **`addFilters = false` é adequado ao propósito do slice.** Ele desliga a execução da cadeia, mas mantém o bean do filtro; o teste prova o contrato MVC (status + payload), não a autorização. A prova de posse existe em `ProjectLifecycleTest.java:156-197` (PUT/DELETE) e `ProjectAntiIdorIntegrationTest.java:55-84` (GET), então não há lacuna real de cobertura.
- **Helper único e contrato uniforme.** `assertNotFoundPayload` (`ProjectControllerTest.java:78-88`) aplica as mesmas asserções aos três verbos, sem esconder asserção específica de verbo — não há asserção própria de GET/PUT/DELETE além do status 404, que é comum.
- **PUT e DELETE corretos.** O corpo de `VALID_UPDATE_BODY` atende a `ProjectUpdateDTO` (nome com 13 caracteres, enums válidos — `ProjectUpdateDTO.java:9-16`); `eq(PROJECT_ID)` + `any(ProjectUpdateDTO.class)` é apropriado; `doThrow` é a forma correta para método `void` (`ProjectControllerTest.java:61-76`).
- **Idioma alinhado ao contrato real.** A mensagem `"Projeto não encontrado"` corresponde ao `ResourceNotFoundException.java:6`; o comentário documenta a decisão (`ProjectControllerTest.java:33-35`). O hardcode é pin de contrato, não duplicação acidental: se a mensagem mudar, o teste deve falhar.
- **Escopo cirúrgico.** `git diff --name-only` e `git status --short` mostram somente `ProjectControllerTest.java`; nenhum `@Disabled`, exclusão de Surefire, `skipTests` ou dependência nova (`pom.xml:110-115`).
- **`$.path` correto.** `PROJECT_PATH` é derivado de `PROJECT_ID` e corresponde ao `request.getRequestURI()` devolvido pelo handler (`ProjectControllerTest.java:32,84`).

## Apontamentos

1. **[Baixa]** `$.fieldErrors` é validado apenas como array, não como vazio — `ProjectControllerTest.java:85`.
   O `GlobalExceptionHandler` devolve `List.of()` no 404 (`GlobalExceptionHandler.java:22-28`), e `docs/architecture.md:280-289` fixa `"fieldErrors": []`. `isArray()` aceita `[{"field":"x"}]`; uma regressão que devolvesse erros de campo num 404 passaria. O risco é baixo porque o handler atual é um único método com lista vazia, mas é justamente o teste que existe para pinar esse contrato.

2. **[Baixa]** A guarda de "não expor dados sensíveis" é parcial — `ProjectControllerTest.java:86-87`.
   Só `name` e `location` são negados; `id`, `userId`, `deletedAt`, `stackTrace`, `trace` e `exception` não são verificados. O `ApiErrorResponse` é um record fechado (`ApiErrorResponse.java:6-13`), então hoje não há como vazar; mas o teste não pegaria uma futura troca do handler por `Map`/`ProblemDetail` que incluísse stack trace, o que `docs/architecture.md:295` proíbe. O prejuízo é uma falsa sensação de cobertura de "não expõe dados".

Nenhum dos dois bloqueia a tarefa; não há violação da lista de reprovação do revisor (camada, segredo, erro engolido, abstração desnecessária, duplicação de regra ou teste acoplado a detalhe de implementação).

## Sugestões (não bloqueiam)

- **Nomes dos testes superestimam o que o slice prova.** `returnsNotFoundWithoutExposingAnotherUsersProjectOn*` (`ProjectControllerTest.java:52-76`) sugere prova de Anti-IDOR, mas os filtros estão desligados e o `ProjectService` é mockado para lançar. A prova real está em `ProjectLifecycleTest.java:156-197` e `ProjectAntiIdorIntegrationTest.java:55-84`. Renomear para algo como "mapeia 404 para o payload padrão" ou comentar a divisão de responsabilidade reduz o risco de leitura futura.
- **`@MockBean` está depreciado.** O diff adiciona duas ocorrências (`ProjectControllerTest.java:12,46-50`); a API foi depreciada no Spring Boot 3.4 e será removida no 4.x. O `pom.xml:8` está em 3.5.4, então compila; é consistente com `ProjectValidationTest`. Candidato a tarefa de manutenção para `@MockitoBean`.
- **`timestamp` só com `.exists()`** (`ProjectControllerTest.java:80`). Não valida o formato ISO-8601 do exemplo (`docs/architecture.md:282`); um valor não-ISO passaria. Mesmo padrão de `ProjectValidationTest.java:50`, então é endurecimento, não defeito.
- **O `any(ProjectUpdateDTO.class)` não verifica o mapeamento do corpo.** Se o controller passasse um DTO vazio, o stub ainda casaria. Como o controller apenas delega e a validação do corpo já é coberta por `ProjectValidationTest`, não é necessário; um `argThat` com nome/tipo/status deixaria a prova mais forte.
- **Registrar a decisão de idioma também na spec/review**, não só no comentário do teste. O comentário é claro, mas a decisão de manter a API em português é de produto/contrato e merece registro durável fora do código.

## Testes

- **Executado:** `git diff`, `git status --short`, `git diff --name-only` e leitura dos arquivos envolvidos. O diff confirmado é somente o teste.
- **Tentativa de execução bloqueada:** `cmd /c "mvnw.cmd -Dtest=ProjectControllerTest test"`, `.\mvnw.cmd -Dtest=ProjectControllerTest test` e `mvn -v` retornaram `permission.rejected: Permission denied: shell`. Não há `apps/api/target/surefire-reports` para consultar. Portanto, **não há resultado verde verificado**; a suíte completa não foi executada.
- **Análise estática do fluxo:** GET, PUT e DELETE chegam ao `ProjectController` (`ProjectController.java:35-50`), o mock de `ProjectService` lança `ResourceNotFoundException`, e o `GlobalExceptionHandler` (`GlobalExceptionHandler.java:17-29`) devolve 404 com `timestamp`, `status`, `error`, `message`, `path` e `fieldErrors`. O corpo do PUT é válido para `ProjectUpdateDTO`; o `doThrow` do DELETE é correto para `void`; cada teste usa apenas o stub que consome, sem risco de `UnnecessaryStubbingException`. A análise estática não encontrou motivo para falha.
- **Observação operacional:** o wrapper está em `apps/api/mvnw.cmd`; a suíte precisa ser disparada nesse diretório, com as variáveis de `obracerta_test` informadas no despacho.
- **Risco residual de segurança:** não há teste no repositório afirmando 401/403 para acesso sem token (`grep` por `isUnauthorized`/`isForbidden`/`401`/`403` em `apps/api/src/test` não retorna nada). Isso não é responsabilidade da Tarefa 10, mas o `addFilters = false` deste slice não cobre essa regressão.

## Observações fora do escopo

- `UserControllerTest.java:14-20` tem todos os `@Test` comentados; a classe é inerte e não contribui para cobertura. Se for reativada, o `@WebMvcTest(UserController.class)` precisará de `@MockBean UserService` (`UserController.java:17-18`) e dos mocks de `TokenService`/`UserRepository` do `SecurityFilter`, senão o contexto falha. Candidato a Issue de manutenção; não bloqueia a Tarefa 10.
- `ResourceNotFoundException` tem nome genérico, mas mensagem fixa de projeto (`ResourceNotFoundException.java:5-7`). Hoje só `ProjectService` a usa; se for reutilizada para despesas/orçamentos, a mensagem ficará incorreta. Também fora do diff.

## Conclusão

A Tarefa 10 atinge o objetivo: corrige o contexto do `@WebMvcTest` com os mocks corretos, alinha o teste ao contrato real em português e cobre GET, PUT e DELETE com o mesmo payload de 404. O diff é exclusivamente de teste, sem mascaramento e sem alteração de produção. Os apontamentos são de baixa severidade e não impedem o aceite; a única ressalva relevante é que a suíte completa não pôde ser executada neste ambiente. Recomendo aprovar a tarefa condicionada à confirmação do `mvnw.cmd test` verde pelo orquestrador, no diretório `apps/api` e contra o `obracerta_test`.
