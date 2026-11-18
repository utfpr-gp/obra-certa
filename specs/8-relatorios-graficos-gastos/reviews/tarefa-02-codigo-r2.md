# Parecer de Código — Tarefa 2

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Comparativo por categoria perdeu os valores planejados**
   - Arquivos: `apps/api/src/main/java/com/obracerta/service/ReportService.java:44-64`; `apps/web/src/app/features/reports/reports-page.component.ts:27-51`
   - Severidade: High
   - A API retorna apenas categorias com despesas e não inclui o orçamento por categoria. No frontend, `plannedCents` é fixado em `0`, `exceeded` sempre em `false` e `consumption` sempre em `0`. O gráfico comparativo, saldos e estados ficam incorretos; categorias orçadas sem despesas também desaparecem.

2. **Teste frontend direcionado continua falhando**
   - Arquivo: `apps/web/src/app/features/reports/reports-page.component.spec.ts:31`
   - Severidade: Medium
   - A asserção procura `R$ 100,00`, mas `Intl.NumberFormat` produz espaço não separável (`R$ 100,00`).

3. **Testes backend ainda não são executáveis no ambiente informado**
   - O comando falha durante o bootstrap do Flyway, antes dos testes, porque o H2 rejeita o índice parcial em `V2__create_projects_and_project_fk.sql` (`CREATE INDEX ... WHERE deleted_at IS NULL`).

## Sugestões

Nenhuma sugestão adicional separada dos bloqueios acima.
