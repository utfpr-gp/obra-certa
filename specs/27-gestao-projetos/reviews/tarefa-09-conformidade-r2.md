# Parecer de Conformidade — Tarefa 9 — Rodada 2

## Veredito
**APROVADO**

Escopo conferido: `git status --porcelain` e `git diff --stat` mostram apenas os 4 arquivos previstos (`home-page.ts`, `home-page.spec.ts`, `navbar.component.ts`, `navbar.component.spec.ts`; +153/−24). Nenhuma alteração em `active-project.service.ts`, templates, backend ou migration. Suíte Angular executada inteira: **100 de 100 SUCCESS**.

## Apontamentos da rodada 1

- **Item 1 — [Alta] Home decidia pela lista local defasada: resolvido.**
  - `confirmDeleteProject` aplica a lista otimista e chama `refreshActiveProject(remaining)` (`home-page.ts:163-169`). `refreshActiveProject` busca `getProjects()` e decide com a **lista do servidor** (`home-page.ts:184-189`); no erro usa o fallback local (`:190-192`) e **não** toca em `projectsLoadError`, que só é escrito no `reloadProjects` explícito (`home-page.ts:109-124`).
  - O teste de lista defasada (`home-page.spec.ts:424-441`) zera a lista local, mantém `activeProject` ativo, faz o servidor responder `[anotherProject]` (`:430`) e prova: lista vira `[anotherProject]` (`:435`), `activeProject` vira `anotherProject` (`:436`), `h1` mostra o nome (`:437`), chave persistida (`:438`), **sem** "Vamos começar sua obra" (`:439`) e **sem** estado neutro (`:440`). Com a implementação anterior (`remaining` local = `[]`) esse teste falharia em `:436`.
  - O mock simula corretamente o cenário pedido: lista local vazia/antiga + resposta do servidor com a remanescente (`home-page.spec.ts:426` e `:430`).

- **Item 2 — [Média] `clear()` deixava a chave no `localStorage`: resolvido.**
  - O caminho sem obras agora passa por `initialize(projects, userId)` (`home-page.ts:188`), inclusive quando `projects` é `[]`; `initialize` cai em `setProject(null, userId)` (`active-project.service.ts:19-21`), que executa `localStorage.removeItem` (`:42-55`). `clear()` saiu do fluxo da Home (resta apenas no logout, dívida pré-existente).
  - O teste de obra única (`home-page.spec.ts:457-474`) prova onboarding (`:471-472`), `activeProject` nulo (`:468`), lista vazia (`:469`) e **chave removida** (`:470` — `localStorage.getItem('active-project:user-1') === null`). Esse assert falharia com o `clear()` anterior.

- **Item 3 — [Média] Reload da Navbar sem guarda contra respostas fora de ordem: resolvido.**
  - `loadProjects` incrementa `loadRequestId` e ignora `next`/`error` de requisição antiga (`navbar.component.ts:108-125`).
  - O teste com `Subject` (`navbar.component.spec.ts:125-150`) cria um componente novo, dispara duas requisições, emite a **nova** antes da **velha** (`:137-138`) e prova: `projects()` mantém a lista nova (`:140`), `initialize` foi chamado **1 vez** (`:141`) com a lista nova (`:142-145`) e **nunca** com a velha (`:146-149`). Sem a guarda, a resposta velha sobrescreveria a lista e chamaria `initialize` uma segunda vez — o teste falharia.

## Regressões
Nenhuma regressão detectada; a suíte inteira passou (100/100). Evidências dos fluxos exigidos:
- **CA2:** reload ao abrir o seletor e substituição da lista (`navbar.component.spec.ts:108-123`), seleção/persistência (`:68-75`), todos verdes.
- **CA3:** specs do `ProjectModalComponent` executados na mesma suíte, verdes.
- **CA8:** cancelar por botão, `Escape` e fechar mantêm obra e registros (`home-page.spec.ts:476-505`), verdes.
- **Onboarding:** zero obras, cadastro pela Navbar sem reload, lista cheia sem ativa (`home-page.spec.ts:167-262`), verdes.
- **Estado neutro com lista cheia:** (`home-page.spec.ts:265-275`), verde.
- **Erro de carga e retry:** (`home-page.spec.ts:277-311`), verdes.

Notas residuais (não bloqueantes, sem regressão nova):
- Se o refresh pós-`DELETE` **falhar** e a lista local estiver defasada, o fallback ainda pode produzir onboarding falso — é exatamente o comportamento que a triagem aceitou ("fallback local só se a busca falhar", `tarefa-09-decisoes-r1.md:8`).
- Durante o reload do seletor, a lista anterior segue clicável até o GET responder (`navbar.component.html:20-25`); risco já registrado na R1 e não endereçado pela decisão do item 3, que exigiu apenas a guarda de sequência.
- Entre o sucesso do `DELETE` e a resposta do refresh, a obra excluída permanece ativa na tela (`home-page.ts:163-169`); janela normal de assincronia, sem violação de CA4/CA8 no fluxo testado.
- Dívidas 4–9 da decisão seguem como aceitas e **não foram agravadas**: o wrapper `activeProjectState` continua (agora delegando ao serviço real, `home-page.spec.ts:81-87`), a asserção de `clear` foi removida (`:329` do diff), e `userId` segue capturado no construtor (`home-page.ts:49`).

## Apontamentos novos
Nenhum bloqueador. Não há apontamento novo que impeça o PR.

## Testes executados
- `cmd /c "npx ng test ..."` e `npx` foram bloqueados pelo shell (`permission.rejected`).
- Executado com sucesso em `apps/web`:
  `npm.cmd test -- --watch=false --browsers=ChromeHeadless --no-progress`
  → **TOTAL: 100 SUCCESS**, 0 falhas (Karma/ChromeHeadless; inclui `home-page.spec.ts`, `navbar.component.spec.ts`, `project-modal`, `active-project.service`, `auth`, etc.).

## Conclusão
Os três apontamentos aceitos na rodada 1 estão resolvidos com evidência de código **e** de teste: a Home decide a próxima obra pela lista do servidor após o `DELETE` (cobrindo o fluxo de lista defasada), o caminho sem obras usa `initialize([], userId)` e remove a chave persistida, e a Navbar descarta respostas fora de ordem. CA2 e CA4 estão atendidos nos fluxos provados, CA3/CA8 e os estados de onboarding, neutro e erro de carga não regrediram, e a suíte completa passa (100/100). As ressalvas remanescentes são as dívidas já aceitas na triagem ou consequências inerentes ao fallback explicitamente autorizado.
