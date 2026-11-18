# Parecer de Conformidade — Tarefa 5

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — Formulário informa JPEG, PNG, PDF e limite de 10 MB | atendido | apps/web/src/app/features/expenses/expense-form.component.html:105; apps/web/src/app/features/expenses/expense-flow.spec.ts:89 |
| CA3 — Upload ocorre somente após confirmação da criação financeira e apresenta progresso | atendido | apps/web/src/app/features/expenses/expense-form.component.ts:166; apps/web/src/app/features/expenses/expense-flow.spec.ts:89 |
| CA3 — Interface permite consultar comprovante confirmado pela API | atendido | apps/web/src/app/features/expenses/expense-detail.component.ts:76; apps/web/src/app/features/expenses/expense-flow.spec.ts:112 |
| CA3 — API associa, armazena e recupera JPEG, PNG e PDF, aceitando exatamente 10 MiB | não atendido — verificação independente impedida pela infraestrutura | apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:78 |
| CA7 — Recurso alheio ou excluído retorna 404 antes de acessar o armazenamento | não atendido — verificação independente impedida pela infraestrutura | apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:121 |
| CA8 — Validação profunda de arquivos inválidos | fora desta tarefa | specs/5-cadastro-despesas/plan.md — Tarefa 6 |
| CA6 — Tag, reabertura e reenvio pela interface | fora desta tarefa | specs/5-cadastro-despesas/plan.md — Tarefa 7 |

## Apontamentos

1. **Verificação independente da API pendente por bloqueio de conexão ao PostgreSQL** — `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:78`  
   Critérios sem comprovação executável nesta revisão: CA3, “o comprovante fica associado à despesa para consulta posterior pelo proprietário”, e CA7, “a operação é recusada como recurso não encontrado”.  
   Evidência: o comando solicitado executou com o banco `obracerta_us03_conformidade`, mas terminou com 9 erros de inicialização de contexto, `SQL State: 08001`, antes das asserções. A tentativa escalada não retornou resultado antes da interrupção. Não foi identificado defeito funcional no diff; este apontamento registra exclusivamente a validação pendente. Os testes web independentes passaram: **18 SUCCESS**, após execução escalada do ChromeHeadless.
