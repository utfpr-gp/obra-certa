# Parecer de Código — Tarefa 6, rodada 1

**Veredito:** APROVADO

## Apontamentos bloqueantes

Nenhum.

## Sugestões

- `expense-mutation-auth.spec.ts` valida serviço/interceptor, mas não instancia um componente ou diálogo; portanto, “ausência de modal inline” é apenas inferida, não comprovada diretamente.
- A matriz Angular poderia afirmar explicitamente os métodos HTTP e o corpo das requisições.
- A fixture backend usa `getFirst()` e pressupõe categoria previamente existente; uma fixture dedicada reduziria acoplamento.

## Observações

- A implementação respeita a cadeia `Controller → Service`, usa JWT real no backend e o `authInterceptor` real no frontend.
- O interceptor executa `Auth.logout()`, limpa token/obra ativa, navega para `/login` e propaga o erro.
- Os testes backend cobrem JWT ausente, inválido e expirado antes de escrita/storage, além de token válido.
- Não foram identificados migrations, filas, retries ou mecanismos de retomada automática.
