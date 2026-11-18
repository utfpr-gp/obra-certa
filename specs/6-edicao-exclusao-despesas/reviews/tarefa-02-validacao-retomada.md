# Validação — Tarefa 2, retomada autorizada

Autorização e escopo registrados em `tarefa-02-decisoes-r2.md`. Alterados somente ExpenseService, ExpensePaymentUpdateIntegrationTest e PaymentSchemaMigrationTest nesta retomada.

## RED antes da alteração de produção

Com PostgreSQL dedicado `obracerta_test`, foram executados os métodos `editingPaidExpensePreservesOriginalSettlementInstantAfterClockAdvances`, `editingLegacyPaidExpenseDoesNotInventSettlementInstant` e o teste da migration.

Resultado: três testes, duas falhas esperadas e zero erros. A edição paga → paga substituiu 2030-01-05T10:00:00Z por 2030-01-20T14:30:00Z; o legado sem data recebeu indevidamente 2030-01-05T10:00:00Z. O teste fortalecido da migration passou, verificando SQLSTATE 23514 e chk_pending_payments_status com dados válidos e vínculo ainda livre.

Log: `apps/api/target/us04-t2-retomada-red-root.log`.

## GREEN e regressão

Comando em apps/api: `./mvnw.cmd -Dtest=ExpensePaymentUpdateIntegrationTest,PaymentSchemaMigrationTest,ExpenseUpdateIntegrationTest,ExpenseRegistrationIntegrationTest,ExpenseServiceTest -Djava.external.resources=target/validation test`.

Perfil test; datasource PostgreSQL 16.15 exclusivo para testes; Flyway ativo; Hibernate validate mantido.

Resultado: **70 testes, zero falhas, zero erros**. Log: `apps/api/target/us04-t2-retomada-green-root.log`.

Os testes novos verificam DTO e dados recarregados após flush/clear. A produção registra paidAt somente quando o pagamento passa de PENDING para PAID. Edições que mantêm PAID conservam data conhecida ou nulo legado.

Frontend e migrations SQL não foram alterados nesta retomada. Permanecem os resultados anteriores: 104 testes Angular aprovados, TypeScript e build com exit 0, aviso de bundle de 635,30 kB para orçamento de 500 kB; logs indicados em validacao-r2. Não foram repetidos sem mudança que justificasse.
