# Auditoria Final — Issue #27 (US14)

**Veredito:** **NÃO PRONTO**

**Base auditada:** branch `feature/27-gestao-projetos`, diff `710e272..8b9e44e` — 119 arquivos, +4761/−407. Árvore limpa. A régua foi o `specs/27-gestao-projetos/spec.md`; o `plan.md` serviu apenas de contexto, nunca de critério.

O diff inclui `spec.md`, `plan.md` e os pareceres porque nasceram na própria branch — isso é esperado. Não há implementação de despesas, orçamentos ou fornecedores; o escopo de produção ficou restrito a obras, autenticação de apoio, Home/Navbar/modais e migrations.

## Cobertura por CA

| # | Critério (resumo) | Situação | Evidência |
| --- | --- | --- | --- |
| CA1 | Cadastro grava obra do usuário, define ativa e oferece “Definir Orçamentos” | **Atendido com ressalva** | Criação vinculada ao usuário autenticado em `ProjectService.java:61-71`; modal define a ativa em `project-modal.component.ts:63`; botão em `project-modal.component.html:39` e navegação em `project-modal.component.ts:70-73`. Ressalva de UX: o botão fica dentro do modal e fecha sem salvar; na Home o atalho equivalente chama-se “Gerenciar Orçamentos” (`home-page.html:175-182`). |
| CA2 | Lista só as obras do usuário, seleção reativa e persistida | **Atendido** | Filtro por usuário e `deleted_at IS NULL` em `ProjectRepository.java:11`; `initialize`/`selectProject` e `localStorage` em `active-project.service.ts:14-29,42-55`; consumo na Navbar em `navbar.component.ts:70-74,106-118`; provas em `active-project.service.spec.ts:33-64` e `navbar.component.spec.ts:68-75`. |
| CA3 | Edição de nome/tipo/local/status refletida imediatamente | **Atendido** | `ProjectService.update` em `ProjectService.java:80-92`; modal em `project-modal.component.ts:52-68`; entrada de edição na Navbar em `navbar.component.html:31`; atualização da lista e do signal em `navbar.component.ts:87-93`; preservação de budgets/expenses provada em `ProjectLifecycleTest.java:75-154` (asserções em `:128-133`). |
| CA4 | Soft delete, inativação dos vínculos e **seleção automática da próxima obra ativa** | **Não atendido — bloqueador** | Soft delete e propagação OK (`ProjectService.java:94-106`; `ProjectLifecycleTest.java:135-153`) e onboarding para a única obra OK (`home-page.ts:86-92`; `home-page.html:24-40`). Mas, havendo outras obras, o sucesso do DELETE chama `clear()` e apenas filtra a lista (`home-page.ts:157-173`), sem `initialize`/`selectProject`. O teste fixa o estado neutro (`home-page.spec.ts:407-417`) e a tela resultante diz “Você possui obras cadastradas. Use o seletor da Navbar…” (`home-page.html:298-308`). `initialize` é o único ponto que escolhe uma obra de fallback (`active-project.service.ts:14-22`) e só é chamado no carregamento da Navbar (`navbar.component.ts:106-118`). O parecer 7A r1 registra o adiamento (`tarefa-07A-conformidade-r1.md:11`), mas a spec não foi alterada. |
| CA5 | Onboarding com zero obras e card de obra sem orçamentos | **Parcial (limitação conhecida)** | Onboarding provado em `home-page.ts:86-92`, `home-page.html:24-40` e `home-page.spec.ts:167-231`. O card “sem orçamentos” existe (`home-page.html:84-97`), mas depende de `budgetAvailability === 'none'` (`home-page.ts:56,65-68`), estado que nenhum código de produção escreve — só os testes (`home-page.spec.ts:124,135,148,159`). Fica dormente até a US07; aceito como limitação declarada, não como bloqueador. |
| CA6 | Validação de nome/tipo impede gravação | **Atendido, com lacuna de teste** | Backend: `ProjectCreateDTO.java:9-13`, `ProjectUpdateDTO.java:10-15` e `ProjectValidationTest.java:40-75`. Frontend: `project-modal.component.ts:22-27,52-54` e `project-modal.component.html:17`. Lacuna: não há teste de submit inválido no `project-modal.component.spec.ts`, nem caso PUT inválido no backend. |
| CA7 | Anti-IDOR: obra alheia retorna 404 sem revelar existência | **Atendido** | `ProjectService.java:73-98` sempre consulta com `userId` (`ProjectRepository.java:13`). GET de obra alheia e de id inexistente devolvem o mesmo 404 (`ProjectAntiIdorIntegrationTest.java:55-84`); PUT/DELETE alheios retornam 404 e não alteram a obra (`ProjectLifecycleTest.java:156-197`). |
| CA8 | Cancelar/Escape abortam a exclusão sem alterar nada | **Atendido** | Escape em `confirm-modal.component.ts:23-28`; backdrop inerte em `confirm-modal.component.html:1-10`; provas em `confirm-modal.component.spec.ts:48-100` e `home-page.spec.ts:419-448`. |
| CA9 | Falha de rede preserva o formulário e permite reenviar | **Atendido** | `project-modal.component.ts:61-67` preserva o form e exibe erro; provas de criação e edição com retry sem redigitação em `project-modal.component.spec.ts:64-140`. |
| CA10 | Migration V2 cria `projects`, FKs e `project_id` em budgets/expenses | **Atendido** | `V2__create_projects_and_project_fk.sql:22-75`; complementos de soft delete em `V3__add_soft_delete_to_project_links.sql:1-4` e timezone em `V4`/`V5`; prova em `ProjectSchemaMigrationTest.java:54-84`. |

