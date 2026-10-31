# Parecer de Código — Tarefa 2

**Veredito:** APONTAMENTOS

Revisão R2 do diff `git diff f152daf`, com leitura dos 16 arquivos da aplicação, arquitetura, spec, plano e registros da rodada anterior. Os logs conferidos registram 68 testes backend sem falhas/erros, 104 testes Angular aprovados e build concluído com aviso de tamanho do bundle. Não executei testes nem alterei arquivos.

## Apontamentos (bloqueiam)

1. **Editar uma despesa já quitada sobrescreve a data efetiva de quitação** — `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:151`
   
   Regra violada: `docs/architecture.md`, §3, define `pending_payments.paid_at` como **“data efetiva da quitação”**. O código atribui `clock.instant()` sempre que recebe `paid=true` e existe pagamento vinculado, sem verificar se ocorreu transição de pendente para pago.
   
   Prejuízo concreto: após quitar em um instante A, corrigir somente descrição, categoria ou valor em B muda `paidAt` para B, perdendo a data da quitação atual. Um pagamento legado já quitado, cujo `paidAt` permaneceu nulo corretamente na migration, também recebe uma data inventada ao editar dados comuns. O instante deve ser registrado na transição de quitação e preservado nas edições que mantêm o estado pago. Os testes atuais cobrem transições e ciclos, mas não esse caminho.

## Sugestões (não bloqueiam)

- Em `apps/api/src/test/java/com/obracerta/migration/PaymentSchemaMigrationTest.java:60`, a inserção com status inválido reutiliza `expense_id='e_paid'`, já vinculado a outro pagamento. A violação da unicidade também satisfaz `DataIntegrityViolationException`, portanto essa asserção pode passar mesmo sem a constraint de status. Usar uma despesa ainda sem pagamento isolaria a constraint que o teste pretende verificar.

## Observações fora do escopo deste diff

- As alterações preexistentes de `docs/prd.md` e `docs/architecture.md` foram lidas e não constituem reprovação da Tarefa 2.
