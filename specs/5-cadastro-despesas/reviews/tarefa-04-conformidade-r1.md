# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA5 — Salvamento concluído quando o gasto atinge ou ultrapassa 100% de teto positivo | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:68`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:118` |
| CA5 — Alerta visual para revisão do orçamento após salvar | atendido | `apps/web/src/app/features/expenses/expense-detail.component.ts:15`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:153` |
| CA5 — Totais incluem despesas ativas pagas e pendentes, excluindo deletadas | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:75` |
| CA5 — Limite usa estado exato; arredondamento de 99,96% para 100,0% não dispara alerta | atendido | `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:69`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:120` |
| CA4 — Ausência de teto ou teto zerado não dispara alerta de teto atingido | atendido no recorte de regressão desta tarefa | `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:111`; `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:129`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:122` |
| Preservação do sucesso quando a consulta posterior do orçamento falha, sem repetir a criação | atendido | `apps/web/src/app/features/expenses/expense-detail.component.ts:65`; `apps/web/src/app/features/expenses/expense-flow.spec.ts:158` |
| Demais critérios, incluindo comprovantes, troca de obra, idempotência e recuperação de sessão | fora desta tarefa | `specs/5-cadastro-despesas/plan.md:67` |

Diff integral revisado com `git diff da629cf08b1fa3b29b7d7440000a732189e339e2`, limitado aos três arquivos apresentados. O agregado existente da US07 é reutilizado pela consulta individual, sem segundo saldo ou ampliação funcional do escopo.

Verificações independentes executadas:

- API: `.\mvnw.cmd -Dtest=ExpenseRegistrationIntegrationTest test`, com perfil `test` e PostgreSQL `obracerta_us03_conformidade`: **15 testes, zero falhas, zero erros; BUILD SUCCESS**. Flyway validou oito migrations.
- Web: `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/expense-flow.spec.ts`: **15 testes aprovados; exit 0**.

As tentativas iniciais restritas falharam por acesso ao diretório de logs e inicialização do Chrome. Ambas foram repetidas com permissão ampliada e passaram. O teste de integração usa identidade mockada e não constitui nova prova do fluxo JWT. Build e suítes completas não foram executados por este revisor; a evidência independente acima corresponde aos testes direcionados.

## Apontamentos
