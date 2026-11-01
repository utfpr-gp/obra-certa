# Parecer de Conformidade — Tarefa 7

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA9 — Trocar obra abandona resultados e filtros, iniciando Todas na primeira página | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:268`; `accounts-context.spec.ts:72` |
| CA9 — Ignorar sucessos e erros antigos, inclusive A → B → A e consultas concorrentes de aba, filtros e página | atendido | `accounts-page.component.ts:293`; `accounts-context.spec.ts:38`, `:52`, `:62`, `:100`, `:114` |
| CA9 — Atualização da mesma obra preserva seleção | atendido | `accounts-page.component.ts:270`; `apps/web/src/app/core/services/active-project.service.ts:60`; `accounts-context.spec.ts:72` |
| CA9 — Sem obra, orientar seleção sem consultar despesas | atendido | `accounts-page.component.ts:136`, `:285`; `accounts-context.spec.ts:132` |
| CA10 — Erro e retry manual preservam contexto sem apresentar números antigos | atendido | `accounts-page.component.ts:133`, `:297`, `:311`; `accounts-context.spec.ts:144` |
| CA10 — 401 utiliza logout/redirecionamento existentes, sem restauração automática | atendido | `apps/web/src/app/core/interceptors/auth-interceptor.ts:21`; `apps/web/src/app/core/services/auth.ts:37`; `accounts-context.spec.ts:168` |
| CA10 — Sair ou fechar a página não altera dados | atendido | `accounts-page.component.ts:295`; `accounts-context.spec.ts:180`; `apps/api/src/test/java/com/obracerta/controller/ExpenseListingIntegrationTest.java:61` |
| CA10 — Retorno do cadastro/consulta recarrega registros e totalizadores atuais | atendido | `apps/web/src/app/features/expenses/accounts-return-navigation.spec.ts:36` |
| Demais critérios CA1–CA8 e CA11 | fora desta tarefa | Recorte da Tarefa 7: CA9 e CA10 |

Evidências de execução conferidas, realizadas pelo orquestrador: testes relacionados **49/49**, suíte frontend **388/388**, integração da API **4/4** e build concluído. O build apresenta aviso de bundle inicial de 698,21 kB para orçamento de 500 kB. Não repeti as execuções nem alterei arquivos.

As alterações externas em `docs/architecture.md`, `docs/prd.md` e na auditoria da Issue #9 foram excluídas do julgamento desta tarefa, conforme o despacho.

## Apontamentos
