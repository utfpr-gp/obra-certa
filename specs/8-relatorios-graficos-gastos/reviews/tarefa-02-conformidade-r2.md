# Parecer de Conformidade — Tarefa 2

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Distribuição real | atendido | `ReportService.java:44-66`; `reports-page.component.ts:27-34` |
| CA5 — Obra alheia/inexistente em 404 JSON | atendido | `ReportService.java:41-42`; `ReportControllerTest.java:51-59` |
| CA6 — Exclusão lógica | atendido | `ExpenseRepository.java:99-112`; `ExpenseRepositoryTest.java:51-72,109-130` |
| Obra válida sem despesas | atendido | `ReportService.java:47-64`; `ReportServiceTest.java:70-94` |
| Loading, erro, retry e respostas atrasadas | parcialmente atendido | `reports-page.component.ts:68-95`; `reports-page.component.spec.ts:35-56` |
| 401 pelo fluxo existente | atendido | `report.service.spec.ts:26-48` |
| Demonstrativo retirado | atendido | `reports-page.component.html:1-91` |
| CA2, PDF e migration | fora desta tarefa | Não considerados conforme despacho |

## Apontamentos

1. **Os testes solicitados não puderam ser executados neste ambiente** — os comandos Maven e npm não estavam disponíveis como ferramenta executável.  
   Critério violado: método do revisor — teste que não roda não confirma critério.  
   Evidência: não há resultado de execução para os comandos solicitados; os logs existentes são de outras execuções/conjuntos de testes.

2. **O retry pode manter dados antigos visíveis durante/após uma falha** — `retry()` limpa o erro, mas não limpa `report` antes da nova requisição.  
   Critério violado: tratamento de erro/retry da integração.  
   Evidência: `apps/web/src/app/features/reports/reports-page.component.ts:88-95`; não há `this.report.set(null)` no fluxo de retry.

3. **A integração real não fornece orçamento por categoria ao frontend** — todas as categorias recebem `plannedCents: 0`. Embora CA2 esteja fora desta tarefa, a própria tela integrada exibe comparativo, saldo e indicadores baseados em valores zerados por categoria.  
   Critério relacionado: consistência da apresentação após a integração.  
   Evidência: `apps/web/src/app/features/reports/reports-page.component.ts:27-29,50-51`; `report.model.ts` não possui orçamento por categoria.
