# Parecer de Código — Tarefa 6B — Rodada 1

## Veredito

Apontamentos bloqueadores.

## Apontamentos

1. **[Alta]** A Home mistura o `Project` real com dados de `ObraMockService`, incompatíveis com UUIDs da API; o dashboard pode desaparecer para obras reais e os testes não cobrem esse cenário.
2. **[Média]** `Auth.isAuthenticated()` considera qualquer string como sessão válida, permitindo que token malformado ou expirado atravesse o guard.
3. **[Média]** `Auth.logout()` não limpa o `ActiveProjectService`, deixando a obra do usuário anterior no Signal durante a troca de sessão.

## Sugestões

- Cobrir UUID desconhecido no mock, criação de obra real e troca reativa.
- Cobrir token inválido no interceptor/guard.
- Evitar identidade capturada uma única vez no construtor da Navbar.

