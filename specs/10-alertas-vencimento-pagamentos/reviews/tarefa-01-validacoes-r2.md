# Validações — Tarefa 1, rodada 2

Executadas em 04/11/2026 após a extração da conversão de DTO para `mapper/PaymentMapper.java`. Alterações restritas ao mapper e ao `PaymentService`; contratos, testes e frontend preservados.

## Java e integração PostgreSQL

Diretório: `apps/api`.

```powershell
.\mvnw.cmd '-Dtest=PaymentAlertsIntegrationTest,PaymentServiceTest' test
```

Perfil `test`; banco separado local `us08_validation_20261104` em PostgreSQL 16.15; credenciais fornecidas somente ao processo, sem registro. Execução autorizada fora do sandbox após a tentativa do implementador ser bloqueada por `java.net.SocketException: Permission denied: getsockopt` na conexão ao banco.

Resultado final: **6 testes passaram**, nenhuma falha, erro ou teste ignorado; `BUILD SUCCESS`, código de saída 0. Três testes de integração e três testes unitários. Flyway validou as dez migrations existentes; schema atualizado e Hibernate em `validate`.

## Frontend

Nenhuma alteração desde a execução de **40 testes Angular aprovados** registrada em `tarefa-01-validacoes-r1.md`. A refatoração foi exclusivamente Java e preservou o contrato HTTP. O build frontend aprovado na implementação inicial também não foi repetido sem mudança que justificasse.
