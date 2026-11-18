# Validação final — US06 (Issue #8), rodada 3

Commit validado: `df41c48` (`fix: pool do perfil test no classpath de teste e remove TODO #8 do demonstrativo`), sobre `origin/develop` (`71b8e21`).

## API (`apps/api`)

- Banco: PostgreSQL 16 isolado, contêiner `obracerta-test-pg`, porta 5433, banco `obracerta_test`, usuário `postgres`. A porta 5432 está ocupada pelo contêiner de desenvolvimento `obracerta-database`, que não foi alterado.
- Variáveis: `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/obracerta_test`, `SPRING_DATASOURCE_USERNAME=postgres`, `SPRING_DATASOURCE_PASSWORD=postgres`, `POSTGRES_DB=obracerta_test`, `SPRING_PROFILES_ACTIVE=test`.
- Comando: `.\mvnw.cmd -B test "-Dspring.profiles.active=test"`.
- Resultado: `Tests run: 348, Failures: 0, Errors: 0, Skipped: 0`, `BUILD SUCCESS`.
- Evidências locais: log completo em `%TEMP%\us06-api-full-r2.log`; relatórios em `apps/api/target/surefire-reports` (46 arquivos).

## Frontend (`apps/web`)

- `npm ci`: concluído, com o `package-lock.json` atual.
- Testes: `npx ng test --watch=false --browsers=ChromeHeadless`, resultado `TOTAL: 441 SUCCESS`. Log em `%TEMP%\us06-web-full-r3.log`.
- Build: `npm run build`, concluído. Aviso não bloqueante: o `pako` usado pelo `pdf-lib` é CommonJS.

## Ajustes desta rodada

- Pool de conexões do perfil `test` declarado em `apps/api/src/test/resources/application-test.properties`, o arquivo efetivamente carregado pelo perfil.
- `// TODO #8` removido de `apps/web/src/app/features/reports/reports-demo.data.ts`. O arquivo permanece, sem alterações além da linha removida.

## Limitações

- Os logs ficaram fora do repositório, porque `*.log` é ignorado pelo Git. O registro acima e os relatórios do Surefire são as evidências versionadas ou locais.
- O PDF gerado e a composição visual (CA11) não foram inspecionados nesta rodada.
