# Validação — Tarefa 2, rodada 2

## Correções e evidências

- RED frontend reproduzido: `npx.cmd --no-install tsc --project tsconfig.spec.json --noEmit` falhou com TS2345 em expense-edit.spec.ts:169. Fixture corrigido com tipagem ExpenseResponse, sem cast.
- Execução backend com PostgreSQL dedicado `obracerta_test`: seis erros de inicialização por `No default constructor found` em ExpenseService. Log: `apps/api/target/us04-t2-check-root.log`. O construtor que recebe Clock foi marcado para injeção Spring.
- Primeira regressão após correção: backend 67/68 e Angular 103/104. Falhas diferentes dos bloqueios anteriores: expectativas antigas da Tarefa 1 sobre paid imutável e controle que recebe erro temporal. Ajustados apenas os testes ao contrato da Tarefa 2, mantendo ausência de gravação inválida e igualdade das datas.

## Resultado final

- Backend: `./mvnw.cmd -Dtest=ExpensePaymentUpdateIntegrationTest,PaymentSchemaMigrationTest,ExpenseUpdateIntegrationTest,ExpenseRegistrationIntegrationTest,ExpenseServiceTest -Djava.external.resources=target/validation test`, com perfil test e datasource PostgreSQL: **68 testes, zero falhas/erros**. Log: `apps/api/target/us04-t2-green-final-root.log`.
- Angular: `npx.cmd --no-install ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/**/*.spec.ts`: **104 testes aprovados**. Log: `apps/web/us04-t2-green-final-root.log`.
- TypeScript: `npx.cmd --no-install tsc --project tsconfig.spec.json --noEmit`: exit 0 após correção da tipagem.
- Build: `npm.cmd run build`: exit 0. Aviso de bundle inicial 635,30 kB para orçamento de 500 kB. Log: `apps/web/us04-t2-build-root.log`.

Comandos executados pelo orquestrador; implementador não realizou testes escalados. Não foi alterado o perfil para H2 nem ddl-auto para update/create. Esta verificação é evidência de execução, não substitui os dois pareceres independentes.
