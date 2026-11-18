# Parecer de Conformidade — Tarefa 8

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA12 — Datas opcionais e orçamento integral no recorte temporal | atendido na camada de serviço | `apps/api/src/main/java/com/obracerta/service/ReportService.java:91`; `apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:203` |
| CA12 — Intervalo inválido bloqueado com mensagem única, preservando os dados exibidos | atendido | `apps/web/src/app/features/reports/reports-page.component.ts:68`; `apps/api/src/test/java/com/obracerta/controller/ReportControllerTest.java:90` |
| CA12 — Estado digitado separado do aplicado; Filtrar, Limpar e restauração ao trocar de obra | atendido | `apps/web/src/app/features/reports/reports-page.component.ts:39`; `apps/web/src/app/features/reports/reports-page.component.spec.ts:179` |
| CA1 e CA2 — Indicadores, distribuição, comparativo, resumo e detalhamento acompanham o recorte | atendido no código e nos testes de apresentação | `apps/web/src/app/features/reports/report-presentation.model.ts:23`; `apps/web/src/app/features/reports/reports-page.component.spec.ts:179` |
| CA4 — Sem despesas, manter orçamento e permitir exportação | atendido nos testes disponíveis | `apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:181`; `apps/web/src/app/features/reports/report-visual-export.service.spec.ts:106` |
| CA5 — Validar posse antes das consultas financeiras | atendido na camada de serviço | `apps/api/src/main/java/com/obracerta/service/ReportService.java:95`; `apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:290` |
| CA6 e CA12 — Exclusão lógica, posse e limites inclusivos nas consultas reais | não atendido quanto à comprovação por execução; implementação e teste presentes | `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:92`; `apps/api/src/test/java/com/obracerta/repository/ExpenseRepositoryTest.java:160` |
| CA11 — Snapshot e cabeçalho refletem período, categoria, pago e a pagar | atendido nos testes disponíveis | `apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:242`; `apps/web/src/app/features/reports/report-presentation.component.html:3` |
| CA11 — Rótulos correspondem à categoria exportada, inclusive sem movimentação ou orçamento; sem filtro, permanecem globais | atendido; apontamento da rodada 1 corrigido | `apps/web/src/app/features/reports/report-presentation.model.ts:11`; `apps/web/src/app/features/reports/report-presentation.component.html:6`; `apps/web/src/app/features/reports/report-presentation.component.html:69`; `apps/web/src/app/features/reports/report-visual-export.service.spec.ts:87` |
| CA11 e abandono — Erro único, prevenção de duplicidade e descarte por obra, filtro ou saída | atendido no código e nos testes disponíveis | `apps/web/src/app/features/reports/reports-page.component.ts:84`; `apps/web/src/app/features/reports/reports-page.component.spec.ts:264` |
| Contrato legado `/reports/pdf` preservado | atendido | `apps/api/src/main/java/com/obracerta/service/ReportService.java:58`; `apps/api/src/test/java/com/obracerta/controller/ReportControllerTest.java:121` |
| Validação visual desktop/360px e inspeção de PDF com e sem filtro | não atendido; validação pendente | `specs/8-relatorios-graficos-gastos/plan.md:90`; `specs/8-relatorios-graficos-gastos/reviews/tarefa-08-validacao-r2.md:14` |
| CA7–CA10 — Etapa demonstrativa anterior | fora desta tarefa | `specs/8-relatorios-graficos-gastos/spec.md:24` |

Li integralmente o diff do escopo solicitado, a proposta aprovada, os pareceres e decisões da primeira rodada e os registros de validação das duas rodadas. A correção usa o metadado autorizado da categoria apenas para identificar os dois rótulos; preserva os valores do snapshot e as legendas globais quando não há seleção.

Minha tentativa de executar a suíte frontend compilou, mas o ChromeHeadless não iniciou: saída 1, sem execução dos testes. Conferi diretamente `apps/web/task8-r2-web-green.log`, que registra **41 testes aprovados** na execução do orquestrador, e `apps/web/task8-r2-build.log`, com build concluído. Os **26 testes Java aprovados** são evidência comunicada pelo orquestrador e registrada na primeira rodada; não os reexecutei, pois o backend não mudou nesta correção.

A integração PostgreSQL e a inspeção visual permanecem pendentes pelas restrições registradas. A aprovação refere-se à conformidade do código revisado e à resolução do apontamento aceito; não atesta essas verificações nem validação completa da tarefa. Nenhum arquivo foi alterado ou gravado.

## Apontamentos
