# Parecer de Conformidade — Tarefa 4

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — ação habilitada apenas para pendentes, nas versões desktop e mobile, usando o mesmo modal e a data de referência | atendido — implementação e testes examinados estaticamente | `accounts-page.component.ts:196-197, 228-229, 254-256, 372-385`; `accounts-page.component.spec.ts:750-774` |
| CA4/CA6 — reutilização da quitação compartilhada, sem duplicar regras de pagamento | atendido — implementação examinada estaticamente | `accounts-page.component.ts:391-398`; `PaymentSettlementListingIntegrationTest.java:100-104` |
| CA5 — recarga após sucesso preserva filtros, aba e ordenação; atualiza totais e paginação | atendido — implementação e testes examinados estaticamente | `accounts-page.component.ts:410-455`; `accounts-page.component.spec.ts:777-842` |
| CA5 — ajuste de página após saída da última linha, inclusive ao consultar novamente após falha | atendido — implementação e teste examinados estaticamente | `accounts-page.component.ts:405-412, 450-455`; `accounts-page.component.spec.ts:874-903` |
| CA5 — falha na recarga informa a quitação e oferece nova consulta | atendido — implementação e testes examinados estaticamente | `accounts-page.component.ts:391-398, 405-412, 458-462`; `accounts-page.component.spec.ts:844-925` |
| CA5 — recortes Todas/Pendentes/Vencidas/Pagas e totais após quitação persistida | atendido — teste de integração examinado estaticamente | `PaymentSettlementListingIntegrationTest.java:83-122` |
| CA7 — cancelamento e descarte da data não enviada; modal compartilhado | atendido — implementação e testes examinados estaticamente | `accounts-page.component.spec.ts:928-946`; modal compartilhado em `accounts-page.component.ts:254-256` |
| CA8 — recuperação de resultado incerto, sem anúncio prematuro de quitação ou reenvio automático | atendido — integração e testes examinados estaticamente | `accounts-page.component.ts:391-398`; `accounts-page.component.spec.ts:949-999` |
| CA9 — ausência/troca de obra, respostas fora de ordem e sessão expirada | atendido — implementação e testes examinados estaticamente | `accounts-page.component.ts:329-333, 345-368, 417-420`; `accounts-page.component.spec.ts:1001-1088` |
| CA4 — apresentação da data civil sem deslocamento de fuso; utilitário compartilhado por Contas a Pagar e Home, sem `new Date` | atendido — implementação e teste examinados estaticamente | `shared/utils/civil-date.ts:5-7`; `accounts-page.component.ts:15, 401-403`; `home-page.ts:171-173`; `civil-date.spec.ts:3-19` |
| Migration | fora desta tarefa — nenhuma incluída no diff da tarefa | — |

## Apontamentos

1. **Não foi possível confirmar os testes por execução nesta rodada** — `apps/web` e `apps/api`  
   Critérios relacionados: CA3, CA5, CA7, CA8 e CA9; o plano da Tarefa 4 também exige os testes Angular, TypeScript/build e a integração da listagem.  
   Evidência: os comandos indicados para Angular, `tsc`, build e Maven foram todos recusados pelo ambiente com `Permission denied: shell`. A leitura estática não revelou falha de implementação, mas, sem execução, não certifico o resultado dos testes. O relato de GREEN do implementador não substitui a reexecução solicitada.