## Documentação

- **`docs/prd.md`:** ok. US14 está 🟢 Live em `docs/prd.md:487-494`.
- **`specs/README.md`:** ok. `#27` está 🟢 Implementada em `specs/README.md:18`.
- **`specs/27-gestao-projetos/spec.md`:** `status: implementada` em `spec.md:3`, mas os checkboxes dos CAs continuam `[ ]` em `spec.md:18-29`. Inconsistência menor de forma.
- **`docs/architecture.md`:** precisa de um ajuste. A linha `docs/architecture.md:42` ainda descreve `features/projects/` como o local da “Criação, Edição e Gestão de Obras (US14)”, mas esse diretório não existe — o código está em `shared/components/project-modal/` e `features/home-page/`. A linha `:38` já registra o `ProjectModal`, então falta só corrigir o mapa de pastas. As divergências de `:51` (Vitest × Karma/Jasmine) e `:54` (Spring Boot 4.1.x × 3.5.4 do `pom.xml`) são pré-existentes e não devem ser resolvidas neste PR.
- **Dívida declarada:** as premissas de `spec.md:45-50` apontam para as Issues #03/#04, mas não há marcador `// TODO #<issue>` no código (busca por `TODO|FIXME|HACK` em `apps/` sem ocorrências). O comentário de `home-page.ts:57-60` explica a ausência de dados financeiros, porém não rastreia a Issue. É uma lacuna de processo, não um defeito funcional.

## Revisões e triagem

- As 14 tarefas do plano (1, 2, 2A, 3, 4, 4A, 5, 6, 6A, 6B, 6C, 7, 7A e 8) têm parecer de conformidade e parecer de código; as tarefas que tiveram apontamentos têm arquivo de decisões. A contagem de rodadas está registrada nos arquivos, não na memória do agente.
- **T6C:** os três apontamentos foram recusados com a justificativa “As correções estão ficando muito grandes para a tarefa” e remetidos a uma “Issue de manutenção/segurança separada” (`tarefa-06C-decisoes-r1.md:3-13`), **sem número de Issue registrado**. É o principal risco de processo do PR: a dívida de segurança pode se perder.
- **T7A:** a rodada 2 teve dois apontamentos bloqueadores aceitos (`tarefa-07A-conformidade-r2.md:8`), e o resíduo foi movido para a Tarefa 8 (`plan.md:206,219`), corrigida em `ccf137e` e aprovada em `tarefa-08-conformidade-r1.md:3-7`. O limite de duas rodadas foi respeitado encerrando a 7A e abrindo uma tarefa nova — não houve rodada 3.
- **Commits pós-plano:** `5fc1a35` (manutenção visual de Home/Navbar/modais/tokens) e `8b9e44e` (docs) não têm pareceres. O segundo é só documentação; o primeiro toca UI de produção. Recomendo que o autor registre que essa manutenção foi revisada, ou abra uma nota de revisão retroativa — não é bloqueador, mas é uma exceção à regra “todo código implementado passa por dois revisores”.

