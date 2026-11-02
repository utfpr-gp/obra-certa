# Parecer de Conformidade — Tarefa ajuste-carregamento, rodada 2

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Ajuste autorizado do CA11 — Preservar estrutura da listagem durante GET, resolvendo o bloqueante aceito da rodada 1 | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:172`; `accounts-page.component.spec.ts:331` |
| Ajuste autorizado do CA11 — Manter cartões, controles, posições e rolagem estáveis durante atualização | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:136`; `accounts-page.component.ts:339`; `accounts-page.component.spec.ts:354` |
| CA10 — Não apresentar valores financeiros antigos como atuais | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:304`; `accounts-page.component.ts:353`; `accounts-page.component.spec.ts:377` |
| CA11 — Identificação acessível de carregamento, seleção e apresentação desktop/mobile | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:134`; `accounts-page.component.ts:171`; `accounts-page.component.spec.ts:331` |
| CA9 e CA10 — Preservar guards de contexto, descarte de respostas antigas, erro e tentativa manual | atendido no recorte; comportamentos preservados | `apps/web/src/app/features/expenses/accounts-page.component.ts:331`; `accounts-context.spec.ts:145` |
| Mudanças em API, contratos ou regras financeiras | fora desta tarefa; ausentes do diff isolado da rodada | `apps/api/target/ajuste-carregamento-r2.diff` |

O bloqueante anterior foi resolvido: tabela, cabeçalhos, linhas e artigos mobile permanecem montados durante o GET. Somente conteúdo e ações dos registros são substituídos por placeholders, com identificação explícita de indisponibilidade. A implementação conserva medidas e quantidade de posições, sem conservar DTOs financeiros anteriores.

Os testes agora verificam identidade estrita desses elementos, alturas e rolagem de um contêiner com `overflow-y:auto`, nos viewports de 360 e 1280 px. Cobrem a sequência Todas → Pendentes → Pagas, aplicação de filtros, ordenação e paginação, mantendo as verificações de ausência de valores e links antigos.

Foram conferidos os logs centralizados da rodada: RED com 2 falhas e 38 sucessos, GREEN direcionado com 40 sucessos, suíte completa com 388 sucessos e build concluído. O build mantém o aviso de orçamento do bundle. Não repeti o ChromeHeadless, conforme o despacho. A conferência manual desktop foi informada pelo orquestrador; esta revisão não declara inspeção visual própria nem conclusão da conferência manual mobile.

## Apontamentos
