# Parecer de Código — Tarefa 7A — Rodada 2

**Limitação de execução:** nesta sessão o harness negou a ferramenta `shell` (`Permission denied: shell`) em todas as tentativas — não consegui rodar `git diff cb7a5e4` nem a suíte Karma. Confirmei por `.git/HEAD`/`.git/refs/heads/feature/27-gestao-projetos` que o HEAD é exatamente `cb7a5e4`, ou seja, o trabalho revisado é o não commitado, e li os arquivos completos. O escopo foi conferido por leitura cruzada (os identificadores novos só aparecem em `home-page/**` e `confirm-modal/**`; `navbar` e `project-modal` mantêm as linhas citadas na rodada 1), não pelo diff. **O parecer é estático e não atesta a execução da suíte.**

## Veredito
Apontamentos bloqueadores

## Apontamentos

1. **[Média]** O fechamento do apontamento 1 da rodada 1 cobre só um dos dois caminhos de cadastro: criando a primeira obra pela Navbar, o usuário continua preso no onboarding.
   `showOnboarding()` depende exclusivamente de `projects().length === 0` (`apps/web/src/app/features/home-page/home-page.ts:86-88`) e é avaliado antes do dashboard (`home-page.html:24`). O reload adicionado em `onProjectSaved()` (`home-page.ts:139-142`) só é acionado pelo modal que pertence à própria HomePage (`home-page.html:301-305`). A Navbar tem outro `ProjectModal` e outro handler, que apenas atualiza a lista local dela e fecha o modal (`navbar.component.ts:83-89`, `navbar.component.html:27-29,57-62`). Como a Navbar é renderizada em `/home` (`main-layout.component.html:25`), o caminho real é: onboarding → dropdown "Selecionar obra" → "Cadastrar nova obra" → salvar. `activeProject` passa a existir, `HomePage.projects` continua `[]`, `showOnboarding()` continua `true` e a tela permanece em "Vamos começar sua obra" até navegação/reload — exatamente o impacto descrito no apontamento aceito ("inclusive quando a obra é criada pelo botão 'Cadastrar nova obra' da Navbar"). O teste novo emite `saved` diretamente no modal da Home (`home-page.spec.ts:194-196`), então não cobre esse caminho.
   Não é reabrir a sugestão recusada de "store compartilhado": a correção cabe só em `home-page.ts`, por exemplo incluindo `!this.activeProject()` na condição de onboarding — o que continua respeitando a decisão de "sem auto-seleção", já que criar pela Navbar é ação explícita do usuário e não seleção automática.

## Verificação dos apontamentos aceitos na rodada 1

1. **Parcialmente fechado.** O caminho do modal da Home está fechado: `onProjectSaved()` fecha e recarrega (`home-page.ts:139-142`), e o teste prova chamada extra a `getProjects` e saída do onboarding (`home-page.spec.ts:171-204`). Falta o caminho da Navbar (apontamento 1 acima).
2. **Fechado.** O erro agora guarda `{ id, name }` da obra que falhou (`home-page.ts:55,166`) e `deleteError` é `computed` que só devolve mensagem quando `activeProject().id === failure.id` (`home-page.ts:73-78`), sem vazar para outra obra. A falha fecha o modal, preserva obra e lista e oferece retry (`home-page.ts:164-167`; `home-page.html:67-83`). Provas: falha mantém estado e mostra banner (`home-page.spec.ts:271-288`), retry reabre a confirmação (`:290-300`), troca de obra esconde o erro (`:310-331`) e voltar à obra que falhou restaura o vínculo, com `deleteProject` chamado para o id certo (`:333-356`). O nome na confirmação vem de `deleteConfirmationMessage` (`home-page.ts:79-85`; teste `:302-308`).
3. **Backdrop inerte:** atendido — o `ConfirmModal` não tem handler de clique no backdrop nem no conteúdo (`confirm-modal.component.html:1-10`), com testes em `confirm-modal.component.spec.ts:76-100` e preservação de botão/X/Escape (`:48-74`; `home-page.spec.ts:370-399`).
4. **Regressões da rodada 2:** não encontrei loop (`onProjectSaved → reloadProjects` não reemite `saved`), perda de dados (o GET apenas substitui a lista e o modal fica fora do `@if` da Home — `home-page.html:301`) nem concorrência relevante (o save só é possível depois que a carga inicial terminou). O `computed` de `deleteError` tem dependências corretas (`deleteFailure` + `activeProject`) e não é redundante com `deleteConfirmationMessage`.

## Sugestões não bloqueadoras

- **Flash de carregamento após salvar:** `onProjectSaved()` chama `reloadProjects()`, que liga `projectsLoading` (`home-page.ts:103-118`); com rede real o dashboard é trocado por "Carregando suas obras..." a cada cadastro. Um refresh silencioso (sem mexer em `projectsLoading`) ou o uso do `Project` emitido evitaria o pisca-pisca.
- **Erro apagado ao cancelar o retry:** `openDeleteModal()` limpa `deleteFailure` antes de abrir (`home-page.ts:145`); se o usuário abrir o retry e cancelar, o aviso da falha some definitivamente. Se a intenção é "oferta de retry persistente", limpe o estado só no sucesso ou no fechamento após nova tentativa.
- **Alvo da exclusão implícito:** `confirmDeleteProject()` relê `activeProject()` no clique (`home-page.ts:153-155`). Guardar o alvo no momento de abrir o modal tornaria o invariante explícito e imune a uma mudança assíncrona de obra ativa (hoje improvável, pois o backdrop cobre a Navbar).
- **Tipo do sinal:** `signal<{ id: string; name: string } | null>` (`home-page.ts:55`) pode ser `Pick<Project, 'id' | 'name'> | null`, alinhado ao modelo existente.
- **Asserção com `!`:** `home-page.spec.ts:349` usa `query(...)!`; um `expect(...).not.toBeNull()` antes evita falha com `TypeError` em vez de mensagem de asserção.
- **Seletores dos estados de página:** onboarding e "Selecione uma obra" ainda são verificados por `textContent` (`home-page.spec.ts:149-157,216-225`), enquanto o resto do spec usa `data-testid`; um testid no container seguiria o padrão adotado.

**Observações:** a suíte não pôde ser executada nesta sessão, então a contagem de testes e a compilação dos specs ficam sem confirmação deste parecer; por leitura, os specs não contêm `buttons[n]`, `parentElement`, `querySelectorAll` nem `any`.
