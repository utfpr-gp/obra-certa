# Parecer de Conformidade — Tarefa 9

## Veredito
**APROVADO COM RESSALVAS**

Escopo conferido: `git status --porcelain` mostra apenas os 4 arquivos previstos (`home-page.ts`, `home-page.spec.ts`, `navbar.component.ts`, `navbar.component.spec.ts`). Nenhum arquivo de backend, migration, estilo ou store novo. A suíte Angular rodou inteira: `npm.cmd test -- --watch=false --browsers=ChromeHeadless` → **97 de 97 SUCCESS** (o shell bloqueou `npx` e `npm.ps1`; `npm.cmd` passou).

## Critérios cobertos

- **CA4 (recorte da Tarefa 9):** **atendido nos fluxos provados**. Após o `DELETE`, a Home escolhe a remanescente e persiste via `initialize` (`home-page.ts:165-171`); sem sobras, chama `clear()` e cai no onboarding. O teste com duas obras prova, com `ActiveProjectService` real (não mockado) e `localStorage` real, que a remanescente vira ativa, o `h1` mostra o nome dela, o id é gravado na chave `active-project:user-1` e o estado neutro não aparece (`home-page.spec.ts:410-424`). O teste de obra única prova onboarding, `activeProject` nulo e lista vazia (`home-page.spec.ts:426-441`). A metade backend do CA4 (soft delete + inativação de despesas/orçamentos) é das Tarefas 4/5 e não foi re-verificada aqui.
- **CA2:** **atendido**. A Navbar recarrega ao abrir o seletor (`navbar.component.ts:49-55`), substitui a lista (não faz merge) e o teste prova a chamada extra a `getProjects()` e a ausência da obra excluída no DOM renderizado (`navbar.component.spec.ts:108-123`). Seleção/persistência seguem no serviço existente, sem store novo — opção (A) respeitada.
- **CA3:** sem regressão — teste de abertura da edição na Navbar e testes do `ProjectModalComponent` seguem verdes.
- **CA8:** sem regressão — cancelar por botão, `Escape` e fechar mantêm obra e registros (`home-page.spec.ts:443-472`), todos verdes.
- **CA5 (onboarding):** sem regressão nos caminhos testados (zero obras, lista cheia sem ativa, erro de carga, obra ativa com lista local vazia). Ressalva no apontamento 1 para o caminho de lista local defasada.
- **Migration:** nenhuma, conforme o plano.

## Apontamentos

1. **[Média]** A escolha da "próxima obra ativa" é calculada sobre a lista **local** da Home, que o próprio fluxo permite estar defasada — com isso, CA4 ("caso haja outras obras, seleciona automaticamente a próxima obra ativa") e CA5 ("se tiver zero obras") podem ser violados numa sequência alcançável.
   - Evidência: `home-page.ts:165` filtra `this.projects()`, que só é recarregado no construtor (`home-page.ts:106,112`) e no salvamento do modal da própria Home (`home-page.ts:147`). A criação pela Navbar atualiza apenas a lista da Navbar (`navbar.component.ts:89-95`) e a obra ativa (`project-modal.component.ts:63`), sem tocar na lista da Home — premissa já aceita na revisão da Tarefa 8 (`tarefa-08-conformidade-r1.md`, linha 20). O botão de excluir é renderizado sempre que há obra ativa, independentemente de ela estar na lista local (`home-page.html:41,120-127`).
   - Sequência concreta: Home carrega `[A]` → cria `B` pela Navbar (ativa = `B`, lista da Home continua `[A]`) → seleciona `A` na Navbar → exclui `A` na Home. `remaining = [A].filter(id !== A) = []` → `clear()` → onboarding "Vamos começar sua obra", embora `B` exista no servidor. O teste de duas obras não cobre isso porque o `beforeEach` do bloco já injeta as duas obras na lista da Home (`home-page.spec.ts:316-321`).
   - Não é regressão introduzida pelo diff (antes o `clear()` era incondicional), mas a tarefa se propõe a fechar exatamente o "caso haja outras obras" do CA4 e o faz apenas quando a lista local está em dia.

