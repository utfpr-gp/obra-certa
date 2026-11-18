# Parecer de Código — Tarefa 5, rodada 2

**Veredito:** APROVADO

## Verificações

- `authInterceptor` usa `catchError`/`throwError`, faz logout somente em 401 e propaga 500/404.
- HttpClient permanece encapsulado em serviços com `Observable<T>`.
- `inject()`, Signals e localStorage por usuário estão alinhados à arquitetura.
- Não há uso de `any`.
- Separação de responsabilidades preservada.
- Testes: 7 testes, 0 falhas, 0 erros.

## Sugestões

- Tipar explicitamente `Auth.isAuthenticated()` como `boolean`.
- Avaliar a duplicidade entre `selectProject()` e `setActiveProject()`.
- Adicionar teste para ausência de token e isolamento entre usuários.
