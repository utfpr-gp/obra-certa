# Decisões — Tarefa 1, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | `project_id` anulável em `budgets`/`expenses`, divergindo do `architecture.md:176,197` (NOT NULL) | código | aceito | — |
| 2 | Teste de migration não autocontido: `@SpringBootTest` sem `@ActiveProfiles`/Testcontainers, grava dados no banco de dev | código | aceito | — |
| 3 | Asserção de `flyway.info().current().getVersion()` prende o teste à versão corrente, quebrando em qualquer `V3` | código | aceito | — |
| 4 | Enums em `com.obracerta.model.enums` em vez de `com.obracerta.enums` (`architecture.md:69`) | código | aceito | — |

## Notas da triagem

- O parecer de **conformidade (r1)** veio APROVADO e não produziu apontamentos.
- O apontamento 4 implica resolver o conflito `plan.md:57-58` (que aponta `model/enums/`) × `architecture.md:69`. Decisão: o código vai para `com.obracerta.enums` (alinhado ao `UserRole` já existente) e as duas linhas de caminho do `plan.md` são corrigidas pelo orquestrador.
- Sugestões do revisor de código (índices parciais do `architecture.md:227-236`, `Project.deletedAt` como `Instant`+`Clock`, asserções presas ao nome da constraint) foram apenas relatadas, **não** promovidas a apontamento.
- Observações fora de escopo (sem Testcontainers no `pom.xml`, divergência `services/` × `service/`, sobreposição com a spec `005`) permanecem candidatas a Issue de manutenção — fora deste ciclo.
