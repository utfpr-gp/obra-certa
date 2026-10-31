# Validação — Tarefa 3, rodada 1

## Contrato e autorização

Após a explicação inicial, o autor aprovou a remoção simples com tentativa manual e confirmou restringir a simplificação à Tarefa 3. Spec e plano revisados foram registrados antes do código em `e23bea8c1666f6daa22ce7aaae6725d9f85ef769`. Tarefas 4 e 5 mantêm seus contratos; a infraestrutura durável foi adiada para a Tarefa 4. Não foi alterado o campo de aprovação da spec. A explicação atualizada do tutor foi apresentada antes do despacho do implementador.

## RED

- Frontend: três testes novos falharam pela ausência da ação de remoção. Log: `apps/web/us04-t3-red-root.log`.
- A primeira execução backend detectou ausência do banco `obracerta_test`; os cenários integrados não executaram. Log: `apps/api/target/us04-t3-red-root.log`. Essa falha de ambiente não comprova RED funcional.
- Criado o banco dedicado `obracerta_us04_t3_test` no PostgreSQL local, sem alterar o banco da aplicação. Nova execução: 18 testes, 13 falhas esperadas, zero erros. Dez cenários integrados receberam HTTP 405 pelo DELETE ausente; três testes do adapter detectaram a exclusão ainda inexistente. Cinco testes anteriores passaram. Log: `apps/api/target/us04-t3-red-postgres-root.log`.
- A reflexão usada somente para o RED diante do contrato Java inexistente foi retirada dos testes no GREEN; as chamadas finais são tipadas.

## GREEN e regressão

- Backend: `./mvnw.cmd -Dtest=ExpenseReceiptRemovalIntegrationTest,S3ReceiptStorageTest,ExpenseReceiptIntegrationTest,ExpensePaymentUpdateIntegrationTest,ExpenseUpdateIntegrationTest,ExpenseRegistrationIntegrationTest -Djava.external.resources=target/validation test`. Perfil test; PostgreSQL exclusivo `obracerta_us04_t3_test`, Flyway ativo, Hibernate validate. **97 testes, zero falhas, zero erros.** Log: `apps/api/target/us04-t3-green-root.log`.
- Angular: `npx.cmd --no-install ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/**/*.spec.ts`. **107 testes aprovados.** Log: `apps/web/us04-t3-green-root.log`.
- Build: `npm.cmd run build`, exit 0. Aviso de bundle inicial 636,38 kB para orçamento de 500 kB. Log: `apps/web/us04-t3-build-root.log`.

O teste integrado de falha parcial utiliza chamadas HTTP com transações independentes e trigger PostgreSQL temporário restrito à despesa do cenário, removido após o teste. Prova exclusão física seguida de falha de persistência, rollback do vínculo e conclusão por repetição manual com objeto ausente. Nenhuma conta real de armazenamento foi acessada. Não há migration, outbox, scheduler ou campo de limpeza pendente nesta tarefa.

Comandos executados pelo orquestrador. As evidências não substituem os dois pareceres independentes.
