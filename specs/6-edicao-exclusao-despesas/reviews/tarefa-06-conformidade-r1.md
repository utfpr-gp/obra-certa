# Parecer de Conformidade — Tarefa 6, rodada 1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério | Situação |
| --- | --- |
| API retorna 401 para JWT ausente, inválido e expirado nas quatro mutações | atendido |
| 401 ocorre sem escrita em despesas/pagamentos nem acesso ao storage | atendido |
| Token válido continua autorizando as quatro operações | atendido |
| Interceptor encerra sessão, limpa contexto e redireciona ao login | atendido |
| Não há reenvio automático após autenticação | atendido |
| Não há modal inline nem preservação automática da intenção | atendido |
| Testes previstos foram executados | não atendido |

## Apontamentos bloqueantes

1. **Os testes previstos não foram executados** — `ExpenseMutationAuthenticationIntegrationTest.java`; `expense-mutation-auth.spec.ts`.

   Os comandos previstos foram:

   - `cd apps/api && .\mvnw.cmd test -Dtest=ExpenseMutationAuthenticationIntegrationTest`
   - `cd apps/web && npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/expense-mutation-auth.spec.ts`

   Não houve execução verificável dos comandos solicitados.

## Sugestões

1. O teste Angular usa os serviços reais e comprova ausência de reenvio, mas não executa literalmente o fluxo real de login seguido de retorno manual à despesa; apenas salva um novo token e verifica que nenhuma requisição automática ocorre.
