# Parecer de Código — Tarefa 7A — Rodada 1

**Suíte:** 87/87 SUCCESS (`ng test --watch=false --browsers=ChromeHeadless --no-progress`, executado via `npm test` porque o harness bloqueia `npx`).

## Veredito
Apontamentos bloqueadores

## Apontamentos

1. **[Alta]** A nova precedência do template deixa o usuário preso no onboarding depois de cadastrar a primeira obra. `showOnboarding()` passou a ser avaliado antes de `activeObra()` (`home-page.html:24` e `:41`) e depende de `projects().length === 0` (`home-page.ts:69-71`), mas `onProjectSaved()` apenas fecha o modal (`home-page.ts:122-124`) — não adiciona a obra salva à lista local nem recarrega. O `ProjectModal` define a obra ativa e emite `saved` (`project-modal.component.ts:62-64`); logo, após o primeiro cadastro, `activeProject` está preenchido e `projects` continua vazio, mantendo `showOnboarding()` verdadeiro. Antes da reordenação, `activeObra()` vinha primeiro e o dashboard aparecia. O teste do CTA (`home-page.spec.ts:157-167`) só prova que o modal abre, não simula o salvamento. Impacto: o fluxo principal de CA1/CA5 (primeira obra → dashboard) fica travado na tela "Vamos começar sua obra" até um reload manual — inclusive quando a obra é criada pelo botão "Cadastrar nova obra" da Navbar.

2. **[Média]** O erro de exclusão não é vinculado à obra que falhou e sobrevive à troca de obra ativa, tornando o retry perigoso. `deleteError` é definido em `home-page.ts:146-151`, limpo apenas em `openDeleteModal()` (`:127`) e no sucesso (`:143`), e não reage à mudança de `activeProject` (a Navbar troca a obra sem recriar a HomePage — `navbar.component.ts:66-70`). O banner aparece no cabeçalho da obra atual com "Tentar excluir novamente" (`home-page.html:74-81`), que abre a confirmação para `this.activeProject()` (`home-page.ts:136`). Cenário concreto: falha ao excluir a obra A; o usuário seleciona a obra B na Navbar; o erro de A aparece sob B e o retry oferece excluir B — o modal de confirmação também não nomeia a obra. Falta limpar o erro ao trocar de obra ou vincular mensagem/retry ao id/nome da obra que falhou.

## Sugestões não bloqueadoras

- **Estado de orçamento inalcançável em produção (pré-existente da Tarefa 7):** `budgetAvailability` nasce `'unknown'` (`home-page.ts:56`) e nenhum código de produção escreve `'none'`/`'available'`; as únicas escritas estão em `home-page.spec.ts:122` e `:133`. A distinção com/sem orçamento é provada apenas no teste, e o card de CA5 nunca aparece para o usuário real. Como a fonte de orçamentos pertence à US07, registre a pendência e ligue o signal quando ela existir.
- **Fonte duplicada da lista de obras:** `HomePage.projects` e `Navbar.projects` são carregadas independentemente (`home-page.ts:50`; `navbar.component.ts:27`) e nenhuma é atualizada pelo modal da outra. Foi essa duplicação que transformou a reordenação do template na regressão do apontamento 1; vale avaliar um store compartilhado.
- **Assinaturas RxJS:** `reloadProjects()` (`home-page.ts:89-100`) e `confirmDeleteProject()` (`:139-152`) não usam `takeUntilDestroyed`. `HttpClient` completa, então não há vazamento clássico, mas uma resposta antiga pode sobrescrever a nova se houver reload concorrente. Risco baixo hoje porque o retry só existe no estado de erro.
- **Acessibilidade do `ConfirmModal` (pré-existente):** não há `role="dialog"`, `aria-modal="true"`, `aria-labelledby` nem foco inicial/trap (`confirm-modal.component.html:3-10`). Escape, X e botões estão corretos; a semântica de diálogo continua ausente.
- **`role="alert"` no contêiner com botão:** o bloco de erro de carregamento (`home-page.html:3-18`) tem `role="alert"` abrangendo o CTA "Tentar novamente"; prefira o alerta no texto e o botão fora da região viva.
- **Testes:** os helpers `page()`/`query()` estão duplicados (`home-page.spec.ts:39-45` e `confirm-modal.component.spec.ts:8-14`); e `does not infer missing budgets...` (`home-page.spec.ts:140-143`) verifica o resultado visível, não a regra de não derivar de `orcamentoTotal` — o caso `'unknown'` é o que realmente segura a regressão.

**Escopo do diff:** conferido — apenas `home-page/**` e `confirm-modal/**`, sem migration.
