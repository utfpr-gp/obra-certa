# Parecer de Código — Tarefa 3

**Veredito:** APROVADO

## Testes que eu rodei

- **Frontend — executado:** `npm.cmd test -- --watch=false --browsers=ChromeHeadless` em `apps/web` → **112 de 112 SUCCESS** (1,328 s), incluindo `budgets-page.component.spec`, `budget.service.spec` e `category.service.spec`.
  `npx.cmd ng test ...` (comando do despacho) → `{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}`; `npm test ...` puro → `npm.ps1 não pode ser carregado porque a execução de scripts foi desabilitada` (ExecutionPolicy). Só `npm.cmd test` passa pela allowlist.
- **Backend — NÃO executado.** Tanto o comando literal do despacho (`$env:...; .\mvnw.cmd test`) quanto `.\mvnw.cmd -Dtest=... test` retornam exatamente `{"error":{"type":"permission.rejected","message":"Permission denied: shell"}}`. A allowlist (`.opencode/agents/revisor-codigo.md:10-20`) não tem entrada para `mvn`/`mvnw`; é o mesmo bloqueio que a r1 registrou. O julgamento do backend abaixo é por leitura.
  Existem artefatos em `apps/api/target/surefire-reports/` (16 classes, **52 testes, 0 falhas/0 erros**, incluindo `UserContextHelperTest` 7/7, `BudgetServiceTest` 4/4, `ProjectServiceTest` 2/2, `BudgetAntiIdorIntegrationTest` 1/1), com `target/classes` recompilado às 23:32-23:36 contra fontes modificadas às 23:31-23:36 — cronologia compatível com a correção atual. **São artefatos do implementador, não execução minha.**

## Apontamentos (bloqueiam)

Nenhum.

## Correção verificada

- **Centralização real:** `configuration/security/UserContextHelper.java:24-40` é cópia fiel do resolvedor removido de `ProjectService.java:102-124` (na base), com os cinco ramos preservados — `authentication` nulo, `!isAuthenticated()`, `principal` nulo, `principal instanceof User`, `UserDetails` via `userRepository.findByEmail`, principal não suportado → `ResourceNotFoundException`. Nenhuma mudança de semântica.
- **Duplicação eliminada:** grep por `SecurityContextHolder` em `apps/api/src` retorna só `UserContextHelper` e `SecurityFilter`. `ProjectService.java:34-49` e `BudgetService.java:39-48` injetam só o helper; nenhum dos dois importa `UserRepository` (o de `ProjectService` foi removido, cf. diff em `ProjectService.java:12-15`).
- **Ramos provados sem enfraquecer os testes de serviço:** `UserContextHelperTest` cobre os 7 caminhos, incluindo `principal` nulo e não suportado (`UserContextHelperTest.java:88-95`, `108-115`); os dois testes de serviço continuam afirmando o que afirmavam (`ProjectServiceTest.java:57-60` ainda verifica `project.getUser() == authenticatedUser`; `BudgetServiceTest.java:176-186` ainda verifica a query de posse `findByIdAndUserIdAndDeletedAtIsNull(..., "user-1")` e `verifyNoInteractions(budgetRepository, expenseRepository)`). A cobertura do “quem é o usuário” migrou para o teste do helper, não desapareceu.
- **End-to-end do caminho novo:** `BudgetAntiIdorIntegrationTest` autentica por JWT, portanto o principal real é o `User` injetado por `SecurityFilter.java:34-35` — exatamente o primeiro ramo do helper. Passou.
- **Escopo:** `git diff 0bce73c` não toca migrations, `SecurityConfigurations`, nem adiciona escrita (`BudgetController` só tem `GET`). O `UserContextHelper` é o conserto aceito do apontamento da r1, não escopo novo — e o nome já constava em `docs/architecture.md:66` desde o commit `710e272`.

## Sugestões (não bloqueiam)

- **Pacote do helper diverge do desenho do `architecture.md`** — `apps/api/src/main/java/com/obracerta/configuration/security/UserContextHelper.java:1` vs `docs/architecture.md:66`.
  Escolha **defensável**: `TokenService`, `SecurityFilter` e `SecurityConfigurations` já vivem em `configuration/security/` desde antes desta tarefa, e o documento está desatualizado também para esses três; a coesão com os vizinhos reais vence um caminho que não existe no repo. Não bloqueio porque não há prejuízo concreto hoje. Ainda assim, o custo da divergência é a Tarefa 4-6 (que mexe em `BudgetService`) ou qualquer leitor que siga o documento criar `com.obracerta.security.UserContextHelper` — e aí a duplicação volta com dois `UserContextHelper` no classpath. Vale alinhar um dos lados: mover o pacote `security` inteiro (4 classes) ou atualizar a árvore do `architecture.md`.
- **O contrato “sem autenticação → 404” não está documentado no único lugar onde ele agora mora** — `UserContextHelper.java:26-29`.
  Esse `ResourceNotFoundException` para requisição não autenticada é herdado do código original e hoje é invisível (o `SecurityFilter` barra antes com 403). Concentrado num helper único, o próximo desenvolvedor que precisar mexer em autenticação (Tarefas 4-6, ou um futuro job/consumidor chamando o service fora de request) não tem como saber que trocar por `401` quebra o contrato esperado pelos testes e pela spec. Um comentário de uma linha no `if`, ao lado do javadoc, fecha isso sem mudar comportamento.

## Observações fora do escopo deste diff

- As **5 sugestões da r1** (`categories`/`forkJoin`, `Intl.NumberFormat` recriado, três `switch` paralelos, `role="progressbar"`, helpers duplicados entre os testes Anti-IDOR) continuam abertas e **não** foram implementadas, como o despacho indicou. Não rejulgadas aqui.
- **Dois pacotes de service convivendo:** `com.obracerta.service` (`ProjectService`, `BudgetService`, `ExpenseCategoryService`, `DemoDataSeederService`) e `com.obracerta.services` (`AuthService`, `UserService`), contra `docs/architecture.md:60`. Pré-existente, não tocado pelo diff; candidato a Issue de manutenção, porque a diferença de um plural decide onde a Tarefa 4 vai criar o próximo service.
- A allowlist do revisor (`.opencode/agents/revisor-codigo.md:10-20`) continua sem `mvn`/`mvnw`: todo parecer de backend sai sem execução. Candidato a Issue de processo, já sinalizado na r1 e ainda válido.
- `docs/architecture.md:373` anuncia Vitest/jsdom e `npm test`, mas `apps/web/package.json:9,49-54` roda Karma + Jasmine. Documento desatualizado, não o código.
