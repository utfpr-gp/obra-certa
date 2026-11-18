# Parecer de Código — Tarefa 10 — Rodada 2

## Veredito
**APROVADO COM RESSALVAS** — nenhum bloqueador. Os três itens aceitos na rodada 1 foram implementados e a suíte está verde; restam duas ressalvas de baixa severidade, ambas de força de asserção, não de comportamento.

## Apontamentos da rodada 1

- **Item 1 (`fieldErrors`) — resolvido, com ressalva de força.** `ProjectControllerTest.java:91` usa `jsonPath("$.fieldErrors").isEmpty()`. O matcher existe no Spring 6.2.9 (`JsonPathResultMatchers.isEmpty()`, presente desde 4.2.1) e passa para `[]`, que é o que `GlobalExceptionHandler.java:28` devolve (`List.of()`). Os três verbos usam o mesmo helper (`:63`, `:71-73`, `:81`) e o relatório Surefire confirma 3/3 verdes, então não quebra GET/PUT/DELETE. A ressalva está no apontamento novo 1: `isEmpty()` não pina mais que o campo é um array presente.

- **Item 2 (campos sensíveis) — resolvido, com um item inerte.** `ProjectControllerTest.java:92-99` adiciona os seis `doesNotExist()` pedidos e mantém `name`/`location` (`:94-95`). A escolha é apropriada para o contrato:
  - `id`, `name`, `location` são campos reais de `ProjectResponseDTO.java:8-16`; se o handler regredisse para devolver o DTO, o teste falha — pin real.
  - `deletedAt` existe em `Project.java:44-45`; pega serialização da entidade.
  - `stackTrace`, `trace`, `exception` cobrem exatamente a proibição de `docs/architecture.md:295` ("omitindo stack traces do cliente") e o payload padrão de erro do Spring Boot.
  - `userId` é o único inerte: `ProjectResponseDTO` não tem o campo e `Project` expõe `user` (`Project.java:27-29`); `grep userId` em `src/main/java` só encontra nomes de métodos derivados de repositório. Ele não pode falhar para nenhuma regressão plausível. Não causa dano, mas é ruído — ver apontamento novo 2.
  - A combinação com o Javadoc resolve a crítica de "falsa sensação de cobertura": o texto da classe (`:27-32`) delimita explicitamente o que a fatia prova e onde está a prova de posse. Antes, só os nomes dos testes sugeriam Anti-IDOR; agora há uma âncora textual no topo da classe, que é o primeiro lugar que um leitor vê.

- **Item 3 (comentário/Javadoc) — resolvido.** O Javadoc (`:27-32`) é preciso e não promete o que a fatia não entrega:
  - "filtros de segurança estão desligados" corresponde a `@AutoConfigureMockMvc(addFilters = false)` (`:34`);
  - "mapeamento 404 para o payload padrão" corresponde ao helper e ao `GlobalExceptionHandler`;
  - as referências a `ProjectAntiIdorIntegrationTest` e `ProjectLifecycleTest` foram verificadas e são corretas: o primeiro prova GET de obra alheia com payload idêntico ao de id inexistente (`ProjectAntiIdorIntegrationTest.java:55-84`); o segundo prova PUT/DELETE de obra alheia com 404 e obra intacta (`ProjectLifecycleTest.java:156-197`).
  - Não há duplicação com o comentário de idioma (`:39-41`): um fala de escopo de prova, o outro de contrato de mensagem. Sem ruído relevante.

## Apontamentos novos

1. **[Baixa] `isEmpty()` sozinho deixa de pinar presença e tipo de `fieldErrors`** — `ProjectControllerTest.java:91`.
   `JsonPathResultMatchers.isEmpty()` delega a semântica de `ObjectUtils.isEmpty(Object)`: `null`, `""`, `{}`, array/coleção vazios passam; só valores não vazios falham. Além disso, `evaluateJsonPath` devolve `null` quando o caminho não existe (é o que faz `doesNotExist()` funcionar para campos ausentes), então um payload **sem** `fieldErrors` também passaria. O `isArray()` anterior falhava nesse caso (exigia `List`), e `docs/architecture.md:287` fixa `"fieldErrors": []`. Ou seja: a troca ganhou em "vazio", mas perdeu em "array presente".
   Prejuízo concreto: um handler que devolvesse `fieldErrors: null`, `""`, `{}` ou omitisse o campo passaria no teste, contra o contrato documentado.
   Correção sugerida (uma linha, opcional): manter `isEmpty()` e somar `jsonPath("$.fieldErrors").isArray()`, ou usar `jsonPath("$.fieldErrors", empty())` (Hamcrest `empty()` exige coleção não nula). Não bloqueia: o handler atual foi verificado e devolve `List.of()`.

