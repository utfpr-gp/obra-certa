# Validações — Tarefa 2, rodada 1

Executadas em 04/11/2026 no banco local separado `us08_validation_20261104`, PostgreSQL 16.15. Perfil `test`, migrations existentes e Hibernate em `validate`. Credenciais fornecidas somente ao processo por `SPRING_DATASOURCE_*`, sem registro. Testes integrados executados pelo orquestrador fora do sandbox mediante autorização, devido ao bloqueio de socket local no sandbox.

## RED

Antes da implementação, em `apps/api`:

```powershell
.\mvnw.cmd '-Dtest=PaymentSettlementIntegrationTest' test
```

Resultado: 12 casos, 11 falhas e nenhum erro de infraestrutura. A rota PUT ainda não existia, retornando 404 nos casos que esperavam validação ou sucesso. O caso de autenticação sem token já passou. O implementador recebeu esse resultado antes de escrever o código de produção.

## GREEN

Após a implementação, em `apps/api`:

```powershell
.\mvnw.cmd '-Dtest=PaymentSettlementIntegrationTest,PaymentAlertsIntegrationTest,ExpensePaymentUpdateIntegrationTest' test
```

Resultado: **22 testes passaram**, nenhuma falha, erro ou teste ignorado; `BUILD SUCCESS`, saída 0.

- `PaymentSettlementIntegrationTest`: 12 casos, incluindo entrada inválida, datas igual/futura, UTC, preservação de dados e teto, idempotência, concorrência real, rollback, isolamento, exclusões e autenticação JWT.
- `PaymentAlertsIntegrationTest`: 3 casos de regressão dos alertas.
- `ExpensePaymentUpdateIntegrationTest`: 7 casos de regressão da edição US04.

A constraint temporária usada no banco isolado para provocar falha de persistência gerou o erro esperado; o teste de rollback passou e removeu a constraint em `finally`.

O implementador também executou:

```powershell
.\mvnw.cmd '-Dtest=PaymentServiceTest' test
```

Resultado: **3 testes unitários passaram**, nenhuma falha ou erro. Não houve execução Maven simultânea entre implementador e orquestrador.

Frontend não foi alterado nesta tarefa. O modal e as ações das telas continuam previstos nas tarefas 3 e 4.
