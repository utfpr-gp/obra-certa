# Parecer de Código — Tarefa 2A

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **O teste de fluxo integrado não exercita a autenticação real da aplicação** — `ProjectAntiIdorIntegrationTest.java:25,57-62`  
   `@AutoConfigureMockMvc(addFilters = false)` desabilita os filtros de segurança. O teste injeta manualmente um `UsernamePasswordAuthenticationToken` no `SecurityContextHolder`, portanto valida o encadeamento Controller → Service → Repository, mas não confirma que a autenticação real da aplicação estabelece corretamente o usuário autenticado. Uma regressão no filtro JWT poderia passar despercebida.

2. **A não mutação da obra de B é verificada apenas parcialmente** — `ProjectAntiIdorIntegrationTest.java:72-78`  
   O teste verifica `user`, `name` e `deletedAt`, mas não confirma que `type`, `status`, `location`, `createdAt` e `updatedAt` permaneceram inalterados. Assim, uma mutação em parte do estado da entidade poderia ocorrer sem fazer a suíte falhar.

## Verificações positivas

- `ProjectRepositoryTest` usa `@DataJpaTest` e `@AutoConfigureTestDatabase(replace = NONE)`.
- Há cobertura real para obra de B não encontrada por A, obra encontrada por B, soft delete e ID inexistente.
- O fluxo integrado usa controller, service e repository reais, sem mocks no caminho crítico.
- O filtro de posse permanece na assinatura do repository.
- O teste unitário foi renomeado para refletir `Optional.empty()`.
- O teste compara os campos estáveis do erro, preservando `status`, `error`, `message` e `fieldErrors`.
- Não foram antecipados endpoints `PUT` ou `DELETE`.

## Sugestões

- Comparar todos os campos relevantes da obra antes e depois da requisição.
- Manter os filtros habilitados e autenticar por JWT para cobrir a fronteira real de segurança.
- Renomear o teste controller mockado para explicitar que ele valida apenas o contrato HTTP.

## Limitações

- O parecer não recebeu resultado de execução Maven nem da mutação temporária.
