# Validação — ajuste de carregamento, rodada 2

Correção autorizada pelo autor com “Aceitar e corrigir”, conforme `ajuste-carregamento-decisoes-r1.md`. Este ciclo não reabre a Tarefa 10 nem acrescenta tarefa ao plano. Os pareceres da rodada 1 permanecem preservados.

## Alteração

A estrutura desktop da tabela e seus oito cabeçalhos permanecem montados durante consultas da mesma obra. As linhas e os cards mobile mantêm identidade por posição; os conteúdos de cada célula, os valores e as ações são substituídos por placeholders. No mobile, os rótulos de categoria, fornecedor, compra, vencimento, valor e situação continuam disponíveis. Links individuais antigos são removidos durante a atualização.

Somente quantidade e medidas numéricas dos registros e das colunas são preservadas. Os signals continuam sendo limpos com `expenses=[]`, `totals=null` e contagem de resultados indisponível durante o GET. Não há cópia de resposta anterior, cache, atraso artificial nem mudança em API, serviços ou regras financeiras. Os guards de consulta, contexto e destruição permanecem intactos.

O status de carregamento fica localizado; os placeholders decorativos possuem `aria-hidden`, enquanto o painel mantém `aria-busy` e a indicação textual de que os dados estão indisponíveis durante a atualização. Falhas mantêm o comportamento existente de erro e tentativa manual.

## TDD

Teste alterado antes do código: `accounts-page.component.spec.ts`, nos cenários com iframe real de 360 e 1280 px. O contêiner do iframe usa `overflow-y:auto`, reproduzindo a rolagem do main layout. Cada GET pendente exige identidade estrita da tabela, cabeçalhos e registros, alturas estáveis, placeholders em cada registro e ausência de links e valores antigos. As ações cobrem Todas → Pendentes → Pagas, filtros, ordenação e paginação, preservando as verificações anteriores de contexto e acessibilidade.

Execução centralizada pelo orquestrador, em `apps/web`:

`npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts --include=src/app/features/expenses/accounts-context.spec.ts`

- RED confirmado pelo orquestrador: 2 falhas e 38 sucessos. Os dois viewports falharam porque tabela, oito cabeçalhos e dois registros desapareciam durante o GET. Log: `apps/web/ajuste-carregamento-r2-red.log`.
- GREEN direcionado confirmado pelo orquestrador na primeira execução após a correção: 40 testes aprovados. Log: `apps/web/ajuste-carregamento-r2-green.log`.
- Suíte completa: `npm test -- --watch=false --browsers=ChromeHeadless`, 388 testes aprovados. Log: `apps/web/ajuste-carregamento-r2-suite.log`.
- Build: `npm run build`, concluído com exit 0. Bundle inicial de 712,66 kB, com aviso de orçamento de 500 kB já existente antes destes ajustes. Log: `apps/web/ajuste-carregamento-r2-build.log`.
- Inspeção na aplicação real autenticada: sequência Todas → Pendentes → Pagas → Todas e aplicar filtros. Na transição para Pendentes e ao aplicar filtros, a árvore de acessibilidade manteve tabela, cabeçalhos e células; apenas seus conteúdos foram substituídos. Pagas apresentou estado vazio após resposta válida. Em viewport mobile de 390 × 844, o card e seus rótulos também permaneceram na transição para Pendentes. Viewport temporário restaurado ao final.
- O servidor local foi reiniciado sem HMR para conferir a versão atual. A nova aba autenticada foi confirmada com `aria-busy="false"` nos totalizadores antes da navegação. Não foi feita nova autenticação pelo agente nem utilizado o token fornecido no relato.
- Capturas finais: `C:/Users/panic/.codex/visualizations/2026/11/01/01a197bc-9457-7830-aa6a-145e3d03f45a/contas-carregamento-desktop.jpg` e `contas-carregamento-mobile.jpg`, no mesmo diretório. As capturas documentam o estado final; as verificações durante HTTP pendente estão nos testes.

## Limites

Arquivos alterados nesta rodada: componente, seu teste e este registro. `accounts-context.spec.ts` continua coberto pela execução direcionada e não exigiu alteração nesta rodada. Nenhuma mudança em spec, plano, pareceres anteriores, API, serviços, rotas, index, stage ou commit.
