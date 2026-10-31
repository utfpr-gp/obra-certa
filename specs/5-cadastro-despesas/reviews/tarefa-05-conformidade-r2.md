# Parecer de Conformidade — Tarefa 5

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — Informar JPEG, PNG, PDF e limite de 10 MB | atendido | apps/web/src/app/features/expenses/expense-form.component.html:105 |
| CA3 — Exibir progresso e enviar somente após confirmação financeira | atendido | apps/web/src/app/features/expenses/expense-flow.spec.ts:89 |
| CA3 — Associar e recuperar JPEG, PNG e PDF | atendido | apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:80 |
| CA3 — Aceitar exatamente 10 MiB | atendido | apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:98 |
| CA3 — Consultar comprovante confirmado pela interface | atendido | apps/web/src/app/features/expenses/expense-flow.spec.ts:112 |
| CA7 — Recusar recurso alheio ou excluído com 404 antes de acessar armazenamento | atendido | apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:128 |
| Configuração Supabase autorizada, com preenchimento manual no `.env` raiz | atendido | apps/api/src/test/java/com/obracerta/integration/S3ReceiptStorageTest.java:32; docs/supabase-storage.md:15 |
| CA8 — Validação profunda de arquivos inválidos | fora desta tarefa | specs/5-cadastro-despesas/plan.md — Tarefa 6 |
| CA6 — Tag, reabertura e reenvio pela interface | fora desta tarefa | specs/5-cadastro-despesas/plan.md — Tarefa 7 |

Verificação executada: **18 testes web, 5 testes do adaptador S3 e 9 testes de integração/migração passaram**, sem falhas. A integração utilizou PostgreSQL real no banco `obracerta_us03_conformidade`, com Flyway validando a V9 aplicada. ChromeHeadless e acesso local de rede exigiram execução escalada.

O diff completo solicitado foi revisado. A configuração real do Supabase permanece sem validação ao vivo, conforme limitação documentada; os testes usam armazenamento controlado e HTTP local. Nenhum segredo real foi lido e nenhum arquivo-fonte ou parecer foi alterado.

## Apontamentos
