# Parecer de Conformidade — Tarefa 8

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA12 — Datas opcionais, recorte do realizado e orçamento integral | atendido na camada de serviço; comprovação das consultas pendente | `apps/api/src/main/java/com/obracerta/service/ReportService.java:91`; `apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:203` |
| CA12 — Intervalo inválido bloqueado, mensagem única e preservação dos dados exibidos | atendido | `apps/web/src/app/features/reports/reports-page.component.ts:68`; `apps/api/src/test/java/com/obracerta/controller/ReportControllerTest.java:90` |
| CA12 — Digitado separado do aplicado; Filtrar, Limpar e restauração ao trocar de obra | atendido | `apps/web/src/app/features/reports/reports-page.component.ts:39`; `apps/web/src/app/features/reports/reports-page.component.ts:68` |
| CA1 e CA2 — Distribuição, comparativo, resumo e detalhamento derivados da resposta recortada | atendido no código e nos testes de apresentação | `apps/web/src/app/features/reports/report-presentation.model.ts:23`; `apps/web/src/app/features/reports/reports-page.component.spec.ts:179` |
| CA4 — Orçamentos preservados e realizado zerado sem despesas | atendido na camada de serviço | `apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:181` |
| CA5 — Posse antes das consultas financeiras | atendido na camada de serviço | `apps/api/src/main/java/com/obracerta/service/ReportService.java:95`; `apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:290` |
| CA6 e CA12 — Exclusão lógica, posse e limites inclusivos nas consultas reais | não atendido quanto à comprovação por execução; predicados e teste presentes | `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:92`; `apps/api/src/test/java/com/obracerta/repository/ExpenseRepositoryTest.java:160` |
| CA11 — Snapshot com período, categoria, valores pago/a pagar e cabeçalho correspondente | atendido | `apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:242`; `apps/web/src/app/features/reports/report-presentation.component.html:3` |
| CA11 — Composição exportada identifica corretamente os totais da categoria aplicada | não atendido | `apps/web/src/app/features/reports/report-visual-export.service.ts:50`; `apps/web/src/app/features/reports/report-presentation.component.html:6`; `apps/web/src/app/features/reports/report-presentation.component.html:69` |
| CA11 e abandono — Erro único, prevenção de exportação duplicada e descarte por obra, filtro ou saída | atendido no código e nos testes automatizados disponíveis | `apps/web/src/app/features/reports/reports-page.component.ts:38`; `apps/web/src/app/features/reports/reports-page.component.ts:84`; `apps/web/src/app/features/reports/reports-page.component.ts:95` |
| Contrato legado `/reports/pdf` preservado | atendido | `apps/api/src/main/java/com/obracerta/service/ReportService.java:58`; `apps/api/src/test/java/com/obracerta/controller/ReportControllerTest.java:121` |
| Validação visual desktop/360px e inspeção dos PDFs com e sem filtro | não atendido; validação pendente | `specs/8-relatorios-graficos-gastos/plan.md:90`; `specs/8-relatorios-graficos-gastos/reviews/tarefa-08-validacao-r1.md:31` |
| CA7–CA10 — Etapa demonstrativa anterior | fora desta tarefa | `specs/8-relatorios-graficos-gastos/spec.md:24` |

Reexecutei os testes Maven solicitados: **26 passaram, zero falhas, `BUILD SUCCESS`**. Houve mensagem de acesso negado do appender de logs, sem impedir a execução.

O orquestrador confirmou a execução atualizada e isolada do serviço de exportação: **10 passaram e 1 falhou**, conforme `apps/web/task8-web-export-review-r1.log`. A falha corresponde ao apontamento abaixo.

O teste de repositório não foi executado por ausência de PostgreSQL autorizado. A inspeção visual e dos PDFs também permanece pendente. Essas limitações impedem afirmar validação completa da tarefa; não constituem evidência de defeito adicional.

## Apontamentos

1. **PDF filtrado por categoria apresenta os totais como globais** — `apps/web/src/app/features/reports/report-visual-export.service.ts:50`  
   Critério violado: `specs/8-relatorios-graficos-gastos/spec.md:28` — exportar a categoria aplicada na tela, reutilizando a apresentação correspondente.  
   Evidência: o modelo isolado recebe `exportCategoryName`, mas mantém `selectedCategory` no valor inicial `all`. As legendas em `report-presentation.component.html:6` e `:69` dependem desse último estado. Assim, o cabeçalho identifica a categoria, mas os valores recortados aparecem como “Orçamento global” e “Total global da obra”. O teste atualizado em `report-visual-export.service.spec.ts:83` falhou nas asserções das linhas 97 e 98, que esperavam “Orçamento selecionado” e “Total da categoria”.
