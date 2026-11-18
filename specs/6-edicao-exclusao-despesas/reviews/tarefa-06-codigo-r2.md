# Parecer de Código — Tarefa 6, rodada 2

**Veredito:** APROVADO

## Apontamentos bloqueantes

Nenhum.

## Evidências

- Angular usa `inject()`, serviços tipados e `authInterceptor` registrado na configuração da aplicação.
- A cadeia real interceptor → `Auth.logout()` remove token, limpa obra ativa, navega para `/login` e propaga o 401.
- Não há reenvio automático, intenção pendente ou retomada da operação.
- O teste backend usa `@SpringBootTest`, filtros reais, `TokenService` real e JWTs válidos, inválidos e expirados; apenas o storage externo é simulado.
- As 16 execuções parametrizadas cobrem as quatro mutações e preservam banco/storage em falhas de autenticação.
- Tipagem/build frontend e suíte backend foram aprovados.

## Sugestões

- Evitar dependência de categoria global existente via `categories.findAll().getFirst()`; uma fixture dedicada reduziria acoplamento.
- O teste Angular comprova serviço/interceptor, mas não instancia diretamente o componente ou diálogo de edição/exclusão.
