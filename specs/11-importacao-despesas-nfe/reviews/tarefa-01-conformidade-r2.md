APROVADO

# Parecer de Conformidade — Tarefa 1 (rodada 2)

**Veredito:** APROVADO

Shell negado de novo nesta rodada, então não rodei `git diff` nem os testes. A análise é estática, sobre o diff `git diff --cached 4cf5b4b -- apps/api` que você enviou e sobre o código atual. Execução dos testes segue como decidido na rodada 1 (`NfeKeyGuardTest` 4/4 e `ExpenseServiceDeleteNfeTest` 1/1, `BUILD SUCCESS`, pelo autor).

## Apontamento da rodada 1 verificado

**Falta teste para obra excluída ou inexistente (404):** resolvido.

- `NfeKeyGuard.java:21` faz `projects.lockActiveById(projectId).orElseThrow(ResourceNotFoundException::new)`. Esse é o ramo de 404.
- `ProjectRepository.java:20-22` filtra `p.deletedAt is null`, então obra excluída e obra inexistente caem no mesmo `Optional.empty()`.
- `refusesWhenTheProjectIsSoftDeleted` (`NfeKeyGuardTest`) marca `deletedAt` na obra, persiste e espera `ResourceNotFoundException`. Prova o ramo pela obra excluída.
- `refusesWhenTheProjectDoesNotExist` (`NfeKeyGuardTest`) usa ids aleatórios e espera `ResourceNotFoundException`. Prova o ramo pela obra inexistente.
- Ambos checam o tipo da exceção, que é o contrato de 404. Não há asserção fraca.

## Critérios verificados

| Critério (da spec / plano) | Situação | Onde |
| --- | --- | --- |
| CA3 — chave ativa na mesma obra é recusada com "A nota fiscal já foi registrada" | atendido na guarda | `NfeKeyGuard.java:22-23`; `NfeAlreadyRegisteredException.java:6`; teste `refusesAKeyAlreadyActiveInTheSameProject` |
| CA3 — mesma chave em outra obra do usuário é aceita | atendido | teste `acceptsTheSameKeyInAnotherProjectOfTheSameUser` |
| CA3 — "não grava nenhuma linha" | atendido no escopo da Tarefa 1 (a guarda lança antes de qualquer gravação; quem grava é a Tarefa 4) | `NfeKeyGuard.java:22-23` |
| CA11 — excluir uma linha só apaga ela e a chave continua bloqueada | atendido, pelo `ExpenseService.delete` real | `ExpenseServiceDeleteNfeTest.deletingOneLineOfANoteThroughTheServiceKeepsItsKeyBlockedForNewImports`; `ExpenseService.java:91` |
| CA11 — excluir todas as linhas libera a chave | atendido | teste `acceptsTheKeyAgainAfterEveryLineOfTheNoteIsSoftDeleted` |
| Plano T1 — despesas sem chave não contam | atendido | teste `ignoresExpensesWithoutNfeKeyInTheSameProject` |
| Plano T1 — obra excluída/inexistente → 404 | atendido | `NfeKeyGuard.java:21`; testes `refusesWhenTheProjectIsSoftDeleted` e `refusesWhenTheProjectDoesNotExist` |
| Plano T1 — trava por obra (`SELECT … FOR UPDATE`) | atendido | `ProjectRepository.java:18-19`; `NfeKeyGuard.java:19-20` |
| Plano T1 — "Migration: nenhuma" | atendido: nenhum arquivo de migration no diff | — |
| Escopo: sem 409, endpoint ou controller | atendido: nenhum handler, controller ou DTO no diff | — |

## Apontamentos

Nenhum apontamento bloqueante.

## Sugestões não bloqueantes

- **Dono da obra não é checado na guarda.** `ProjectRepository.java:20-22` busca a obra só por id, sem filtrar por `userId`. Para obra alheia, a guarda responde "já registrada" e não 404, o que vaza informação sobre a obra de outro usuário. A spec, no CA3, fala em "obra deste usuário", e `architecture.md` pede 404 para obra alheia. A rodada 1 já sugeriu documentar que o chamador valida a propriedade. Vale confirmar que a Tarefa 3/4 faz essa checagem antes de chamar `ensureNotRegistered`, ou adicionar o comentário agora.
- **CA3, "não grava nenhuma linha", depende de quem chama.** Nesta tarefa a garantia é a exceção antes do insert. A garantia de ponta a ponta só fica completa na Tarefa 4, e vale registrar isso no fechamento da tarefa.