## Testes executados

- **Frontend:** `npm.cmd test -- --watch=false --browsers=ChromeHeadless --no-progress` → **95/95 SUCCESS** no HEAD.
- **Backend:** **não executado nesta auditoria**. O harness bloqueou `mvnw`, `mvn` e `cmd` com `Permission denied: shell`. A análise estática, porém, identifica falha determinística no teste novo (ver Bloqueador 2). As execuções registradas nos pareceres foram direcionadas e não cobriram essa classe.
- **Build do frontend:** não reexecutado pelo mesmo bloqueio de shell; o registro do autor indica build OK no HEAD.
- **Árvore de trabalho:** `git status --short` limpo.

## Bloqueadores

### 1. [Alta] CA4 — após excluir uma obra, a próxima obra ativa não é selecionada automaticamente

**Evidência:**
- `home-page.ts:157-173`: no `next` do DELETE, o código chama `this.activeProjectService.clear()` e remove a obra de `projects()`. Não chama `initialize` nem `selectProject`.
- `active-project.service.ts:14-22`: `initialize` é o único método que escolhe `cachedProject ?? projects[0]`. Ele só é chamado em `navbar.component.ts:106-118`, no carregamento inicial da Navbar — não após a exclusão.
- `home-page.spec.ts:407-417`: o teste com duas obras (`activeProject` e `anotherProject`) afirma exatamente o estado errado — `activeProjectState()` fica `null` e `select-project-empty-state` aparece, embora `anotherProject` continue na lista.
- `home-page.html:298-308`: a tela neutra instrui o usuário a usar o seletor da Navbar, confirmando que o sistema não seleciona a próxima obra.
- `active-project.service.ts:38-40`: `clear()` só zera o signal; não remove a chave do `localStorage`. O id da obra excluída permanece no cache até o próximo `initialize`.
- `tarefa-07A-conformidade-r1.md:11`: o parecer registra que a seleção automática foi “explicitamente adiada pelo autor”. Adiar não altera a spec; o CA4 continua exigindo a seleção automática.

**Impacto:** com duas ou mais obras, excluir uma deixa o usuário em um estado neutro artificial, mesmo havendo obras ativas. O critério de aceite não é cumprido no caminho principal de exclusão.

**Correção necessária (sem executar):** após filtrar a lista, chamar `initialize(remaining, userId)` ou `selectProject(remaining[0], userId)`; se a lista ficar vazia, manter `clear()` e cair no onboarding. Adicionar teste com duas obras que prove que a remanescente vira ativa e é persistida no `localStorage`, mantendo o teste de obra única → onboarding.

### 2. [Alta] A suíte backend não pode ficar verde: `ProjectControllerTest` falha por divergência de mensagem

**Evidência:**
- `ProjectControllerTest.java:36` espera `$.message == "Project not found"`.
- `ResourceNotFoundException.java:6` lança `"Projeto não encontrado"`.
- `GlobalExceptionHandler.java:22-28` devolve `exception.getMessage()` no campo `message`.
- `pom.xml:108-115` configura o Surefire apenas com `argLine`; não há `<excludes>`, então a classe é executada por `mvnw test`/CI.
- O arquivo é novo no diff (`git diff --stat 710e272`: `ProjectControllerTest.java | 42 ++`).

**Impacto:** o PR não passa no pipeline. O teste ou o contrato da API está errado — e a inconsistência de idioma se repete: os DTOs usam mensagens em inglês (`ProjectCreateDTO.java:9-13`) e o handler de não encontrado usa português. É preciso decidir o contrato e alinhar os dois lados; o mais provável é corrigir a expectativa do teste para a mensagem real da API, mas a decisão é do autor.

