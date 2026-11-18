REPROVADO

# Parecer de Código — Tarefa 9 (rodada 1)

**Veredito:** REPROVADO — 2 bloqueantes.

**Sobre execução:** o revisor não rodou nada (shell negado nesta sessão). Revisão estática sobre os arquivos do diff. Assumiu os 34 SUCCESS e as 28 falhas pré-existentes de `payment-modal.component.spec.ts` como informados pelo orquestrador.

## Apontamentos (bloqueiam)

1. **A troca de arquivo durante o envio não é bloqueada nem invalidada — a conferência pode exibir a NF-e A enquanto a confirmação envia o arquivo B.**
   `nfe-import-dialog.component.ts:97-103` (`onFileSelected` não consulta `busy()` e força `phase.set('idle')`), `:105-106` (só `send()` tem a guarda de `busy()`), `:117-123` (o `next` só compara `projectId`, não uma geração do pedido), `nfe-import-dialog.component.html:19-36` (o `<input type="file">` continua habilitado porque `preview()` é `null` durante `sending`).
   Regra violada: `docs/architecture.md` §5.1.8/§5.1.11 — respostas antigas devem ser descartadas por versão/geração, não apenas por obra; e a decisão registrada da tarefa (`plan.md`, item 5: "para trocar de arquivo, fecha e reabre o diálogo").
   Prejuízo: em conexão lenta, o usuário escolhe B enquanto A sobe; `phase` volta a `idle`, o botão reabilita e um segundo POST de preview sai. Se a resposta de A chegar depois, `preview` exibe A, mas `confirm()` usa `selectedFile()` = B. O backend reprocessa B e casa categoria por `itemNumber`: numerações coincidentes gravam categorias nos produtos errados; caso contrário, 400 incompreensível. É o mesmo defeito de "resposta antiga" que o resto do repo resolve com geração (`accounts-page.component.ts:460-463`).

2. **Foco preso e devolução ao acionador foram implementados sem nenhum teste — comportamento está no escopo desta tarefa.**
   `nfe-import-dialog.component.ts:88-95` (foco inicial/devolução) e `:217-245` (Tab/Shift+Tab); `nfe-import-dialog.component.spec.ts` não tem caso de `activeElement`/`Tab`.
   Regra violada: `.agents/rules/utf-rules.md` §4 (TDD) e a decisão registrada da tarefa (`plan.md`, item 8: foco preso e devolução entram nesta tarefa, como no `payment-modal`). O precedente existe e é testado em `payment-modal.component.spec.ts:124-132`.
   Prejuízo: a implementação está correta hoje, mas qualquer refatoração do seletor de nós focáveis (`:228-230`) quebra a contenção de teclado sem ninguém perceber.

## Sugestões (não bloqueiam)

- **Import não usado:** `CommonModule` em `nfe-import-dialog.component.ts:1,35` — template só usa control flow nativo. Código morto.
- **404/outros erros do preview perdem o motivo:** `nfe-import-dialog.component.ts:307` devolve mensagem genérica de conexão para status diferente de 400/409, inclusive 404.
- **`send()` pode ficar preso em `sending`:** `:119` — se o backend devolver `projectId` diferente, o `next` retorna sem mensagem, sem reset de fase e sem retry.
- **Aviso de importação não é descartado:** `accounts-page.component.ts:341,424-431`; `nfeImportNotice` sobrevive a troca de aba/filtro/página.
- **Mensagens de erro concorrentes:** `accounts-page.component.ts:162` dá precedência a `settlementRefreshPending()`.
- **`aria-describedby` pendurado:** `nfe-import-dialog.component.html:156,196` apontam para `nfe-missing-categories`, ausente quando `categoriesError()` é verdadeiro (`:114`).
- **Erro do arquivo sem vínculo:** `html:22-26` — `nfe-file-error` tem `role="alert"` mas o input não recebe `aria-invalid`/`aria-describedby`.
- **Backdrop fecha a conferência:** `component.ts:213-215` e `html:1`.
- **Cobertura de ramos novos:** 401 na confirmação (`component.ts:185`), fechamento bloqueado no estado `result` (`:209`) e 5xx na confirmação não têm teste.
- **Formatação duplicada:** `money()`/`quantity()` (`component.ts:251-257`) repetem `Intl.NumberFormat` como no resto do repo — candidato a utilitário único.

## O que está certo

Service sem `retry`, sem tratar 401 e sem converter erro em sucesso (`nfe-import.service.ts:12-35`); FormData de três partes com `items`/`payment` como Blob `application/json` e `{"items":[...]}`, `file` reutilizado (`:27-30`); `timeout(30000)` no service. Diálogo com guarda síncrona de duplo clique, guarda de contexto no `next` e no `error`, estado por `itemNumber`, validação e resumo de categorias, retry separado de categorias, bloqueio de fechamento no envio e no resultado, resultado com Concluir emitindo `imported`+`closed`, `takeUntilDestroyed` em todas as assinaturas. `accounts-page` recarrega só em `imported` e preserva aba/ordem. Tokens, `min-h-11`, cartão/tabela por breakpoint, `data-testid`, `label for` único, `aria-invalid`/`aria-describedby`/`role=status`/`aria-busy` conferem com `docs/design-tokens.md`. Nenhum acesso a `HttpClient` fora de `core/services` e nenhum `any`.

## Execução do orquestrador

Após as correções dos dois bloqueantes: 38 SUCCESS na suíte da tarefa, `npm run build` OK (sem NG8113). Rodada 2: **APROVADO**.
