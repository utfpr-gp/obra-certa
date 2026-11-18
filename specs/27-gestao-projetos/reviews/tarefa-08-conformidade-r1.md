# Parecer de Conformidade — Tarefa 8 — Rodada 1

## Veredito
**APROVADO**

## Apontamentos
Nenhum. O diff implementa exatamente a correção residual pedida, com prova suficiente no nível de teste declarado pelo autor (nível A), sem escopo inflado.

## Verificação por critério

- **CA1:** atendido no recorte desta tarefa. A criação passa a definir a obra ativa globalmente em `project-modal.component.ts:63` (`setActiveProject(saved, userId)`), e a Home agora deriva o dashboard desse mesmo signal (`home-page.ts:49,61-64`). O teste novo prova que, uma vez que a obra se torna ativa, a Home exibe o cabeçalho/dashboard com o nome dela (`home-page.spec.ts:237-239`). A ação “Definir Orçamentos” na modal e o restante do CA1 pertencem às Tarefas 6/7 e não foram alterados aqui.

- **CA2:** fora desta tarefa (listagem/seleção na Navbar é Tarefa 5/6). Nada no diff mexe em `getProjects()`, seleção ou `localStorage`; os únicos arquivos tocados são `home-page.ts` e `home-page.spec.ts` (`git diff --stat 4011949`), e `git status --short` não mostra arquivos novos/untracked.

- **CA5:** atendido no recorte. O onboarding continua sendo exibido **apenas** com resposta comprovadamente vazia e sem obra ativa: o teste de zero obras segue intacto em `home-page.spec.ts:149-157`, e o novo teste parte de `getProjects → of([])` + `activeProject = null` e confirma “Vamos começar sua obra” antes da ativação (`home-page.spec.ts:215-220`). A precedência do template (erro → carregando → onboarding → dashboard → estado neutro) está preservada em `home-page.html:1-41,287-299`, e o dashboard não aparece em erro de carga mesmo com obra ativa em memória (`home-page.spec.ts:268-276`). O card “obra ativa sem orçamentos” permanece sob `budgetAvailability === 'none'` (Tarefa 7/7A), sem regressão no diff.

- **Correções obrigatórias:**
  - *Não exibir onboarding com obra ativa válida e lista local vazia:* implementado em `home-page.ts:86-92` com `&& !this.activeProject()`; provado em `home-page.spec.ts:222-239` — o teste ativa a obra sem tocar na lista (`component.projects()` continua `[]`) e verifica que o onboarding some e o dashboard aparece. O teste **falharia sem a mudança**: sem o termo `!this.activeProject()`, `showOnboarding()` continuaria `true` (loading `false`, erro `''`, lista `[]`) e o `expect(...).not.toContain('Vamos começar sua obra')` em `home-page.spec.ts:237` quebraria.
  - *Preservar zero obras e estado neutro:* zero obras provado em `home-page.spec.ts:149-157`; estado neutro (`select-project-empty-state` / “Selecione uma obra”) provado em `home-page.spec.ts:246-255`; ambos passam na suíte.
  - *Caminho de cadastro pela Navbar sem reload manual, sem store compartilhado:* o teste simula fielmente o efeito real do modal (`project-modal.component.ts:61-65` define apenas `activeProject`; `navbar.component.ts:83-89` atualiza somente a lista local da Navbar, sem recarregar a Home), e comprova ausência de nova chamada a `getProjects()` via contagem de spies (`home-page.spec.ts:231,241`). Não há store novo, `effect` novo, auto-seleção nem alteração de Navbar no diff.
  - *Escopo:* restrito a `apps/web/src/app/features/home-page/` (`home-page.ts` + `home-page.spec.ts`), exatamente os arquivos previstos no plano.

- **Execução da suíte:** `ng test --watch=false --browsers=ChromeHeadless --no-progress` (rodado como `npm.cmd test -- ...`, pois o shell bloqueou `npx`/`cmd` diretos) → **92 de 92 SUCCESS**, incluindo o teste novo.