2. **[Baixa] `$.userId` não pina nada** — `ProjectControllerTest.java:93`.
   Nenhum DTO ou entidade do backend expõe `userId`: `ProjectResponseDTO.java:8-16` não tem o campo e `Project.java:27-29` serializa o objeto `user`. O caminho real de vazamento por serialização da entidade seria `$.user` (e, pior, `$.user.password`), que o teste não verifica. A linha é inofensiva, mas dá impressão de cobertura que não existe.
   Se o objetivo é guardar contra serialização da entidade, trocar `$.userId` por `$.user`/`$.user.password`; se não, remover a linha. Não bloqueia e não é regressão em relação à rodada 1 (o item foi pedido assim na decisão).

   *Nota:* `doesNotExist()` passa quando a chave existe com valor `null` (a API do matcher é "non-null value does not exist"). Para o objetivo "não expor dado", `null` não é exposição, então o matcher é adequado; só seria insuficiente se o requisito fosse ausência da chave, caso em que `doesNotHaveJsonPath()` seria o matcher estrito. Não há ação necessária.

## Testes

- **Escopo do diff:** `git diff --name-only`, `git status --short` e `git diff HEAD --stat` mostram apenas `apps/api/src/test/java/com/obracerta/controller/ProjectControllerTest.java` (70 inserções, 11 remoções). Nada em `src/main`, `pom.xml`, migrations ou outros testes. As três entradas `??` são os pareceres da rodada 1, não código.
- **Sem mascaramento:** busca por `@Disabled|skipTests|<excludes>|assumeTrue` em `apps/api` só encontra `Dockerfile:6` (pré-existente). `pom.xml:108-115` não tem `<excludes>`. Nenhuma dependência nova — `pom.xml` não foi tocado.
- **Relatórios Surefire presentes** em `apps/api/target/surefire-reports` (8 classes, 20 testes):

  | Classe | Testes | Falhas | Erros | Skipped |
  | --- | --- | --- | --- | --- |
  | `ProjectControllerTest` | 3 | 0 | 0 | 0 |
  | `ProjectValidationTest` | 3 | 0 | 0 | 0 |
  | `ProjectAntiIdorIntegrationTest` | 1 | 0 | 0 | 0 |
  | `ProjectSchemaMigrationTest` | 5 | 0 | 0 | 0 |
  | `ObracertaBackendApplicationTests` | 1 | 0 | 0 | 0 |
  | `ProjectRepositoryTest` | 3 | 0 | 0 | 0 |
  | `ProjectLifecycleTest` | 2 | 0 | 0 | 0 |
  | `ProjectServiceTest` | 2 | 0 | 0 | 0 |
  | **Total** | **20** | **0** | **0** | **0** |

  O XML de `ProjectControllerTest` lista os três testes atuais (`...OnGet`, `...OnPut`, `...OnDelete`) e o `sun.java.command` indica execução em **2026-10-21T03:43:19**, coerente com o relato do despacho.
- **Correção compilada:** `grep` no `target/test-classes/.../ProjectControllerTest.class` encontra `isEmpty` e `doesNotExist` e **não** encontra `isArray` (controle negativo `zzzNotPresent` também não casa). Portanto o artefato compilado é posterior à correção; ela compila e, pela semântica dos matchers, não pode falhar para o payload atual (`[]` é vazio; os seis caminhos não existem no `ApiErrorResponse`). Isso torna o verde seguro mesmo no cenário conservador de relatório gerado antes de uma recompilação.
- **Limitação registrada:** o shell deste harness liberou `git`, mas negou `mvnw.cmd`, `docker`, `cmd /c` e cmdlets PowerShell (`permission.rejected`). Não reexecutei a suíte nem consegui ler mtime dos arquivos; não afirmo `BUILD SUCCESS` por observação direta do console — afirmo 20/20, 0 falhas, 0 erros, 0 skipped pelos relatórios e consistência com os dois relatos de execução. Nenhum resultado foi inventado.
- **Determinismo e independência:** cada teste stuba só o método que consome (`findById`, `update`, `delete`), sem `UnnecessaryStubbingException`; não há estado compartilhado, ordem implícita, dependência de relógio (só `timestamp` `.exists()`) ou de dados de banco. A classe continua isolada e repetível. O contexto `@WebMvcTest` é o mesmo de `ProjectValidationTest` (mesmos três mocks), sem custo novo de testabilidade.

## Conclusão

As correções aceitas foram aplicadas com qualidade: `isEmpty()` substitui `isArray()` sem quebrar os três verbos (3/3 verdes), os `doesNotExist()` cobrem de fato os caminhos de vazamento plausíveis e o Javadoc separa com precisão a prova da fatia da prova de posse, resolvendo a crítica de "falsa sensação de cobertura". Produção, DTO, exceção, handler, service, controller, migrations, `pom.xml` e configuração do Surefire estão intocados; não há `@Disabled`, exclusão, `skipTests` ou dependência nova. A suíte está verde (20/20 pelos relatórios, corroborada pelo artefato compilado com a correção).

**Não há novos bloqueadores.** As duas ressalvas são de baixa severidade e opcionais: (1) somar `isArray()` ao `isEmpty()` para pinar `"fieldErrors": []` por inteiro; (2) trocar ou remover `$.userId`, que não corresponde a nenhum campo real do backend. Nenhuma exige nova rodada para o aceite da Tarefa 10; se não forem feitas agora, viram candidatas a ajuste de manutenção junto da migração de `@MockBean` para `@MockitoBean`.
