# Decisões — Tarefa 1, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Execução dos testes não comprovada (shell negado ao revisor) | conformidade | aceito | Testes executados pelo autor: `NfeKeyGuardTest` (4/4) e `ExpenseServiceDeleteNfeTest` (1/1), `BUILD SUCCESS`. Item resolvido com a evidência. |
| 2 | Falta teste para obra excluída ou inexistente (404) em `NfeKeyGuard.java:21` | código | aceito | Comportamento exigido por `architecture.md` (404 para obra inexistente, excluída ou alheia). Incluir o teste na rodada 2. |

Sugestões do revisor de código (propagação `MANDATORY`, documentação da pré-condição de autorização, handler de 409 e observações fora do escopo) não entraram na triagem e ficam registradas no parecer.
