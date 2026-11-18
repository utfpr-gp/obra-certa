# Parecer de Conformidade — Tarefa 4

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — Geração síncrona de PDF único com identificação, totais, pago/a pagar, saldos, categorias, despesas individuais e data | atendido | apps/api/src/main/java/com/obracerta/service/ReportPdfService.java:26; apps/api/src/test/java/com/obracerta/service/ReportPdfServiceTest.java:17 |
| CA3 — Download com nome contendo obra e data | não atendido | apps/web/src/app/features/reports/reports-page.component.ts:150 |
| CA3 — Falha apresenta apenas erro, sem tentativa automática ou botão específico | atendido | apps/web/src/app/features/reports/reports-page.component.ts:161; apps/web/src/app/features/reports/reports-page.component.spec.ts:109 |
| CA4 — Permitir exportação de obra sem despesas | atendido | apps/api/src/test/java/com/obracerta/service/ReportPdfServiceTest.java:32; apps/web/src/app/features/reports/reports-page.component.ts:140 |
| CA5 — PDF de obra alheia retorna recurso não localizado | atendido | apps/api/src/main/java/com/obracerta/service/ReportService.java:45; apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:43; apps/api/src/test/java/com/obracerta/controller/ReportControllerTest.java:47 |
| CA6 — PDF utiliza consolidação e despesas individuais ativas | atendido | apps/api/src/main/java/com/obracerta/service/ReportService.java:45; apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:61 |
| Abandono — Trocar obra ou sair descarta exportação; retornar não exporta automaticamente | atendido | apps/web/src/app/features/reports/reports-page.component.ts:131; apps/web/src/app/features/reports/reports-page.component.spec.ts:119 |
| CA1 e CA2; CA7–CA10 do protótipo | fora desta tarefa | specs/8-relatorios-graficos-gastos/plan.md:50 |
| Validação executada independentemente: 18 testes API e 20 testes frontend, todos aprovados | atendido | ReportPdfServiceTest, ReportServiceTest, ReportControllerTest, ExpenseRepositoryTest; reports-page.component.spec.ts, report.service.spec.ts, app.routes.spec.ts |

## Apontamentos

1. **O download perde o nome da obra e a data no ambiente de desenvolvimento** — `apps/web/src/app/features/reports/reports-page.component.ts:150`
   
   Critério violado: `specs/8-relatorios-graficos-gastos/spec.md:20` exige `relatorio-{nome-da-obra}-{data}.pdf`.
   
   Evidência: o Angular obtém o nome de `Content-Disposition` e, quando o cabeçalho está indisponível, utiliza `relatorio-obra.pdf`. O desenvolvimento usa API em `http://localhost:8080/obracerta` (`apps/web/src/environments/environment.development.ts:3`), enquanto o frontend está em outra origem. A configuração CORS permite essa origem, mas não expõe `Content-Disposition` (`apps/api/src/main/java/com/obracerta/configuration/security/SecurityConfigurations.java:58`). Assim, o navegador impede a leitura do cabeçalho e o download recebe o nome fixo. Os testes atuais injetam o cabeçalho pelo `HttpTestingController`, sem exercer a restrição CORS nem verificar `anchor.download`.
