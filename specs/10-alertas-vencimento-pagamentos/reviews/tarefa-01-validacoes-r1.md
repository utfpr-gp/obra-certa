# Validações complementares — Tarefa 1, rodada 1

Executadas em 04/11/2026 a pedido do autor, após o apontamento de validação pendente. Não houve alteração no código de produção ou nos testes. Os pareceres originais permanecem imutáveis. Este registro complementa a evidência de execução da rodada 1; não é um novo parecer nem uma segunda rodada de implementação/revisão.

## Angular

Diretório: `apps/web`.

```powershell
npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/core/services/payment.service.spec.ts --include=src/app/features/home-page/home-page.spec.ts
```

Resultado: **40 testes passaram**, código de saída 0, com Chrome Headless 156 no Windows. Executado fora do sandbox mediante autorização. A execução cobre as specs do serviço HTTP e da Home, incluindo estados de consulta, timeout, 401 e troca de contexto.

## Java e PostgreSQL

Diretório: `apps/api`.

```powershell
.\mvnw.cmd '-Dtest=PaymentAlertsIntegrationTest,PaymentServiceTest' test
```

Configuração: perfil `test`, PostgreSQL 16.15 local no container `obracerta-database`, banco separado `us08_validation_20261104`. As variáveis `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` e `SPRING_DATASOURCE_PASSWORD` foram fornecidas somente ao processo; credenciais não foram registradas. O banco de desenvolvimento não foi usado pelos testes.

Resultado: **6 testes passaram**, nenhuma falha, erro ou teste ignorado; `BUILD SUCCESS`, código de saída 0.

- `PaymentAlertsIntegrationTest`: 3 testes passaram. Verificam horizonte completo, limites/urgência, resumo exato, desempate, exclusões, vazio, mais de 15 itens e 404 para obra alheia/inexistente/excluída.
- `PaymentServiceTest`: 3 testes passaram.
- Flyway aplicou e validou as 10 migrations existentes no banco separado; Hibernate manteve `ddl-auto=validate`.

O teste integrado existente substitui a identidade e desliga os filtros HTTP. A sugestão do revisor de acrescentar teste com autenticação JWT real não foi implementada nesta validação.

## Pendência independente

O apontamento de código sobre conversão Entity → DTO no `PaymentService` permanece aguardando triagem do autor. Nenhuma correção foi feita nesta etapa.