2. **[Baixa]** `clear()` zera o signal mas **não remove** a chave do `localStorage`, então o fluxo de obra única deixa persistido o id da obra recém-excluída.
   - Evidência: `active-project.service.ts:38-40` só faz `activeProject.set(null)`; a remoção da chave existe apenas em `setProject(null, …)` (`active-project.service.ts:50-54`). O teste de obra única verifica `clear()` e o signal, mas **não** verifica a chave (`home-page.spec.ts:426-441`; uma asserção `localStorage.getItem(...) === null` falharia hoje).
   - Impacto observável: **baixo**, porque a próxima chamada de `initialize([])` (construtor da Navbar, `navbar.component.ts:113`) apaga a chave, e uma nova obra sobrescreve o valor. Não encontrei consumidor que leia a chave sem passar por `initialize`, então não há seleção errada alcançável — mas o "estado persistido" fica incoerente entre o `DELETE` e o próximo carregamento, e o critério "limpeza da obra ativa" do plano ficou provado só na metade reativa.

## Testes que faltam ou estão frágeis

- **Falta prova de que a seleção válida não é sobrescrita pelo reload ao abrir o seletor.** O spec da Navbar mocka `ActiveProjectService` com `initialize` no-op e `activeProject` fixo em `projects[0]` (`navbar.component.spec.ts:39-45`) — inclusive deixando "Casa principal" como ativa mesmo depois de sumir da lista, estado que o serviço real não produz. Com isso, o teste novo não detecta se o `initialize` disparado por `toggleDeskDropdown` resetaria a escolha do usuário. O `active-project.service.spec.ts` cobre apenas cache defasado (`:45-53`), não "id em cache válido é preservado".
- **A prova da Navbar é de substituição de lista, não do encadeamento exclusão → reload.** O teste troca o retorno do mock para `[projects[1]]` (`navbar.component.spec.ts:109`); prova que a lista é substituída e re-renderizada, mas não que, após um `DELETE` real, a obra sai da oferta. No nível de teste declarado é aceitável; registre-se que a cadeia ponta a ponta não está coberta.
- **Falta caso com 3+ obras.** Com duas obras qualquer remanescente serve, então o teste não distingue "próxima" (posicional) de "primeira da lista". A implementação usa `initialize`, que cai em `remaining[0]` (`active-project.service.ts:19-21`); com `[A, B, C]` e `B` ativa, o resultado é `A`, não `C`. A spec não define a ordem, mas o comportamento não está nem provado nem documentado.
- **Teste de obra única não prova ausência de chamadas indevidas** (não afirma contagem de `getProjects`/`initialize`) e passaria igual no código anterior — é guarda de regressão legítima, não prova do comportamento novo.
- **Fragilidade menor na Navbar:** `expect(offered).not.toContain('Casa principal')` (`navbar.component.spec.ts:122`) depende de comparação exata de texto de botão; o cabeçalho segue exibindo "Casa principal" concatenado com o tipo. Hoje passa corretamente (o botão da lista é texto puro), mas a asserção é sensível a mudança de markup.

## Conclusão

O núcleo da Tarefa 9 está implementado como o plano pediu: após o `DELETE`, a remanescente vira ativa e é persistida; sem sobras, onboarding; Navbar recarrega ao abrir (opção A), sem store novo; nenhuma migration ou mudança fora de `apps/web`. Os testes novos provam o que afirmam nos fluxos cobertos, usam o serviço real e o `localStorage` real na Home, e a suíte inteira passa.

As ressalvas ficam por conta de (1) a decisão "há outras obras?" apoiar-se numa lista local que o fluxo de cadastro pela Navbar sabidamente deixa defasada, produzindo onboarding falso com obras existentes (CA4/CA5), e (2) o `clear()` não limpar a seleção persistida, sem prova disso no teste de obra única. O apontamento 1 é o que merece triagem do autor; o 2 pode ser aceito como ressalva consciente, desde que registrado.
