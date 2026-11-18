# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA4: aviso inline para categoria sem orçamento ativo ou com teto zerado (`spec.md:21`) | atendido | `apps/web/src/app/features/expenses/expense-form.component.ts:51`; `expense-form.component.html:28`; `expense-budget.spec.ts:42` |
| CA4: aviso não bloqueia o lançamento nem exige teto positivo | atendido | `expense-budget.spec.ts:47` verifica POST sem PUT de orçamento; `apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:67` e `:78` comprovam criação, ausência de teto artificial e preservação do teto zero |
| CA4: atalho para definir orçamento da categoria selecionada | atendido | `expense-form.component.ts:92`; `expense-form.component.html:112`; `expense-budget.spec.ts:66` verifica categoria e requisição ao orçamento correto |
| Preservar campos ao abrir, fechar e salvar o modal, conforme `plan.md:57` | atendido | `expense-budget.spec.ts:60` compara todos os campos e preserva fornecedor inline |
| Demais critérios e casos de abandono atribuídos às outras tarefas | fora desta tarefa | `specs/5-cadastro-despesas/plan.md:61` |

Diff integral conferido com `git diff 34453a6722687ca190adeb476972c3d94bf07539`.

Testes executados independentemente:

- API: `.\mvnw.cmd -Dtest=ExpenseRegistrationIntegrationTest test`, perfil `test`, PostgreSQL `obracerta_us03_conformidade`: **12 testes, zero falhas ou erros**. Flyway validou oito migrations.
- Web: `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/expense-budget.spec.ts --include=src/app/features/expenses/expense-flow.spec.ts --include=src/app/features/expenses/accounts-navigation.spec.ts`: **15 testes aprovados**.

As execuções finais passaram com `require_escalated`, após limitações do sandbox. A integração de API usa identidade mockada; não constitui nova prova de autenticação JWT.

## Apontamentos
