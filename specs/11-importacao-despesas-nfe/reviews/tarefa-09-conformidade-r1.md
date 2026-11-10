APROVADO

# Parecer de Conformidade — Tarefa 9

**Veredito:** APROVADO

**Execução:** o revisor rodou as suítes. `npm test -- --watch=false --browsers=ChromeHeadless --include="**/nfe-import*.spec.ts"` → **34 SUCCESS** (na rodada 1; após as correções dos bloqueantes de código, 38 SUCCESS). Suíte completa → **507 SUCCESS, 28 FAILED**, e as 28 falhas são todas de `payment-modal.component.spec.ts`, nenhuma das suítes desta tarefa. `npm run build` não foi rodado pelo revisor (o orquestrador rodou: OK).

## Critérios verificados

| Critério | Situação | Onde |
| --- | --- | --- |
| CA4 — confirmar com item sem categoria impede a gravação e indica os itens faltantes | atendido | `nfe-import-dialog.component.ts:71-76,166-172`; `.html:114-119,250-253`; teste `...component.spec.ts:287-300` (botão `disabled`, resumo "Itens sem categoria: 1, 2" e `http.expectNone(importsUrl)` ao forçar `confirm()`) |
| CA5 (front) — envia a categoria escolhida por item, o XML e o checkbox "paga" ao backend | atendido | `nfe-import.service.ts:21-35`; `...component.ts:166-190`; `.html:212-227`; testes `...component.spec.ts:302-345,347-366` (payload `{items:[{itemNumber,categoryId}]}`, `{paid:true/false}`, rótulo "Paga em"/"Pendente, vence em" com a emissão) |
| CA5 (front) — não calcula pagamento/vencimento nem inventa dados de item | atendido | `...component.ts:171-172` só mapeia `itemNumber`+`categoryId` de `note.items`; `issueDate` só é formatada para exibição (`:247-249`); criação de `pending_payments`, `paid_at`/`due_date`, `nfe_key` e comprovante é do backend (não há código de gravação no diff do front) |
| CA10 — clique repetido grava só uma importação | atendido | `...component.ts:166-176`: guarda síncrona `phase() !== 'preview'` + `busy()` antes do POST e `phase.set('confirming')` imediato; teste `...component.spec.ts:368-383` faz dois cliques + terceira chamada e afirma `requests.length === 1` |
| Extra — fechar antes de confirmar não grava nada | atendido | `...component.ts:208-211`; teste `...component.spec.ts:404-412` (`closedCount === 1`, `http.expectNone(importsUrl)`) |
| Extra — conclusão só depois da resposta do servidor | atendido | `...component.ts:176-181` só sai de `confirming` no `next`; `conclude()` em `:196-201`; teste `...component.spec.ts:302-345` afirma `order === []` antes do `flush` e `['imported','closed']` só após "Concluir" |
| Decisão 1 — multipart `file` + `items` Blob JSON + `payment` Blob JSON, timeout 30s, sem retry | atendido | `nfe-import.service.ts:27-34`; testes `nfe-import.service.spec.ts:137-192` (contrato do FormData e timeout/cancelamento em 30s) |
| Decisão 2 — 201 entra em resultado; só "Concluir" emite `imported` e `closed`; X/Escape/backdrop inertes no resultado | atendido | `...component.ts:176-181,196-201,208-215`; `.html:11-16,258-271`; teste `...component.spec.ts:302-345` (X ausente no resultado) |
| Decisão 3 — `(imported)` recarrega preservando filtros, aviso de N linhas, falha de recarga com mensagem própria, fechar sem importar não recarrega | atendido | `accounts-page.component.ts:151-153,269,424-431,483-508`; testes `nfe-import-entry.spec.ts:89-129` (tab/sort preservados, aviso "2 linhas criadas", "Importou, mas a consulta falhou", sem reload ao fechar) |
| Decisão 4 — botão desabilitado + resumo, 400 mantém escolhas | atendido | `.html:250-253`; `...component.spec.ts:287-300,431-447` |
| Decisão 5 — categorias carregadas ao abrir a conferência; falha bloqueia e "Tentar novamente" recarrega só categorias | atendido | `...component.ts:122,136-153`; `.html:102-113`; teste `...component.spec.ts:449-467` (`http.expectNone(url)` no retry) |
| Decisão 6 — "Enviar XML" some quando a conferência abre | atendido | `.html:19-36` (`@if (!preview())`); teste `...component.spec.ts:173` |
| Decisão 7 — checkbox padrão `true`, resetado a cada preview, rótulo com consequência via `formatCivilDate` | atendido | `...component.ts:66,263-274,247-249`; `.html:212-227`; testes `...component.spec.ts:311-312,351-358` |
| Decisão 8 — timeout/rede na confirmação geram erro incerto + "Tentar novamente"; 409 reconcilia | atendido | `...component.ts:182-188,312-321`; `.html:235-245`; testes `...component.spec.ts:414-429,486-506` |
| Decisão 9 — guarda de contexto no `next` e no `error`; troca de obra descarta | atendido | `...component.ts:178,183,282-286`; teste `...component.spec.ts:469-484` |
| Decisão 10 — guarda síncrona por fase, X/Escape/backdrop bloqueados no envio, `aria-busy` | atendido | `...component.ts:166-176,208-215,217-224`; `.html:3,12-13`; teste `...component.spec.ts:368-402` |
| Decisão 11 — escolhas indexadas por `itemNumber` | atendido | `...component.ts:65,155-160,171-172` |
| Decisão 12 — foco preso e devolvido ao acionador | atendido (testes adicionados após o bloqueante do revisor de código) | `...component.ts:92-95,217-245`; `...component.spec.ts:583-602` |

## Apontamentos

Nenhum bloqueante.

## Sugestões

1. **Foco preso/devolvido sem teste** — à época da rodada 1, `nfe-import-dialog.component.ts:92-95,217-245` implementava Tab/Shift+Tab e `opener.focus()` sem caso no spec. **Resolvido na correção dos bloqueantes**: `spec.ts:583-602` cobre Tab, Shift+Tab e devolução ao acionador.
2. **Bloqueio de Escape/backdrop no estado de resultado não é afirmado** — a decisão 2 exige que X/Escape/backdrop não fechem nesse estado. O teste `...component.spec.ts:340` só prova que o X não é renderizado; Escape e backdrop no resultado não são exercitados, embora `close()` os bloqueie em `...component.ts:208-209`.
3. **`nfeImportRefreshPending` não é limpo no caminho de erro** — `accounts-page.component.ts:502-508`: após uma recarga pós-importação falhar, a flag fica `true`; uma falha posterior de uma consulta não relacionada reutilizaria a mensagem "Importou, mas a consulta falhou".
4. **Fechamento bloqueado também durante o preview** — `busy` inclui `sending` (`...component.ts:70`), então X/Escape/backdrop ficam inertes enquanto o XML é lido, além do bloqueio pedido pela decisão 10. Não viola a spec (o preview não grava), mas é comportamento a mais em relação ao plano.
