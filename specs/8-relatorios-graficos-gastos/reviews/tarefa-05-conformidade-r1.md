# Parecer de Conformidade — Tarefa 5

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Distribuição real | atendido | `ReportService.java:41-66`; `reports-page.component.ts:27-34` |
| CA5 — Obra alheia/inexistente não localizada em JSON | atendido | `ReportService.java:41-42`; `GlobalExceptionHandler.java:56-66`; `ReportControllerTest.java:51-59` |
| CA6 — Exclusão lógica | atendido | `ExpenseRepository.java:99-112,123-136`; `ExpenseRepositoryTest.java:51-130` |
| Obra válida sem despesas | atendido | `ReportServiceTest.java:75-96`; `reports-page.component.html:1-5` |
| Retry sem dados antigos | atendido | `reports-page.component.ts:93-108`; `reports-page.component.spec.ts:35-56` |
| Respostas atrasadas | atendido | `reports-page.component.ts:68-91`; `reports-page.component.spec.ts:58-68` |
| Orçamento por categoria no contrato | atendido | `ReportCategoryDTO.java:5-10`; `ReportService.java:44-64`; `report.model.ts:1-7` |
| Moeda sem fragilidade de espaço | atendido | `reports-page.component.ts:110-112`; `reports-page.component.spec.ts:58-60` |
| 401 pelo interceptor | atendido | `report.service.spec.ts:22-48` |
| CA2 completo, CA3/PDF e migration | fora desta tarefa | Conforme `plan.md:57-65` |

## Apontamentos

### Bloqueantes

1. **Os comandos obrigatórios não puderam ser executados nesta revisão** — os logs disponíveis não comprovam os comandos pedidos.

### Sugestões

1. O perfil de teste desabilita o Flyway, validando apenas o schema criado pelo Hibernate/H2, não o bootstrap H2 com migrations (`apps/api/src/test/resources/application-test.properties:12`). Isso pode ser aceitável como workaround para DDL PostgreSQL incompatível com H2, mas reduz a cobertura.
