# Parecer de Código — Tarefa 5, rodada 1

**Veredito:** APONTAMENTOS

## Apontamento bloqueante

1. **O `authInterceptor` não trata erros HTTP genéricos (`401`/`500`)** — `apps/web/src/app/core/interceptors/auth-interceptor.ts`

   O parecer relaciona essa ausência à regra arquitetural de tratamento global de erros. O arquivo é preexistente e não faz parte dos cinco arquivos previstos nem foi alterado pela Tarefa 5.

## Sugestões

- Tipar explicitamente `Auth.isAuthenticated()` como `boolean`.
- Consolidar `selectProject()` e `setActiveProject()`.
- Adicionar testes específicos do interceptor.

## Execução

O teste direcionado passou com 4 testes, 0 falhas e 0 erros.
