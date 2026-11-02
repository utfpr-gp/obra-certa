# Validação — Tarefa 5, rodada 2

Data: 02/11/2026. Base do diff: `9b78247b3666222c28cb6b2ce4639dfb10a6b934`.

## Correções submetidas

- `reports-page.component.spec.ts`: consumir e responder a requisição iniciada na preparação antes de verificar a moeda, mantendo `http.verify()`.
- `src/test/resources/application-test.properties`: remover H2 e criação de schema pelo Hibernate; habilitar Flyway, `ddl-auto=validate` e proteção contra clean. Conexão PostgreSQL fornecida pelo ambiente.
- `ExpenseRepositoryTest`: regressão verificando perfil de teste, PostgreSQL, Flyway habilitado, validação do schema e histórico de migrations sem falhas.

## RED

- Frontend, execução anterior desta retomada: 8 testes, 7 aprovados e 1 falha; a expectativa de moeda deixava aberto o GET `/obracerta/api/projects/project-a/reports`.
- Backend, executado pelo implementador antes de corrigir a configuração:

```powershell
.\mvnw.cmd test '-Dtest=ExpenseRepositoryTest#validatesThePostgresqlSchemaCreatedByFlywayInTheTestProfile'
```

Saída 1: 1 teste, 1 falha, 0 erros; esperava `validate`, mas encontrou `create-drop`.

## GREEN — frontend

Executado pelo orquestrador em `apps/web`, fora do sandbox para permitir ChromeHeadless:

```powershell
npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/reports/reports-page.component.spec.ts --include=src/app/core/services/report.service.spec.ts --include=src/app/app.routes.spec.ts
```

Resultado: **10 testes aprovados, saída 0**. Inclui relatório, retry, descarte de resposta anterior, moeda, contrato HTTP, 401 pelo interceptor e rotas.

## GREEN — backend

PostgreSQL 16 descartável, container `obra-certa-us06-task5-tests`, banco `obracerta_task5_test`, porta local `55438`. Criado a partir da imagem já instalada; não usa o banco de desenvolvimento nem credenciais de produção.

Com `SPRING_PROFILES_ACTIVE=test` e `SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:55438/obracerta_task5_test`, usuário e senha exclusivos do container, executado pelo orquestrador em `apps/api`:

```powershell
.\mvnw.cmd test '-Dtest=ReportServiceTest,ReportControllerTest,ExpenseRepositoryTest'
```

Resultado: **9 testes aprovados, 0 falhas, 0 erros, 0 ignorados; BUILD SUCCESS, saída 0**:

- `ReportControllerTest`: 2.
- `ExpenseRepositoryTest`: 4.
- `ReportServiceTest`: 3.

O log comprova PostgreSQL 16.15, criação de `flyway_schema_history`, aplicação bem-sucedida das 10 migrations V1–V10 sobre banco vazio e inicialização posterior do Hibernate com `validate`. Relatórios JUnit em `apps/api/target/surefire-reports/TEST-com.obracerta.{controller.ReportControllerTest,repository.ExpenseRepositoryTest,service.ReportServiceTest}.xml`.

Nenhuma migration ou código de produção foi alterado nesta rodada. A verificação ficou restrita às correções da tarefa 5, sem implementar o comparativo completo ou PDF.
