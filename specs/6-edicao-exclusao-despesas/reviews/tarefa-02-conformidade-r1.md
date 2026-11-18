# Parecer de Conformidade — Tarefa 2

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — paga → pendente exige vencimento obrigatório | atendido | `ExpenseService.java:263-265` |
| CA3 — vencimento não pode ser anterior à data da despesa | atendido | `ExpenseService.java:266-267` |
| CA3 — vencimento igual à data da despesa é permitido | atendido | `ExpensePaymentUpdateIntegrationTest.java:501-507` (teste especifica `isBefore`, não `isAfter-or-equal`) |
| CA3 — reutiliza PendingPayment existente ao ir para pendente | atendido | `ExpenseService.java:280-293` |
| CA3 — cria PendingPayment somente quando ausente | atendido | `ExpenseService.java:285-293` |
| CA3 — pendente → paga registra quitação e data | atendido | `ExpenseService.java:294-300` |
| CA3 — quitação não remove a linha de pagamento | atendido | `ExpenseService.java:294-300`; `ExpensePaymentUpdateIntegrationTest.java:538-546` |
| CA3 — alteração é atômica (falha desfaz tudo) | atendido | `@Transactional` em `ExpenseService`; `atomicFailureRollsBackEntireUpdate` |
| CA3 — ciclos repetidos preservam mesmo paymentId | atendido | `ExpensePaymentUpdateIntegrationTest.java:550-613` |
| CA3 — reabertura limpa a quitação atual (paidAt → null) | atendido | `ExpenseService.java:282-284`; `repeatedCyclesPreserveSamePaymentIdentifierAndReopeningClearsPaidAt` |
| CA9 — vencimento pendente não pode ser anterior à data da despesa | atendido | `ExpenseService.java:266-267` |
| CA9 — entradas inválidas recusadas sem gravação parcial | atendido | `@Transactional` + validação prévia |
| Migration V10 com backfill sem inventar paid_at | atendido | `V10__add_payment_status_and_paid_at.sql:337-344` (paid_at não é populado) |
| PaymentSchemaMigrationTest — prova backfill e Hibernate validate | **não atendido** | `PaymentSchemaMigrationTest.java` — teste não executa (ver apontamento 1) |
| ExpensePaymentUpdateIntegrationTest — todos os cenários JUnit | **não atendido** | `ExpensePaymentUpdateIntegrationTest.java` — teste não executa (ver apontamento 1) |
| expense-edit.spec.ts — alternância de situação e resultado salvo | **não atendido** | `expense-edit.spec.ts:169` — compilação TypeScript falha (ver apontamento 2) |

## Apontamentos

1. **Testes backend não executam por ausência de banco PostgreSQL no ambiente local** — `ExpensePaymentUpdateIntegrationTest.java` e `PaymentSchemaMigrationTest.java`
   Critério violado: a tarefa exige que os testes provem os critérios de CA3 e CA9. Testes que não rodam não contam como critério atendido.
   Evidência: ambos os comandos terminam com `BUILD FAILURE` e `Tests run: N, Failures: 0, Errors: N`. A causa raiz é que o profile `test` exige PostgreSQL (via variável de ambiente `SPRING_DATASOURCE_URL`), que não está disponível na máquina local. A stack trace mostra `JdbcSQLSyntaxErrorException` em H2 (partial index `WHERE` clause), confirmando que o runner está usando H2 em vez de Postgres — o profile `test` não estava ativo ou o datasource não foi injetado corretamente. Independente da causa (infra ausente vs. misconfiguration), **os testes não passam** na execução comandada.

2. **Frontend: `expense-edit.spec.ts` não compila — erro TS2345 na linha 169** — `expense-edit.spec.ts:169`
   Critério violado: spec pede que `expense-edit.spec.ts` prove "alternância de situação e apresentação do resultado salvo". Teste que não compila não prova nada.
   Evidência: `ng test` encerra com `Application bundle generation failed` e `TS2345: Argument of type '{paid: false; dueDate: string; …; receiptState: string; …}' is not assignable to parameter of type 'ExpenseResponse'`. O objeto literal `{...saved, paid: false, dueDate: '2030-01-10'}` é inferido com `receiptState: string` em vez de `'NONE' | 'PENDING' | 'UPLOADED'` porque a constante `saved` declara `receiptState: 'NONE'` sem `as const`, e o spread quebra a inferência do literal. O `expense.set()` aceita `ExpenseResponse | null`, e a incompatibilidade impede a compilação. A correção é usar `as const` ou cast explícito no arquivo de teste, mas como revisor apenas aponto.
