# Parecer de Conformidade — Tarefa 2

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — paga → pendente exige vencimento e permite igualdade com a data da despesa | atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:112`; `ExpensePaymentUpdateIntegrationTest.java:130` |
| CA3 — reutiliza o pagamento existente e cria somente quando ausente | atendido | `ExpenseService.java:130`; `ExpensePaymentUpdateIntegrationTest.java:86` |
| CA3 — pendente → paga registra quitação com Clock e preserva linha e identificador | atendido | `ExpenseService.java:146`; `ExpensePaymentUpdateIntegrationTest.java:160` |
| CA3 — preserva a data da quitação atual quando a despesa continua paga | não atendido | `ExpenseService.java:151` |
| CA3 — ciclos reutilizam o mesmo pagamento; reabertura limpa a quitação atual | atendido | `ExpenseService.java:132`; `ExpensePaymentUpdateIntegrationTest.java:203` |
| CA3 — atualização financeira atômica e sem novo lançamento na alternância | atendido | `ExpenseService.java:101`; `ExpensePaymentUpdateIntegrationTest.java:264` |
| CA9 — vencimento anterior à compra recusado sem gravação parcial | atendido | `ExpenseService.java:112`; `ExpensePaymentUpdateIntegrationTest.java:264`; `ExpenseUpdateIntegrationTest.java:102` |
| CA9 — tela exige vencimento, destaca erro temporal e aceita igualdade | atendido | `expense-edit-modal.component.ts:84`; `expense-edit-modal.component.html:24`; `expense-edit-modal.component.spec.ts:68` |
| CA3 — formulário preenchido, alternância de situação e apresentação do resultado salvo | atendido | `expense-edit-modal.component.ts:54`; `apps/web/src/app/features/expenses/expense-edit.spec.ts:119` |
| Migração prevista — backfill pela situação existente sem inventar quitação; schema validado | atendido | `V10__add_payment_status_and_paid_at.sql:1`; `PaymentSchemaMigrationTest.java:25`; `application-test.properties:11` |
| Execução dos testes previstos | atendido | Logs originais: `apps/api/target/us04-t2-green-final-root.log` — 68 testes, zero falhas/erros, PostgreSQL 16.15; `apps/web/us04-t2-green-final-root.log` — 104 aprovados |
| CA4–CA8, CA10 e demais partes de CA9 destinadas às tarefas seguintes | fora desta tarefa | `specs/6-edicao-exclusao-despesas/plan.md` |

## Apontamentos

1. **Salvar uma despesa já quitada reescreve a data efetiva de quitação** — `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:151`  
   Critério violado: `specs/6-edicao-exclusao-despesas/spec.md:22` — CA3 exige registrar a quitação e sua data na passagem de pendente para paga, preservando o pagamento quitado; a linha 38 mantém a preservação do histórico financeiro no escopo.  
   Evidência: qualquer atualização com `paid=true` e pagamento existente executa `payment.setPaidAt(clock.instant())`, sem verificar a situação anterior. Após quitar em T1, editar somente a descrição em T2 mantém a despesa paga, mas substitui T1 por T2 como data da quitação. O mesmo caminho preenche uma data desconhecida em pagamentos legados `PAID` com `paidAt=null`, embora a migração preserve corretamente esse nulo. Os testes aprovados cobrem transições e ciclos, mas não cobrem paga → paga com avanço do relógio.  
   Verificação adicional recomendada: quitar com Clock em T1, avançá-lo para T2, atualizar apenas a descrição mantendo `paid=true` e verificar que `paidAt` continua T1; repetir com pagamento legado quitado e `paidAt=null`, que deve permanecer nulo. A falha é identificável diretamente pelo fluxo de código; nenhum arquivo foi alterado nem teste adicional executado nesta revisão.
