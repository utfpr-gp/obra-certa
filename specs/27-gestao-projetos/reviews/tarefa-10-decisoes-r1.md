# Decisões da Triagem — Tarefa 10 — Rodada 1

Pareceres: `tarefa-10-conformidade-r1.md` (**APROVADO COM RESSALVAS**) e `tarefa-10-codigo-r1.md` (**APROVADO COM RESSALVAS**).

## Decisão de contrato

**Opção (A) — manter a API em português.** `ResourceNotFoundException` continua com `"Projeto não encontrado"`; o teste de fatia espera essa mensagem. O campo `error` permanece `"Not Found"` (reason phrase HTTP), conforme o exemplo do `docs/architecture.md` §5.2 (campos HTTP em inglês, mensagem de domínio em português). Nenhuma mudança em produção, DTO, exceção ou migration.

## Triagem

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | [Alta] Suíte completa não comprovada | conformidade | **resolvido por execução** | O orquestrador recriou o banco `obracerta_test` e rodou `mvnw.cmd test`: **20/20, 0 falhas, 0 erros, 0 skipped, BUILD SUCCESS**. A ressalva era limitação de shell do revisor (só `git`), não defeito de código. |
| 2 | [Baixa] `$.fieldErrors` validado só como array, não como vazio | código | **aceito** | Trocar `isArray()` por `isEmpty()`; o handler devolve `List.of()` e o `architecture.md` fixa `"fieldErrors": []`. |
| 3 | [Baixa] Guarda de “não expor dados” só cobre `name`/`location` | código | **aceito** | Adicionar `doesNotExist()` para `id`, `userId`, `deletedAt`, `stackTrace`, `trace` e `exception`; manter `name`/`location`. |
| 4 | [Baixa] Asserções de `name`/`location` são tautológicas e os nomes dos testes superestimam a prova de Anti-IDOR | conformidade | **aceito parcialmente** | Adicionar um comentário de classe separando a prova da fatia (payload 404) da prova real de posse (`ProjectAntiIdorIntegrationTest`/`ProjectLifecycleTest`). Os nomes dos testes permanecem: eles descrevem o cenário HTTP, e a posse é provada na integração. |
| 5 | `@MockBean` depreciado | código | **recusado / dívida** | O projeto inteiro usa `@MockBean` (inclusive `ProjectValidationTest`); migrar para `@MockitoBean` é manutenção separada. |
| 6 | `timestamp` só com `.exists()` | código | **recusado / dívida** | Mesmo padrão de `ProjectValidationTest`; endurecer o formato ISO é melhoria, não requisito. |
| 7 | `any(ProjectUpdateDTO.class)` não verifica o mapeamento | código | **recusado / dívida** | O controller só delega; a validação do corpo é coberta por `ProjectValidationTest` e o fluxo real por `ProjectLifecycleTest`. |
| 8 | Ausência de testes 401/403 | código | **recusado / dívida** | Fora do escopo da Tarefa 10 e da Issue #27; registrar como risco de segurança junto do T6C. |
| 9 | `UserControllerTest` com todos os `@Test` comentados | conformidade e código | **recusado / dívida** | Pré-existente e fora do escopo; candidato a Issue de manutenção. |
| 10 | `ResourceNotFoundException` com nome genérico e mensagem fixa de projeto | código | **recusado / dívida** | Fora do diff; hoje só `ProjectService` usa. |

## Resíduo

- Itens 2 e 3 serão corrigidos e passam pela rodada 2.
- Item 4 será mitigado por comentário na mesma rodada.
- Itens 5 a 10 ficam registrados como dívida aceita; não bloqueiam a tarefa.
- A suíte completa já foi executada no estado atual: **20/20**; após a correção, deve ser repetida.
