# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2 — Barras de previsto e realizado na mesma escala; categorias sem orçamento omitidas | atendido | `apps/web/src/app/features/reports/reports-page.component.ts:60`; `apps/web/src/app/features/reports/reports-page.component.html:53`; `apps/web/src/app/features/reports/reports-page.component.spec.ts:86` |
| CA2 — Saldo positivo verde, excedente vermelho e igualdade sem excedente | atendido | `apps/web/src/app/features/reports/reports-page.component.css:2`; `apps/web/src/app/features/reports/reports-page.component.html:80`; `apps/web/src/app/features/reports/reports-page.component.spec.ts:104`; `apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:109` |
| CA4 — Visualização sem movimentação preserva orçamentos e realizado zero, sem percentuais inválidos | atendido | `apps/api/src/main/java/com/obracerta/service/ReportService.java:66`; `apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:141`; `apps/web/src/app/features/reports/reports-page.component.spec.ts:122` |
| CA1 preservado — Despesas sem teto permanecem nos totais e na distribuição, com valores e percentuais | atendido | `apps/web/src/app/features/reports/reports-page.component.ts:38`; `apps/web/src/app/features/reports/reports-page.component.ts:59`; `apps/web/src/app/features/reports/reports-page.component.spec.ts:86`; `apps/web/src/app/features/reports/reports-page.component.spec.ts:143` |
| CA5 preservado — Consulta de obra alheia responde recurso não localizado | atendido | `apps/api/src/main/java/com/obracerta/service/ReportService.java:43`; `apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:65`; `apps/api/src/test/java/com/obracerta/controller/ReportControllerTest.java:53` |
| CA6 preservado — Despesas excluídas não entram na consulta dos gráficos | atendido | `apps/api/src/main/java/com/obracerta/service/ReportService.java:57`; `apps/api/src/test/java/com/obracerta/repository/ExpenseRepositoryTest.java:131` |
| CA7 — Preservação dos quatro indicadores e detalhamento, agora com números reais | atendido | `apps/web/src/app/features/reports/reports-page.component.html:25`; `apps/web/src/app/features/reports/reports-page.component.html:69`; `apps/web/src/app/features/reports/reports-page.component.spec.ts:104` |
| CA3, exportação de CA4 e proteções do PDF | fora desta tarefa | `specs/8-relatorios-graficos-gastos/plan.md`, Tarefa 4 |
| Validação executada independentemente: API com PostgreSQL 16, Flyway e `validate`; frontend com ChromeHeadless | atendido | `ReportServiceTest`, `ReportControllerTest` e `ExpenseRepositoryTest`: 11 testes aprovados; página, serviço HTTP e rotas Angular: 14 testes aprovados. A execução inicial restrita da API teve bloqueio de conexão `Permission denied: getsockopt`; a repetição com permissão ampliada terminou com `BUILD SUCCESS`. |

## Apontamentos
