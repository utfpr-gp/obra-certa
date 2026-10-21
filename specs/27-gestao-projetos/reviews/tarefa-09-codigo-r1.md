# Parecer de Código — Tarefa 9

**Base da revisão:** `git diff` na árvore de trabalho sobre `519f580` — 4 arquivos, +71/−21. Leitura integral de `home-page.ts`, `home-page.html`, `home-page.spec.ts`, `navbar.component.ts`, `navbar.component.html`, `navbar.component.spec.ts`, `active-project.service.ts`, `active-project.service.spec.ts`, `project-modal.component.ts`, `auth.ts`, `spec.md` (CA4) e `plan.md` (Tarefa 9).

> **Limitação:** a suíte não pôde ser executada. O shell só autorizou comandos `git` (`npx ng test ...` retornou `permission.rejected`). A avaliação dos testes é estática.

## Veredito
**APROVADO COM RESSALVAS**

## Pontos fortes
- **Reuso em vez de abstração nova.** `initialize(remaining, userId)` resolve o CA4 sem método novo, sem store e sem tocar `ActiveProjectService` — o `plan.md` só permitia alterar o serviço "se indispensável", e não foi necessário.
- **Persistência provada de verdade no caminho feliz.** O teste novo verifica estado global (`activeProjectState()`), lista, cabeçalho e `localStorage` (`home-page.spec.ts:414-423`), não só a chamada.
- **Dois caminhos cobertos.** Sobra obra (`spec.ts:410-424`) e última obra (`spec.ts:426-441`), incluindo onboarding.
- **Mudança na Navbar mínima e coesa.** `navbar.component.ts:49-55` preserva o toggle, evita reload no fechamento e concentra tudo em `loadProjects()` já existente; a lista é atualizada antes do `initialize` (`:111-113`), na ordem correta.
- **Arquitetura respeitada.** Standalone, signals, `inject()`, nenhum `any`/cast em produção, nenhum `HttpClient` em componente, nenhuma subscription de longa duração, escopo restrito aos 4 arquivos previstos.
- **A decisão do autor (opção A) é legítima** e está textualmente autorizada pelo `plan.md:240`.

## Apontamentos

1. **[Alta] A decisão "não sobrou nenhuma obra" é tomada a partir da lista local da Home, que pode estar vazia ou desatualizada em relação ao servidor** — `apps/web/src/app/features/home-page/home-page.ts:165-171`
   `remaining` sai de `this.projects()`, não do servidor. A própria suíte prova que esse estado é alcançável: `home-page.spec.ts:236-264` ("leaves onboarding when a project becomes active without reloading the local list") mantém `component.projects()` em `[]` com obra ativa criada pela Navbar, e `home-page.html:122` mostra que o botão de excluir está no dashboard, portanto acessível nesse estado.
   Cenário concreto: usuário entra sem obras → cria C e D pelo modal da Navbar (a Home nunca recarrega, `projects()` continua `[]`) → D é a ativa → exclui D pela Home → `remaining` = `[]` → `clear()` → onboarding, **embora C exista no servidor**. CA4 não é cumprido nesse fluxo, que é justamente o fluxo de primeira sessão. O inverso também ocorre: se a lista local contém obra já excluída em outra aba, `initialize` pode selecionar um projeto inexistente, e as telas seguintes caem em 404.
   Justificativa técnica: a correção da Navbar (recarregar ao abrir) não corrige a fonte de dados usada no momento do DELETE. O risco é de decisão errada de navegação persistida no `localStorage`. Precisa de reload pós-DELETE ou de reconciliação com a resposta do servidor antes de decidir entre "próxima obra" e "onboarding" — ou de aceite explícito virando Issue (a dupla lista Home/Navbar é dívida conhecida desde a Tarefa 8).

2. **[Média] `clear()` deixa a chave no `localStorage`, e o código tinha `initialize([], userId)` disponível, que a removeria** — `home-page.ts:170`, `active-project.service.ts:38-40` e `:50-54`
   `clear()` só zera o signal; `initialize([], userId)` cai em `setProject(null, userId)`, que executa `localStorage.removeItem(key)`. Ou seja, o próprio serviço já tem a operação que persiste o reset, e o novo `else` escolheu a que não persiste. Consequência: depois de excluir a última obra, o estado em memória ("nenhuma obra ativa") contradiz o estado persistido (id da obra excluída), e esse id sobrevive ao logout (`auth.ts:39` também chama `clear()`). Hoje o próximo `initialize` com lista que não contenha o id apenas cai em `projects[0]` — silenciosamente ativa a primeira obra em vez de respeitar "sem obra ativa". É dívida pequena em impacto imediato, mas evitável a custo zero e que o teste do caminho de onboarding não detecta (`spec.ts:426-441` não verifica a chave).
   Observação: a assimetria é anterior (`clear()` não recebe `userId`), mas este diff adiciona um novo ponto de chamada e poderia ter usado a via que persiste.

