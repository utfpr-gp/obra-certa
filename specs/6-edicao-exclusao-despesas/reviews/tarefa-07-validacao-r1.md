# Validação — Tarefa 7, rodada 1

Base: `1dd2daa3376452a9eb1178c82917e841ee6401c7`. Execuções pelo orquestrador em 01/11/2026, sem conta real no armazenamento e com PostgreSQL exclusivo `obracerta_us04_t3_test`.

## TDD e verificações

| Execução | Resultado | Log local |
| --- | --- | --- |
| Angular focal antes de produção, quatro specs da tarefa | RED: 49 testes, 45 sucessos, quatro falhas esperadas | `apps/web/us04-t7-red-frontend.log` |
| API focal, seis classes da US04 | 104 testes, zero falhas/erros | `apps/api/target/us04-t7-focal-backend-root.log` |
| Angular completo após correção | 344 testes aprovados, exit 0; inclui as regressões RED | `apps/web/us04-t7-full-frontend.log` |
| Build Angular | exit 0; aviso de bundle inicial de 642,57 kB para orçamento de 500 kB | `apps/web/us04-t7-build.log` |
| API completa, configuração padrão do pool | 287 testes, sete erros; limite de clientes do PostgreSQL atingido | `apps/api/target/us04-t7-full-backend-root.log` |
| API completa, pool máximo 2 e mínimo 0 | 287 testes, zero falhas, três erros | `apps/api/target/us04-t7-full-backend-pool-root.log` |
| BudgetSchemaMigrationTest e ProjectSchemaMigrationTest, pool máximo 4 e mínimo 0 | 13 testes aprovados, exit 0 | `apps/api/target/us04-t7-schema-pool4-root.log` |

Comandos, nos respectivos diretórios: `npx.cmd --no-install ng test --watch=false --browsers=ChromeHeadless`, `npm.cmd run build` e `.\mvnw.cmd '-Djava.external.resources=target/validation' test`. A primeira execução Angular usou `--include` para as quatro specs; a API focal usou `-Dtest=ExpenseUpdateIntegrationTest,ExpensePaymentUpdateIntegrationTest,ExpenseDeletionIntegrationTest,ExpenseReceiptRemovalIntegrationTest,ExpenseReceiptReplacementIntegrationTest,ExpenseMutationAuthenticationIntegrationTest`. As repetições de diagnóstico alteraram somente variáveis de ambiente de pool, sem editar configuração versionada, schema ou produção.

## Limitação da validação global

A suíte completa da API não está aprovada. A execução com pool 2 teve dois timeouts de conexão aninhada nos testes de schema, posteriormente aprovados com pool 4. O terceiro erro ocorre na fixture preexistente de `ProjectLifecycleTest.java:110`: o SQL insere um pagamento sem `status`, obrigatório desde a migration V10 da Tarefa 2. O arquivo não pertence ao diff da Tarefa 7 e não foi alterado. É necessário alinhar essa fixture e executar novamente a suíte completa antes de declarar o fechamento global verde.

Os dois revisores aprovaram o diff da Tarefa 7 e registraram a limitação global em seus pareceres. Não houve correção posterior aos pareceres, nova rodada de revisão, commit ou marcação da tarefa como concluída nesta etapa.
