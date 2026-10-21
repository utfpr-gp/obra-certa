# Parecer de Código — Tarefa 8 — Rodada 1

## Veredito
**APROVADO** (sem apontamentos bloqueadores)

## Base da revisão
`git diff 4011949` → 2 arquivos, +35/−1:
- `apps/web/src/app/features/home-page/home-page.ts`
- `apps/web/src/app/features/home-page/home-page.spec.ts`

Leitura integral de `home-page.ts`, `home-page.html`, `home-page.spec.ts`, `active-project.service.ts`, `docs/architecture.md`, `spec.md` e `plan.md`.

> **Limitação da revisão:** a suíte não pôde ser executada. Neste ambiente o shell só autorizou comandos `git` (`node --version` e `npx ng test ...` retornaram `permission.rejected`), então a avaliação dos testes é estática — verifiquei a lógica, os spies e a cadeia de asserções, mas não o resultado verde. O comando previsto é `cmd /c "npx ng test --watch=false --browsers=ChromeHeadless --no-progress"` em `apps/web`.

## Apontamentos
Nenhum bloqueador.

Pontos que eu conferi e que **passam**:

1. **Dependência reativa correta.** `showOnboarding` (home-page.ts:86-92) lê `this.activeProject()`, que é o próprio signal do `ActiveProjectService` exposto na linha 49. O `computed` registra a dependência e reage à troca global sem `effect`, sem `subscribe` novo e sem store compartilhado — exatamente o que a decisão do autor fixou (nível de teste A).
2. **Precedência preservada.** O template (home-page.html:1-41) mantém erro → carregando → onboarding → dashboard → neutro. Como `showOnboarding` continua exigindo `!projectsLoading()` e `!projectsLoadError()`, o erro de carga segue com precedência mesmo com obra ativa em memória (coberto por home-page.spec.ts:268-276).
3. **Semântica dos estados.** "Zero obras comprovado" agora é `lista vazia ∧ sem obra ativa`; "lista local vazia com obra ativa" cai no dashboard — distinção que o requisito pede. O estado neutro continua alcançável: lista não vazia + `activeProject === null` → `activeObra()` nulo → `select-project-empty-state` (home-page.html:287-298, teste em spec.ts:246-255). Não há estado derivado redundante: `activeObra()`, `hasNoBudgets()` e `deleteError()` já liam `activeProject` antes desta tarefa.
4. **Teste novo prova o comportamento.** spec.ts:214-242 parte de onboarding visível, muda **apenas** o signal global e afirma: onboarding ausente (237), `h1` com o nome do projeto novo (238), dashboard visível (239), lista local ainda `[]` (240) e **nenhuma** chamada nova a `getProjects` (241). Falharia sem a mudança, porque com `projects()` vazio e sem `!activeProject()` a asserção 237 quebraria. É síncrono (`of([])`), sem timers, sem `fakeAsync` — determinístico.
5. **Escopo.** Diff restrito a `home-page/**`; Navbar, `core/` e `ConfirmModal` intocados. Nenhum `effect`, `subscribe` ou auto-seleção introduzido.
6. **Estilo/arquitetura.** Signals + `computed`, `@if`, `inject()` e `data-testid` seguem o que o `architecture.md` §5.1/§9 exige; nomes e estrutura do spec seguem o código vizinho.

## Sugestões não bloqueadoras
- **Asserção de ausência do onboarding acoplada ao texto de marketing.** spec.ts:237 usa `not.toContain('Vamos começar sua obra')`, a mesma cópia de UI que aparece em 5 pontos do arquivo, e a seção de onboarding em `home-page.html:26` não tem `data-testid`. Uma asserção complementar sobre `query('onboarding-create-project')` ser nulo (o CTA já é `data-testid` em home-page.html:33) deixaria o teste imune a ajuste de copy, alinhada ao §9 do `architecture.md`.
- **Duplicação do literal `firstProject`.** spec.ts:181-189 e spec.ts:222-230 repetem a mesma fábrica de `Project` com id/nome diferentes. Uma função local `projectFixture(overrides)` reduziria a manutenção, sem mudar a semântica do teste.

## Observações fora do escopo deste diff
- Em uma sessão real, se a Home carregar antes do cadastro pela Navbar ou depois de uma exclusão feita em outra aba, a lista local pode ficar permanentemente vazia enquanto outras obras existem no servidor. O `confirmDeleteProject` (home-page.ts:157-173) filtra apenas a lista local; com a Home ainda não recarregada, excluir a obra criada pela Navbar pode cair em onboarding mesmo havendo outras obras. Comportamento pré-existente, não introduzido aqui — candidato a Issue de manutenção (fonte única de lista de obras entre Home e Navbar).
- `docs/architecture.md` §9.1 declara Vitest/jsdom para o frontend, mas `apps/web/package.json:47-53` usa Karma/Jasmine. Divergência documental pré-existente; aqui apenas registro, porque o `plan.md` e o despacho falam em Karma.
- `home-page.spec.ts:206-212` ("does not show onboarding when the project list is not empty") depende do valor default do spy `of([activeProject])` sem reconfigurar; funciona, mas o acoplamento ao `beforeEach` fica implícito — já existia antes desta tarefa.