3. **[Média] Reload da Navbar sem cancelamento, deduplicação ou estado de carregamento; resposta antiga pode reverter a obra ativa** — `navbar.component.ts:53` e `:108-120`
   `loadProjects()` dispara um GET a cada abertura, sem `switchMap`/`takeUntil`/guarda de requisição em voo, e o `next` chama `initialize` — que **escreve** estado global e `localStorage`. Dois riscos concretos:
   - **Lista velha selecionável:** enquanto o GET não responde, o dropdown renderiza a lista anterior (`navbar.component.html:20-25`). Logo após uma exclusão, a obra excluída continua clicável por um instante; clicar nela ativa um projeto inexistente.
   - **Resposta fora de ordem sobrescrevendo seleção válida:** o `initialize` lê o cache no momento da resposta, então uma seleção feita no meio é preservada **se** o projeto estiver no snapshot antigo. Se o usuário cria C pelo modal (`setActiveProject(C)`, `project-modal.component.ts:63`) enquanto uma requisição anterior (a do construtor, ou a de uma abertura anterior) ainda está em voo, essa resposta antiga não contém C → `cachedProject` indefinido → `initialize` escolhe `projects[0]` e **persiste** a troca, tirando o usuário da obra que ele acabou de criar. Antes deste diff o `initialize` só rodava no boot; agora pode rodar a cada abertura, multiplicando a janela.
   - Sem `projectsLoading`, o cabeçalho também não sinaliza refresh; e falha no reload mantém a lista antiga selecionável, com o banner de erro global no header (`:115-119`, `html:37-44`).

4. **[Média] O wrapper `activeProjectState` mascara o signal real e muda a semântica de `.set(null)` em relação ao `clear()`** — `home-page.spec.ts:82-89` (uso em `:173`, `:195`, `:229`, `:238`, `:269`)
   O wrapper é uma função com `.set` que delega a `setActiveProject(project, 'user-1')`. Para `null`, isso **remove a chave** do `localStorage`; o `clear()` de produção **mantém**. Os testes de onboarding, portanto, exercitam um estado que a produção não produz por esse caminho — exatamente a dívida do apontamento 2 fica invisível. Também é uma fachada de "signal gravável" sobre uma API que não é signal gravável: qualquer mudança na superfície de `ActiveProjectService` quebra o tipo do wrapper, não a intenção do teste. Um teste que chamasse `initialize`/`clear` diretamente e lesse `activeProjectService.activeProject()` cobriria o mesmo cenário sem a fachada.

5. **[Média] Asserções presas a detalhe de implementação** — `home-page.spec.ts:89`, `:416`, `:435`; `navbar.component.spec.ts:110-114`
   `spyOn(activeProjectService, 'clear')` + `expect(clearActiveProject).not.toHaveBeenCalled()` e `expect(getProjects.calls.count()).toBe(...)` afirmam *como* o código faz, não *o que* ele entrega. Uma refatoração que preserve o comportamento (por exemplo, chamar `clear()` antes de `initialize()`, ou centralizar o reload) quebra o teste sem regressão funcional. No caso da Navbar, o `calls.count()` é redundante: `expect(component.projects()).toEqual([...])` já prova que a lista nova foi aplicada. As asserções comportamentais existem e são boas; essas podem sair.

6. **[Baixa] O teste da Navbar não prova o que o nome promete, e a asserção de ausência passa por acidente** — `navbar.component.spec.ts:43-45` e `:108-123`
   `activeProject` é mock estático (`() => projects[0]`), então o cabeçalho continua exibindo a obra "excluída" e o teste não pode provar que ele passou a mostrar a remanescente. Além disso, `offered` compara `textContent` exato de **todos** os botões: o botão do cabeçalho tem `textContent` `"Casa principalConstrução Nova"` (spans adjacentes), que não é igual a `'Casa principal'`, então `not.toContain` passa independentemente de o cabeçalho estar certo. O teste valida a lista do dropdown — o que o `plan.md:236` pede — mas não o cabeçalho, e quebra se alguém ajustar a cópia ou adicionar texto nos botões. Falta também assertar que `initialize` recebeu a lista nova nesse fluxo.

