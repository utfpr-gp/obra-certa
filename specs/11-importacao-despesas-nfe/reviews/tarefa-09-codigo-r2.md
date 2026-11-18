APROVADO

# Parecer de Código — Tarefa 9 (rodada 2)

**Veredito:** APROVADO — os dois bloqueantes da rodada 1 estão resolvidos e não há defeito novo que reprove. Restam sugestões.

**Execução:** o revisor só teve `git diff` liberado; as suítes não foram rodadas por ele. Baseia o parecer na leitura integral do diff e no resultado do orquestrador: **38 SUCCESS** na suíte da tarefa e `npm run build` OK, sem NG8113.

## Verificação dos bloqueantes da rodada 1

### Bloqueante 1 — troca de arquivo durante o envio: RESOLVIDO

- A guarda de `busy()` cobre o `change` do input e a API pública `onFileSelected`, e `send()` também a respeita: `nfe-import-dialog.component.ts:98-100` e `:107-108`. `busy()` é `sending || confirming` (`:71`).
- Input e botão ficam desabilitados: `[disabled]="busy()"` no input (`html:22`) e no "Enviar XML" (`html:31-32`); o X também (`html:12-13`). O input desaparece quando há preview (`html:19`), cobrindo `confirming`.
- O `requestId` é incremental e monotônico (`ts:119`), capturado **antes** da chamada, comparado no `next` (`:122`) e no `error` (`:129`). Resposta de geração antiga sai antes de tocar `preview`, `phase`, `selectedFile` ou `loadCategories` (`:122-126`, `:129-133`).
- O caminho "B rejeitado, confirm envia A" está coberto e é coerente: `spec.ts:513-545` verifica input/submit desabilitados, `selectedFile` ainda em `nota-a.xml`, ausência de segunda requisição de preview e o `FormData` de confirmação levando `nota-a.xml`.
- Sobre "`selectedFile` mudar com `preview` não nulo": não há caminho alcançável pela UI, porque o input só existe em `@if (!preview())` (`html:19`). A invariante hoje depende do template, não da guarda — ver sugestão 1.

### Bloqueante 2 — foco preso/devolução sem teste: RESOLVIDO

- Os testes exercitam `document.activeElement` de verdade e usam `KeyboardEvent('keydown', { key: 'Tab' })` no padrão do modal de pagamento: `spec.ts:583-594`.
- Não são vacuosos: sem o trap, `activeElement` continuaria em `nfe-submit` (Tab) e em `close-nfe-import` (Shift+Tab), e as duas asserções falhariam.
- O foco devolvido é legítimo: o acionador é criado, anexado e focado antes de `createComponent` (`spec.ts:132-136`), e `ngOnDestroy` devolve o foco (`component.ts:93-96`). Sem a implementação, o `activeElement` após `destroy` viraria `body` e o teste de `spec.ts:596-602` falharia.
- `afterEach` limpa o DOM (`fixture.destroy()` + `opener.remove()`, `spec.ts:143-148`). O duplo `destroy` do teste de devolução de foco é inofensivo no TestBed.
- `CommonModule` removido; `imports: [LucideX]` (`component.ts:34`) e o build sem NG8113 confirmam que nada do template dependia dele.

### Correções novas auditadas

- **`phase.set('failure')` como atalho (`spec.ts:561-566`):** aceitável. É explicitamente marcado como white-box e é a única forma de levar o componente a duas requisições concorrentes, já que `busy()` bloqueia o caminho real. O teste continua verificando o comportamento observável (preview da geração antiga descartado, `phase` permanece `sending`, nenhuma chamada de categorias — `:568-580`).
- **Teste de troca de arquivo (`:513-545`):** coerente — B é recusado, A é o arquivo da conferência e da confirmação.
- **Fragilidade temporal:** não há `setTimeout`; só o teste de timeout (`:412-431`) usa `fakeAsync/tick`, que é o mecanismo correto.

## Sugestões (não bloqueiam)

1. **`onFileSelected` não guarda `preview()`** — `component.ts:98-100`. Hoje a invariante "arquivo confirmado = arquivo conferido" depende do `@if (!preview())` em `html:19`. Guardar `preview()` explicitamente tornaria a invariante independente do template.
2. **Shift+Tab pode escapar do diálogo a partir do foco inicial** — `component.ts:243-249`. O container tem `tabindex="-1"` e recebe foco em `ngAfterViewInit`; `dialog.contains(dialog)` é `true`, então Shift+Tab no container não é interceptado. É o mesmo padrão já aceito em `payment-modal.component.ts:102-105`; corrigir os dois juntos evita divergência.
3. **`nfeImportRefreshPending` não é limpo no erro** — `accounts-page.component.ts:502-508`. Depois de uma falha na recarga pós-importação, qualquer falha posterior continua exibindo "Importou, mas a consulta falhou".
4. **`nfeImportNotice` nunca é limpo nas trocas de aba/página** — `accounts-page.component.ts:341,427`; só o efeito de contexto o apaga (`:387`).
5. **Teste de foco prometido como 4 foi entregue como 2 `it`** — `spec.ts:583-594` junta Tab e Shift+Tab; a cobertura existe, só não corresponde à contagem alegada.
6. **Dois `<select>` por item, mobile e desktop** — `html:153` e `:193`, ambos ligados ao mesmo estado; coerente com o padrão cards+tabela, apenas aumenta a superfície de teste (o spec exercita só a cópia mobile via `data-testid="nfe-category-N"`).
7. **Token de sucesso** — o aviso da página usa `bg-teal-50 text-teal-900` (`accounts-page.component.ts:152`), enquanto `docs/design-tokens.md:40` define sucesso como `emerald`. O modal usa `emerald-50/200/900`, alinhado.

## Observações fora do escopo deste diff

- As 28 falhas de `payment-modal.component.spec.ts` são pré-existentes e não foram tocadas por este diff.
- O buraco de Shift+Tab da sugestão 2 também existe no `payment-modal`.