**Correção necessária (sem executar):** alinhar `ProjectControllerTest` ao contrato vigente e rodar a suíte backend inteira (`mvnw test`), não apenas os testes direcionados. Enquanto isso não acontecer, o parecer “testes verdes” não se sustenta.

## Riscos não bloqueadores

1. **Card de “obra sem orçamentos” dormente:** `budgetAvailability` nasce `'unknown'` (`home-page.ts:56`) e só os testes escrevem `'none'`/`'available'` (`home-page.spec.ts:124,135,148,159`). O CA5, na prática, só entrega o onboarding até a US07.
2. **Listas independentes Home/Navbar:** a Navbar carrega as obras uma única vez no construtor (`navbar.component.ts:106-118`); a exclusão feita na Home (`home-page.ts:161-167`) não atualiza essa lista. Até um reload, a Navbar ainda oferece a obra excluída; selecioná-la depois leva a 404. É consequência do mesmo fluxo do Bloqueador 1 e deve ser tratado junto.
3. **CA6 sem prova no frontend:** `project-modal.component.spec.ts` não tem caso de submit inválido, e `ProjectValidationTest.java:61-75` cobre só POST, não PUT. A validação existe no código, mas a regressão não seria pega.
4. **“Definir Orçamentos” no modal descarta o formulário:** `project-modal.component.ts:70-73` emite `closed` e navega sem salvar. Se o usuário preencher e clicar no atalho, perde os dados. Na Home o rótulo é “Gerenciar Orçamentos” (`home-page.html:175-182`), diferente do texto do CA1.
5. **Validação local do JWT é só estrutural:** `auth.ts:71-88` verifica três partes, `alg` não vazio e `exp` futuro; não valida assinatura, emissor, audience ou `sub`. `AuthenticatedIdentityService.getUserId()` confia no payload (`authenticated-identity.service.ts:21-31`), e a Navbar captura o `userId` uma única vez (`navbar.component.ts:24`). O backend continua sendo a barreira real, mas a dívida do T6C ficou sem Issue registrada.
6. **`docs/architecture.md:42` mente sobre a pasta:** `features/projects/` não existe; o código está em `shared/components/project-modal/` e `features/home-page/`. Corrigir antes do merge.
7. **Checkboxes da spec:** `spec.md:18-29` continua com `[ ]` apesar de `status: implementada` (`spec.md:3`). Ajuste de forma, não de conteúdo.

## Recomendação final

**Não abrir o Pull Request ainda.** A implementação cobre bem CA2, CA3, CA6 (backend), CA7, CA8, CA9 e CA10, e o frontend está verde (95/95), mas há dois defeitos reais que impedem o merge:

1. corrigir a seleção automática da próxima obra após o soft delete (CA4) e provar o caminho com duas obras;
2. alinhar `ProjectControllerTest` ao contrato da API e rodar a suíte backend completa até ficar verde.

Depois disso, recomendo ainda: atualizar `docs/architecture.md:42`; registrar o número da Issue de manutenção/segurança prometida no T6C; adicionar o teste de submit inválido no modal (CA6) e, se possível, um teste de PUT inválido no backend. Com esses ajustes, o PR passa a ter condições de ir para a `develop`.

## Matéria-prima para a seção “O que este PR faz e por quê”

- Cria a tabela `projects` e vincula `budgets`, `expenses` e `pending_payments` por FK, com soft delete propagado do projeto para os vínculos.
- Entrega o CRUD de obras em `/api/projects`, sempre escopado pelo usuário autenticado e com 404 uniforme para obra alheia (Anti-IDOR).
- Adiciona o `ActiveProjectService` no frontend, com seleção reativa e persistência por usuário no `localStorage`, consumido pela Navbar e pela Home.
- Implementa o onboarding de zero obras, o dashboard da obra ativa e os modais de cadastro, edição e exclusão com validação e preservação de dados em falha de rede.
- Atualiza o status da US14 no PRD e no índice de specs, deixando a base pronta para a US07 (orçamentos) e a US03 (despesas).