7. **[Baixa] `userId` capturado no field initializer em vez de no uso** — `home-page.ts:49`
   `inject(AuthenticatedIdentityService).getUserId()` roda na construção. Se o token não estiver legível nesse instante, o campo fica `null` e o DELETE com obras remanescentes chama `initialize(remaining, null)`, que zera a obra ativa mesmo havendo obras — sem erro, sem feedback, caindo no estado neutro. O padrão mais seguro já existe no repo: `project-modal.component.ts:63` chama `getUserId()` no momento da ação. A Navbar usa o snapshot (pré-existente), então a Home seguiu o padrão mais frágil dos dois.

8. **[Baixa] Testes novos usam `h1` e a chave literal do `localStorage` em vez de `data-testid`/API pública** — `home-page.spec.ts:418` e `:420`
   O `architecture.md` §9.1 fixa `data-testid` como seletor. `page().querySelector('h1')` depende da estrutura do template e já tem quatro ocorrências no arquivo (dívida herdada, mas a linha nova a amplia). A chave `'active-project:user-1'` repete o contrato interno do serviço no teste; é a única forma de provar persistência sem expor detalhe, então aceito, mas vale registrar.

9. **[Baixa] "Próxima obra" implementada como "primeira obra restante"** — `home-page.ts:168` + `active-project.service.ts:19-21`
   Com A, B, C e B ativa, excluir B seleciona **A** (fallback `projects[0]`), não C. É defensável ("primeira disponível") e não é defeito de código, mas é decisão semântica que o CA4 ("seleciona automaticamente a próxima obra ativa") deixa ambígua — fica para o revisor de conformidade. Registrar aqui porque o comportamento depende do cache estar apontando para a obra excluída; se algum dia o cache for atualizado antes do `initialize`, a mesma chamada passa a selecionar outra obra.

## Testes
- **Cobertura boa no caminho principal:** duas obras → remanescente ativa, dashboard e `localStorage`; uma obra → onboarding e signal limpo. Determinístico (`of()`), sem timers.
- **Lacunas:** (a) o cenário de lista local vazia/desatualizada com obras no servidor (apontamento 1) não tem teste, apesar de o próprio arquivo provar que o estado existe; (b) nenhum teste verifica a chave do `localStorage` no caminho de onboarding — é onde o `clear()` apareceria; (c) Navbar sem teste de resposta fora de ordem/duplicada e sem prova de que o cabeçalho reflete a troca; (d) sem teste de erro no reload do seletor.
- **Qualidade das asserções:** as comportamentais são robustas e usam `data-testid` nos fluxos de exclusão; as de contagem de chamadas e de `clear` são frágeis (apontamento 5). O wrapper `activeProjectState` (apontamento 4) é o principal smell: melhora o teste antigo, mas esconde o signal real e a divergência de persistência.
- **Execução:** não foi possível rodar `npx ng test --watch=false --browsers=ChromeHeadless` neste ambiente (shell só libera `git`). Não há indício estático de falha; a análise de texto do cabeçalho da Navbar (apontamento 6) sugere que o teste passa, mas pelo motivo errado.

## Observações fora do escopo deste diff
- `Auth.logout()` (`auth.ts:37-41`) chama `clear()`, que não remove `active-project:<userId>` — a chave de obra ativa sobrevive ao logout. Pré-existente; agrava o apontamento 2 e é candidata a Issue junto com uma assinatura `clear(userId)`.
- Duas listas de obras independentes (Home e Navbar) continuam sendo a raiz do apontamento 1; a opção A mitiga a Navbar, não a Home. Candidata a Issue de manutenção (fonte única de lista).
- `docs/architecture.md` §9.1 declara Vitest/jsdom, mas `apps/web/package.json` usa Karma/Jasmine — divergência documental pré-existente.
- O dropdown do seletor não tem `aria-expanded`/`aria-haspopup` no botão de abertura (`navbar.component.html:7`) e o overlay de fechamento é uma `div` clicável (`:16`) — acessibilidade pré-existente, não tocada por esta tarefa.

## Conclusão
A solução é enxuta, bem localizada e resolve o caso comum do CA4 com persistência comprovada, sem criar store nem abstração desnecessária. O que impede o "aprovado" limpo é o **apontamento 1**: a Home decide entre "próxima obra" e "onboarding" usando uma lista que o próprio repositório já documenta como potencialmente desatualizada — há um fluxo de primeira sessão em que o usuário cai em onboarding com obras existentes. Os apontamentos 2 e 4 são baratos de corrigir (`initialize([], userId)` no `else` e remover a fachada `activeProjectState`) e fecham a divergência de persistência que hoje está escondida pelos testes. O apontamento 3 é o risco de concorrência mais relevante da opção A. Sugiro tratar 1 e 2 antes do PR, ou registrar 1 explicitamente como Issue aceita com o aceite do autor.
