# Parecer de Conformidade — Tarefa 2A

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA7 — consulta filtrada por usuário e `deleted_at IS NULL` | atendido na implementação | `ProjectRepository.java:10-12`; `ProjectService.java:51-55` |
| Obra de B não é encontrada por A e é encontrada por B | atendido no teste de repositório | `ProjectRepositoryTest.java:32-40` |
| Obra própria com soft delete não é encontrada | atendido no teste de repositório | `ProjectRepositoryTest.java:43-51` |
| ID inexistente retorna `Optional.empty()` | atendido no teste de repositório | `ProjectRepositoryTest.java:54-60` |
| GET de obra de B retorna HTTP 404 para A | atendido no teste integrado | `ProjectAntiIdorIntegrationTest.java:50-53` |
| Payload do GET de obra alheia é equivalente ao payload de ID inexistente | atendido no teste integrado | `ProjectAntiIdorIntegrationTest.java:54-58`; `ProjectAntiIdorIntegrationTest.java:68-74` |
| Obra de B permanece intacta após tentativa de acesso | atendido no teste integrado | `ProjectAntiIdorIntegrationTest.java:59-65` |
| Teste unitário renomeado para refletir `Optional.empty()` | atendido | `ProjectServiceTest.java:72-83` |
| PUT/DELETE permanecem fora da Tarefa 2A | atendido | Não há endpoints ou testes de PUT/DELETE no escopo analisado; o plano os reserva à Tarefa 4 |

## Apontamentos

1. **A suíte direcionada não pôde ser executada neste ambiente, portanto os critérios não têm confirmação de execução real** — `ProjectRepositoryTest.java`, `ProjectAntiIdorIntegrationTest.java` e `ProjectServiceTest.java`  
   Critério relacionado: plano da Tarefa 2A — executar os testes contra PostgreSQL real/Testcontainers.  
   Evidência: a leitura estática mostra testes adequados, mas não há resultado de execução disponível.

## Limitações

- O parecer não recebeu evidência de execução Maven nem da mutação temporária.

## Sugestões

- Executar o comando direcionado com PostgreSQL disponível e registrar o resultado.
- Registrar separadamente a mutação temporária, a falha esperada e a restauração.
