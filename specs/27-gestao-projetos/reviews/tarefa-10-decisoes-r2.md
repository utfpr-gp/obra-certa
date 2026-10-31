# Decisões da Triagem — Tarefa 10 — Rodada 2

Pareceres: `tarefa-10-conformidade-r2.md` (**APROVADO**) e `tarefa-10-codigo-r2.md` (**APROVADO COM RESSALVAS**, sem bloqueadores).

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | `isEmpty()` sozinho não garante que `fieldErrors` seja um array presente | código | **aceito como dívida** | O handler atual devolve `List.of()` e o teste passa; somar `isArray()` é endurecimento. Candidato a manutenção junto da migração de `@MockBean` para `@MockitoBean`. |
| 2 | `$.userId` não corresponde a nenhum campo real do backend | código | **aceito como dívida** | `userId` não existe em `ProjectResponseDTO`/`Project`; o caminho real de vazamento seria `$.user`/`$.user.password`. O teste já cobre `id`, `name`, `location`, `deletedAt`, `stackTrace`, `trace` e `exception`; trocar a linha é melhoria, não requisito. |

## Fechamento

A Tarefa 10 encerra na rodada 2, conforme o limite de duas rodadas de revisão. A conformidade está **APROVADA** e o código **não tem bloqueadores**. A suíte backend foi executada no estado final: **20/20, 0 falhas, 0 erros, 0 skipped, BUILD SUCCESS**.

Os itens acima ficam registrados como dívida aceita, junto dos itens 5–10 da rodada 1 (`@MockBean` depreciado, formato do `timestamp`, verificação do mapeamento do PUT, testes 401/403, `UserControllerTest` inerte e `ResourceNotFoundException` genérica). Não haverá rodada 3.

## Resíduo acumulado para eventual Issue de manutenção

- Tarefa 10: os dois itens desta rodada e os itens 5–10 da rodada 1.
- Tarefa 9: os quatro achados baixos de `tarefa-09-decisoes-r2.md`.
- Segurança: dívida do T6C, sem número de Issue registrado.
- Documentação: `docs/architecture.md:42` cita `features/projects/` inexistente; correção não aprovada pelo autor.
