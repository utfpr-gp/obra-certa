# Validação — Tarefa 5 (CA5)

Data: 01/11/2026. Execuções conduzidas pelo orquestrador, com PostgreSQL 16 no banco separado `obracerta_test`, perfil `test`, Flyway e `ddl-auto=validate`. Frontend executado isoladamente em ChromeHeadless.

## RED

- API: `ExpenseSortListingIntegrationTest`, 3 testes, 1 falha e 2 sucessos. A consulta com ordenação válida recebeu 400 porque o parâmetro `sort` ainda não era permitido. Log: `apps/api/target/tarefa-05-api-red.log`.
- Web: `accounts-page.component.spec.ts`, 13 testes, 4 falhas e 9 sucessos. Falhas nos casos novos: parâmetro inicial de ordenação ausente e controle DOM ausente. Log: `apps/web/tarefa-05-web-red.log`.
- Nenhuma lógica de produção foi alterada antes da confirmação das duas execuções RED.

## Comandos

API, em `apps/api`, com conexão de teste fornecida pelo ambiente:

```powershell
.\mvnw.cmd -Dtest=ExpenseSortListingIntegrationTest '-Dlogging.file.name=target/tarefa-05-api.log' test -q
```

Frontend, em `apps/web`:

```powershell
npm.cmd test -- --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts
```

## Cobertura e decisões

- `sort`: `PURCHASE_DATE_DESC` (padrão), `PURCHASE_DATE_ASC`, `AMOUNT_DESC` e `AMOUNT_ASC`. API rejeita valor desconhecido, vazio e repetido pelo contrato de erro existente.
- O service aplica `Sort` ao `PageRequest`, ordenando antes da paginação. Desempate por `id ASC` em todas as opções, preservando a convenção existente.
- Integração compara IDs esperados das duas páginas de 22 despesas, incluindo 18 empatadas atravessando a fronteira de 15 itens. As quatro ordens são distintas; aba, período, categoria e fornecedor combinam-se com ordenação e os totais permanecem iguais.
- Testes Angular exercitam as quatro seleções pelo DOM, padrão inicial, retorno imediato à página zero, preservação de todos os filtros/aba, consulta da página seguinte com a ordem selecionada e rejeição de resposta anterior à troca de ordenação.
- A assinatura HTTP preserva os cinco argumentos anteriores e acrescenta um sexto opcional para ordenação. Overloads existentes da API mantêm a ordem padrão.
- A troca de ordenação reutiliza a versão existente para invalidar respostas obsoletas. As demais regras gerais de contexto, estados vazios, carregamento e navegação das tarefas 6, 7 e 8 não foram antecipadas.
- Nenhuma migration, valor substituto, alteração no checklist ou commit.

## GREEN

- API: `ExpenseSortListingIntegrationTest`, 3 testes, todos aprovados.
- Web: `accounts-page.component.spec.ts`, 13 testes, todos aprovados em ChromeHeadless.

Comandos executados:

```powershell
$env:SPRING_PROFILES_ACTIVE='test'; $env:SPRING_DATASOURCE_URL='jdbc:postgresql://localhost:5432/obracerta_test?useTimezone=true&serverTimezone=UTC&useSSL=false'; $env:SPRING_DATASOURCE_USERNAME='postgres'; $env:SPRING_DATASOURCE_PASSWORD='postgres'; Set-Location apps/api; .\mvnw.cmd -Dtest=ExpenseSortListingIntegrationTest '-Dlogging.file.name=target/tarefa-05-api-review-postgres.log' test -q
```

Resultado: `Tests run: 3, Failures: 0, Errors: 0, Skipped: 0`.

```powershell
Set-Location apps/web; npm.cmd test -- --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts
```

Resultado: `TOTAL: 13 SUCCESS`.

A primeira tentativa da API sem as propriedades de PostgreSQL falhou ao iniciar o H2 porque a migration V2 usa índice parcial, sintaxe não suportada pelo H2. Essa falha de ambiente foi contornada executando o mesmo teste com o perfil PostgreSQL previsto; nenhuma migration ou configuração de produção foi alterada.
