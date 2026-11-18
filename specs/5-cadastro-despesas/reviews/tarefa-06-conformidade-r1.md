# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA8 — Rejeitar na seleção MIME/extensão incompatíveis, arquivo vazio e tamanho superior a 10 MiB, informando formatos e limite | atendido | apps/web/src/app/features/expenses/expense-form.component.ts:163; apps/web/src/app/features/expenses/expense-flow.spec.ts:91 |
| CA8 — Validar também chamadas diretas à API, retornando 400/413 sem objeto persistido | atendido | apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:34; apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:93 |
| CA8 — Anexo inválido não é apresentado como enviado; erros 400/413 encerram progresso e informam a falha | atendido | apps/web/src/app/features/expenses/expense-form.component.ts:191; apps/web/src/app/features/expenses/expense-flow.spec.ts:133 |
| CA8, conforme decisão do autor — Aceitar exatamente 10.485.760 bytes e validar somente MIME, extensão e tamanho, sem inspecionar conteúdo | atendido | apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:121; apps/web/src/app/features/expenses/expense-flow.spec.ts:117 |
| Preservar os dados financeiros quando o comprovante é rejeitado e permitir salvamento sem anexo válido | atendido | apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:115; apps/web/src/app/features/expenses/expense-flow.spec.ts:112 |
| CA7 — Preservar recusa por posse/exclusão antes de acessar o armazenamento | atendido | apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java:31; apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptIntegrationTest.java:139 |
| CA6 completo, CA11, CA12 e CA13 | fora desta tarefa | specs/5-cadastro-despesas/plan.md:80 |

Diff integral revisado com `git diff 1d5fabc435fcf9e4b6e6bd4b7f0702dce2a416dc`. Considerada a decisão explícita registrada em `reviews/tarefa-06-historico-tdd.md`: validação apenas por tipo e tamanho.

Execução independente: **21 testes API aprovados**, sem falhas, erros ou ignorados, usando PostgreSQL `obracerta_us03_conformidade`; **31 testes Angular aprovados** em ChromeHeadless.

## Apontamentos
