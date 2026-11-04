# Parecer de Conformidade — Tarefa 4

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — ação “Marcar como Pago” só aparece em pendentes, em desktop e mobile | atendido | `accounts-page.component.ts:196`, `:228` (dentro de `@if (!expense.paid)`); `accounts-page.component.spec.ts:750-776` (1 botão na tabela e 1 nos cards, `disabled` falso) |
| CA3 — mesmo modal compartilhado nas duas telas | atendido | `accounts-page.component.ts:252-255` renderiza `app-payment-modal`; `PaymentModalComponent` (tarefa 3) sem fork; `spec.ts:750-776` |
| CA3 — data inicial = hoje da consulta (limitada à data da despesa), editável, mínimo = data da despesa | atendido | `accounts-page.component.ts:376-381` (`referenceDate` da listagem, fallback `purchaseDate`), `:434`; `spec.ts:767-769` (valor `2026-11-04`, `min=2026-10-21`) |
| CA4/CA6 — reutiliza a API/modal da Home, sem duplicar regra de pagamento | atendido | `accounts-page.component.ts:387-394` só reage ao `(settled)`; nenhuma chamada de quitação na listagem; PUT/pay/reconciliação continuam em `PaymentService`/modal |
| CA5 — fecha modal e recarrega pela API após sucesso | atendido | `accounts-page.component.ts:391-393`; `spec.ts:777-818` (PUT e GET de recarga) |
| CA5 — preserva aba, filtros e ordenação na recarga | atendido | `loadPage` reusa `tab()/filters()/sort()` (`:426`); `spec.ts:795-805` (recarga com `tab=PENDING`, `sort=AMOUNT_DESC`, `purchaseDateFrom`) |
| CA5 — totais e paginação atualizados | atendido | `accounts-page.component.ts:429-434`; `spec.ts:811-816` |
| CA5 — recortes persistidos produzidos pela quitação (Todas/Pendentes/Vencidas/Pagas) | atendido | `PaymentSettlementListingIntegrationTest.java:91-133` (antes/depois com `totalElements` e totais por aba) |
| CA5 — ajusta para página existente quando a última linha sai | **não atendido** | `accounts-page.component.ts:438-441` só ajusta com `afterSettlement=true`, que não é propagado no botão de nova consulta (`:152`) — ver apontamento 1 |
| CA5 — falha ao recarregar informa a quitação e oferece nova consulta | atendido | `accounts-page.component.ts:149-153`; `spec.ts:844-873` |
| CA7 — cancelar/X/Escape sem gravar, reabrir descarta data, backdrop inerte, bloqueio durante envio | atendido (via modal compartilhado da tarefa 3); cancelamento/Escape exercitados na listagem | `spec.ts:874-894`; `payment-modal.component.ts:92-107` e `payment-modal.component.html:1` |
| CA8 — falha no envio não anuncia quitação, mantém contexto e oferece consulta de estado; pendente libera retry | atendido | `spec.ts:895-946` |
| CA8 — erro de consulta reflete a falha real | **não atendido** | `accounts-page.component.ts:151-152` — ver apontamento 2 |
| CA8 — nenhum carregamento indefinido após erro | atendido | `accounts-page.component.ts:443-447`; `spec.ts:866-868` |
| CA9 — sem obra selecionada não consulta nem permite quitação | atendido | `spec.ts:947-964` |
| CA9 — troca de obra (inclusive A → B → A) invalida modal e ignora resposta anterior | atendido | `accounts-page.component.ts:327-331`, `:344-366`; `spec.ts:965-995` |
| CA9 — respostas fora de ordem não sobrescrevem a aba atual | atendido | `accounts-page.component.ts:403-406`; `spec.ts:996-1017` |
| CA9 — 401 mantém logout existente e não anuncia quitação | atendido | `spec.ts:1018-1035` |
| Migration: nenhuma | atendido | diff sem `db/migration` |

> **Limitação de verificação:** nesta sessão o harness negou execução de `npx.cmd`, `npm.cmd`, `.\mvnw.cmd` e até `node --version` (`permission.rejected`), restando liberado apenas o comando de `git diff`/`git status` do despacho. **Não consegui reexecutar nenhum teste** — nem o spec Angular, nem `tsc`, nem o `PaymentSettlementListingIntegrationTest`. O parecer acima se apoia na leitura integral do diff, no contrato real da API (`ExpenseService.list`, `ExpensePageResponseDTO`, `ExpenseResponseDTO`) e nos resultados relatados pelo implementador; a reexecução (32 specs, `tsc`/build 0, `Tests run: 1`/`27`) continua pendente de confirmação em ambiente com shell liberado.

## Apontamentos

1. **A nova consulta oferecida após falha de recarga não repete o ajuste de página** — `apps/web/src/app/features/expenses/accounts-page.component.ts:152`
   Critério violado: CA5 — “Se a última linha sair da página, ajusta a página para uma existente.”
   Evidência: o ajuste existe apenas em `loadPage(..., afterSettlement = true)` (`:436-441`), e o único chamador com `true` é `onPaymentSettled` (`:393`). O botão do estado de erro chama `loadPage(page())` sem o terceiro argumento. Cenário concreto: página 1 (última) com uma linha → quitação → recarga falha (503) → “Consultar novamente” → resposta com `page: 1`, `totalPages: 1`, `content: []` → a tela fica em `page() === 1` com lista vazia, sem cair para a página 0, que é exatamente a situação que o CA5 manda corrigir. O teste `spec.ts:844-873` só verifica a recarga com erro seguida de sucesso na **mesma** página, sem linha removida, então não cobre esse caminho.

2. **Qualquer falha de consulta posterior passa a ser anunciada como falha da atualização pós-quitação** — `apps/web/src/app/features/expenses/accounts-page.component.ts:151-152`
   Critério violado: CA5 — “Falha ao recarregar após quitação confirmada informa que a quitação ocorreu, mas a atualização da consulta falhou, e oferece nova consulta”; CA8 — “Dada falha na consulta, então mostra erro distinto de lista vazia”.
   Evidência: o texto exibido é escolhido por `settlement() ? 'A quitação ocorreu, mas a atualização da consulta falhou…' : error()`, e `settlement` só volta a `null` na troca de obra (`:360`). Depois de uma quitação bem-sucedida e uma recarga bem-sucedida, o sinal permanece preenchido: uma falha de rede ao trocar de aba, aplicar filtro ou paginar minutos depois exibe “A quitação ocorreu, mas a atualização da consulta falhou”, atribuindo à quitação uma falha que não é dela e contradizendo o aviso de “Pagamento confirmado” mostrado no topo. Não há teste que exercite uma falha de consulta posterior a uma recarga bem-sucedida (`spec.ts:844-873` falha a recarga imediatamente após o PUT).
