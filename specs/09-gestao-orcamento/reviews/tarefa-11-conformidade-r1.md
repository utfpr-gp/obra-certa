# Parecer de Conformidade — Tarefa 11

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA10: JWT realmente expirado devolve 401 em leitura, criação, atualização e zeramento | atendido | `SecurityConfigurations.java:33`; `BudgetAuthenticationIntegrationTest.java:94` — cadeia real do Spring Security, sem filtros simulados |
| CA10: requisições recusadas não produzem gravação parcial | atendido | `BudgetAuthenticationIntegrationTest.java:172` — compara todas as colunas dos orçamentos persistidos antes e depois da requisição, após flush |
| Ausência de token e token inválido recebem 401, preservando operações com token válido | atendido | `BudgetAuthenticationIntegrationTest.java:104`, `:110` e `:116` |
| Usuário autenticado sem permissão continua recebendo 403; administrador mantém acesso | atendido | `BudgetAuthenticationIntegrationTest.java:137` e `:144` |
| Login público permanece acessível com token ausente, inválido ou expirado; cadastro permanece público | atendido | `BudgetAuthenticationIntegrationTest.java:154` e `:163` |
| CA10: resposta 401 aciona encerramento da sessão e navegação para `/login` no contrato existente | atendido | `auth-interceptor.ts:21`; `auth.ts:37`. Evidência complementar existente em `budgets-page.component.spec.ts:894`; frontend não reexecutado nesta revisão |
| CA10: recuperação de falhas de rede/5xx e preservação dos valores digitados | fora desta tarefa | Implementação anterior da Tarefa 9; a Tarefa 11 completa a resposta de autenticação do backend |
| Vínculos das premissas adiadas com números de Issues | fora desta tarefa | `plan.md` — Tarefa 12 |

Validação executada: suíte backend completa com perfil `test` e PostgreSQL local — **100 testes, nenhuma falha, nenhum erro e nenhum ignorado; BUILD SUCCESS**. O novo teste integrado executou **22 testes**, todos aprovados. A primeira execução restrita falhou por acesso aos logs externos e conexão ao banco; a repetição com permissão ampliada passou.

## Apontamentos
