# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — PDF único e síncrono com identificação, totais, pago/a pagar, saldos, categorias, despesas individuais e data | atendido | apps/api/src/main/java/com/obracerta/service/ReportPdfService.java:26; apps/api/src/test/java/com/obracerta/service/ReportPdfServiceTest.java:17 |
| CA3 — Nome seguro contendo obra e data, disponível ao navegador em CORS | atendido | apps/api/src/main/java/com/obracerta/configuration/security/SecurityConfigurations.java:62; apps/api/src/test/java/com/obracerta/controller/ReportPdfHttpTest.java:75; apps/web/src/app/features/reports/reports-page.component.spec.ts:86 |
| CA3 — Falha apresenta somente mensagem de erro, sem retry automático ou ação específica | atendido | apps/web/src/app/features/reports/reports-page.component.ts:164; apps/web/src/app/features/reports/reports-page.component.spec.ts:115 |
| Correção aceita — Falha conhecida do gerador retorna ApiErrorResponse com HTTP 500 e preserva autenticação | atendido | apps/api/src/main/java/com/obracerta/exception/GlobalExceptionHandler.java:17; apps/api/src/test/java/com/obracerta/controller/ReportPdfHttpTest.java:49; apps/web/src/app/core/services/report.service.spec.ts:37 |
| CA4 — Exportação de obra sem despesas | atendido | apps/api/src/test/java/com/obracerta/service/ReportPdfServiceTest.java:33; apps/web/src/app/features/reports/reports-page.component.ts:139 |
| CA5 — Obra alheia retorna recurso não localizado antes de consultar despesas ou gerar PDF | atendido | apps/api/src/main/java/com/obracerta/service/ReportService.java:45; apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:43; apps/api/src/test/java/com/obracerta/controller/ReportControllerTest.java:47 |
| CA6 — Consolidação e detalhamento consideram somente despesas ativas da obra autorizada | atendido | apps/api/src/main/java/com/obracerta/service/ReportService.java:45; apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:59 |
| Abandono — Trocar obra ou sair descarta resposta pendente; retornar não exporta automaticamente | atendido | apps/web/src/app/features/reports/reports-page.component.ts:131; apps/web/src/app/features/reports/reports-page.component.spec.ts:125 |
| Download como Blob, prevenção de duplicidade, indicação de geração e liberação da URL temporária | atendido | apps/web/src/app/core/services/report.service.ts:16; apps/web/src/app/features/reports/reports-page.component.ts:139; apps/web/src/app/features/reports/reports-page.component.spec.ts:86 |
| CA1 e CA2; CA7–CA10 referentes ao protótipo | fora desta tarefa | specs/8-relatorios-graficos-gastos/plan.md:50 |

A execução própria passou nos 16 testes de controlador, HTTP e serviços, incluindo geração real de PDF e tratamento de falha. Os quatro testes de repositório foram impedidos pelo bloqueio de conexão do sandbox; o ChromeHeadless também não iniciou. A tentativa anterior com permissão ampliada foi abortada sem resultado. Não contabilizo essas tentativas como aprovação integral.

Conferi os logs da execução ampliada do orquestrador: **20 testes de API e 21 testes web aprovados** em `apps/api/target/task4-r2-integration.log` e `apps/web/tarefa4-r2-web.log`. O build aprovado na rodada 1 permanece aplicável, pois a rodada 2 não alterou produção Angular/CSS.

Conforme evidência comunicada pelo orquestrador, após atualizar o Maven e reiniciar a API, o teste real do autor baixou `relatorio-teste-2026-11-03.pdf`; a inspeção confirmou consolidado, despesas e valores. A sessão permaneceu em `/relatorios` após novo clique. O logout anterior foi associado ao processo da IDE sem PDFBox no classpath, resolvido pelo reinício. A captura automática do evento de download não concluiu; a evidência real é o arquivo baixado pelo autor.

As alterações preexistentes em `docs/architecture.md`, `docs/prd.md` e na auditoria da Issue 9 foram excluídas do julgamento conforme despacho. Nenhum arquivo foi alterado ou parecer salvo por este revisor.

## Apontamentos
