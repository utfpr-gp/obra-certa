# Parecer de Código — Tarefa 4 (US07) — Rodada 2

**Veredito:** APROVADO

## Escopo verificado

- `budgets-page.component.spec.ts:302-374` e `:397-408` — os três caminhos de escrita (`Adicionar orçamento`, `Editar`, `Definir teto`) mais o cancelamento.
- Contraprova nos arquivos de produção que eles exercitam: `budgets-page.component.ts:91-118` (`openBudgetForm`/`onBudgetSaved`), `budgets-page.component.html:161-179` (rótulos "Editar"/"Definir teto"), `budget-form-modal.component.ts:52-70,86-113` (trava do seletor, `setBudget`, emissão de `saved`), `budget-form-modal.component.html:25-95`, `budget.service.ts:19-28`.

Os testes novos são de comportamento de ponta a ponta do componente: clicam no `data-testid` real, digitam no campo nativo (disparando os value accessors) e verificam o efeito observável — argumentos de `setBudget`, fechamento do modal e recarga. Não há asserção sobre estado interno do componente, nem sobre classes/CSS além do que já existia.

Sobre o ponto específico da rodada 2 (fragilidade, asserção frouxa, acoplamento):

- **Asserção de recarga (`getOverview.calls.count()).toBe(2)`** — é contagem exata, não `toBeGreaterThan`, e ancora no contrato declarado no plano ("recarregando o painel"). Passa a falhar se a recarga sumir e também se houver recarga duplicada (duas chamadas por `load`), o que é o comportamento desejado.
- **Trava da categoria (`:333-336`)** — verifica três sinais independentes (modal aberto, `select.disabled`, `value` da categoria), então não dá falso positivo se apenas um deles regredir.
- **`Definir teto` (`:358-361`)** — verifica `disabled` **false** e categoria pré-selecionada, o que distingue corretamente esse caminho do caminho de edição. Sem essa asserção, os dois testes seriam equivalentes; ela existe.
- **Cancelamento (`:397-408`)** — assere ausência de `setBudget` *e* que não houve recarga (`count === 1`), fechando a brecha do "fechou mas recarregou sem salvar".

Não encontrei teste acoplado a detalhe de implementação que quebre em refatoração legítima, nem tratamento de erro engolido, nem regra duplicada. `budget.service.ts` continua sendo a única porta HTTP e o modal é quem chama `setBudget`, coerente com `docs/architecture.md` §5.1.7.

## Apontamentos (bloqueiam)

Nenhum.

## Sugestões (não bloqueiam)

- **`budgets-page.component.spec.ts:329`, `:355`, `:306`, `:400`** — uso de `query<HTMLButtonElement>(...)!.click()` sem `withContext`. Se o botão sumir por regressão, a falha vira `Cannot read properties of null`, sem indicar qual `data-testid` faltou. O helper `text()` (`:107-111`) já faz a checagem contextual; um helper `click(testId)` equivalente tornaria as falhas autoexplicativas. Puramente ergonomia de diagnóstico.
- **`budgets-page.component.spec.ts:302-374`** — o trio "abre → preenche → submete → assere `setBudget` + `count === 2` + modal fechado" repete-se três vezes. Extrair um helper (`submitBudget(...)`) reduziria a duplicação; hoje são só ~7 linhas por caso e a forma explícita é legível, então não é obrigatório.
- **`budgets-page.component.spec.ts:140-150`** — o mock de `setBudget` devolve sempre `cat-hidraulica`, mesmo no teste de edição de `cat-alvenaria`. Hoje é inofensivo porque `onBudgetSaved()` ignora o argumento do evento e apenas recarrega; se algum dia a página passar a atualizar a linha de forma otimista com o DTO devolvido, o mock mascararia a inconsistência. Um mock que ecoa a categoria recebida seria mais à prova de futuro.
- **`budgets-page.component.spec.ts:322`, `:348`, `:372`** — a recarga é provada por contagem de chamadas, não por conteúdo. Fazer o segundo `getOverview` devolver um `overview` distinto e assertar o KPI atualizado provaria "painel recarregado" de fato, e não só "serviço chamado". Custo baixo, ganho de robustez semântica.

## Observações fora do escopo deste diff

- O shell está bloqueado nesta sessão (`Permission denied: shell`), então não consegui executar `git diff d3486ba`. A revisão foi feita lendo os arquivos completos do working tree listados no escopo acima; conforme o despacho, nenhum arquivo de produção mudou desde a r1 e o delta é o spec apontado. Se o orquestrador quiser o diff literal conferido, é preciso liberar `git` para este agente.
- `budgets-page.component.ts:66-77`: `effect()` chamando `load()` faz requisição dentro de efeito — funciona e já foi aceito na r1, mas segue como candidata a observação de manutenção se a página ganhar mais fontes de estado.
