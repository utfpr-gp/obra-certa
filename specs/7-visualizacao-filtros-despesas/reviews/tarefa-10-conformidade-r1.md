# Parecer de Conformidade — Tarefa 10

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA6 — Obra vazia orienta cadastrar a primeira conta e apresenta três totais zerados | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:87`, `:135`; `accounts-page.component.spec.ts:128` |
| CA6 — Resultado vazio mantém abas, oferece limpeza quando aplicável e não aparece como erro | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:111`, `:148`; `accounts-page.component.spec.ts:153`, `:285` |
| CA11 — Abas, totais, filtros e ações utilizáveis em desktop/mobile, com seleção acessível | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:111`, `:156`, `:307`; `accounts-page.component.spec.ts:200`, `:300` |
| CA11 — Identificação correta de carregamento | não atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:281`, `:284`, `:389` |
| Preservação dos comportamentos anteriores e da navegação | atendido nos cenários executados | Logs do orquestrador: `apps/web/tarefa-10-web-green.log` — 17 aprovados; `apps/web/tarefa-10-web-suite.log` — 361 aprovados |
| CA9/CA10 — Invalidação global, retry e preservação de contexto | fora desta tarefa | `specs/7-visualizacao-filtros-despesas/plan.md` — tarefas 7/8 |

## Apontamentos

1. **Aplicar intervalo inválido durante uma consulta deixa o carregamento ativo indefinidamente** — `apps/web/src/app/features/expenses/accounts-page.component.ts:389`  
   Critério violado: `specs/7-visualizacao-filtros-despesas/spec.md:90`, CA11: “com identificação de seleção e carregamento”.  
   Evidência: `loadPage()` define `loading=true` na linha 281. Se o usuário aplicar um intervalo inválido antes da resposta, `showInvalidFilters()` incrementa `tabVersion` e limpa os resultados, mas não encerra o carregamento. A resposta pendente é então ignorada pelos guards das linhas 284/292, sem alcançar `loading=false`. A tela continua anunciando “Carregando despesas...” mesmo após a consulta terminar. Os testes de intervalos inválidos concluem a consulta inicial antes da validação (`accounts-page.component.spec.ts:327`), portanto os 17/361 testes executados pelo orquestrador não cobrem esse cenário.
