# Auditoria Final — Issue #7

**Veredito:** NÃO PRONTO

A implementação da US05 atende aos 11 critérios examinados. O PR permanece bloqueado por uma regressão introduzida na configuração HTTP e pela presença da entrega US04 no diff contra `develop`.

**Recorte auditado:** `git diff 667a4ff5cff6f7e7714679f25d5dd4f648c56050 92ce54998a31ea3bf2025f67658d3b2494cbb53e` — 190 arquivos. A régua foi a spec original aprovada, incluindo fora de escopo, abandono e premissas; o plano não foi usado como critério de aceite.

## Critérios de aceite da spec

| # | Critério | Situação | Evidência (arquivo:linha / teste) |
| --- | --- | --- | --- |
| CA1 | Listagem real, até 15 registros, campos, detalhes, cadastro e pagas sem pagamento vinculado | Atendido | `ExpenseService.java:283–284`; `accounts-page.component.ts:25`, `:187`, `:219`; `ExpenseListingIntegrationTest.returnsOnlyActiveOwnedExpensesInPagesOfAtMostFifteenIncludingPaidWithoutPendingPayment`; `accounts-page.component.spec.ts:87`, `:206` |
| CA2 | Quatro abas, referência única da API e regras de vencimento | Atendido | `ExpenseRepository.java:18`; `ExpenseService.java:262`; `accounts-page.component.ts:306`, `:391`; `ExpenseSituationListingIntegrationTest.appliesAllSituationSlicesUsingOneApiReferenceDate`; `accounts-page.component.spec.ts:22` |
| CA3 | Totais do conjunto completo, soma correta e BRL | Atendido | `ExpenseService.java:265–268`; `accounts-page.component.ts:31–54`; `ExpenseTotalsListingIntegrationTest.totalsCoverAllPagesAndRespectEachTabWithExactDecimalAmounts`; `accounts-page.component.spec.ts:51` |
| CA4 | Filtros inclusivos combinados, categorias, fornecedor autorizado e limpeza | Atendido | `ExpenseRepository.java:18`; `ExpenseService.java:256–260`; `accounts-page.component.ts:445–464`; `ExpenseFilterListingIntegrationTest`; `accounts-page.component.spec.ts:576` |
| CA5 | Quatro ordenações antes da página e desempate estável | Atendido | `ExpenseService.java:263–264`, `:306–313`; `accounts-page.component.ts:414–419`; `ExpenseSortListingIntegrationTest.ordersWholeFilteredSetBeforePaginationWithStableIdTiesAndInvariantTotals`; `accounts-page.component.spec.ts:619` |
| CA6 | Estados vazios distintos, orientação, totais zerados e limpeza | Atendido | `accounts-page.component.ts:151–166`, `:473`; `ExpenseTotalsListingIntegrationTest.emptySetReturnsZeroTotalsAndUnauthorizedProjectsExposeNone`; `accounts-page.component.spec.ts:131`, `:154` |
| CA7 | Intervalos inválidos bloqueados na tela e API, sem resultados antigos | Atendido | `ExpenseService.java:271–303`; `accounts-page.component.ts:283–290`, `:477–485`; `ExpenseFilterListingIntegrationTest.rejectsInvalidParametersWithApiErrorContract`; `accounts-page.component.spec.ts:505`, `:533` |
| CA8 | Isolamento, exclusão lógica e consulta sem efeitos financeiros/storage | Atendido | `ExpenseService.java:254–255`; `ExpenseRepository.java:18`; `ExpenseListingIntegrationTest.repeatedListingIsReadOnlyAndIsolatedWithoutAccessingReceiptStorage`, `doesNotExposeMissingDeletedOrForeignProjects` |
| CA9 | Troca de obra, A → B → A, concorrência e ausência de obra | Atendido | `accounts-page.component.ts:324–353`, `:375`, `:384`; `accounts-context.spec.ts:41`, `:54`, `:64`, `:76`, `:116`, `:132` |
| CA10 | Erro, retry manual, 401, abandono e retorno com nova consulta | Atendido | `accounts-page.component.ts:142–145`, `:367–387`; `accounts-context.spec.ts:144`, `:170`, `:182`; `accounts-return-navigation.spec.ts:35`; `accounts-navigation.spec.ts:55` |
| CA11 | Desktop/mobile, seleção, filtros, ações e carregamento | Atendido | `accounts-page.component.ts:63–135`, `:320–322`, `:354–365`; `accounts-page.component.spec.ts:206`, `:485`; registros `ajuste-layout-validacao.md`, `ajuste-carregamento-conformidade-r2.md` e `ajuste-voltar-cadastro-validacao.md` |

## Pendências que bloqueiam o PR

1. **Regressão no progresso de upload dos comprovantes.**  
   `apps/web/src/app/app.config.ts` introduz `withFetch()` globalmente. O Angular instalado documenta em `@angular/common/types/_module-chunk.d.ts`, na declaração de `HttpEventType.UploadProgress`, que `FetchBackend` não suporta progresso de upload. Entretanto, o cadastro continua dependendo desse evento em `expense-form.component.ts:241–242` e mostra percentual em `expense-form.component.html:140–141`; o detalhe também depende dele em `expense-detail.component.ts:283–284`. Com esse backend, o percentual permanece em zero até a resposta final, contrariando o progresso previsto pela US03 CA3 e por `docs/design-tokens.md`.  
   A inclusão está no diff auditado; o agente principal confirmou sua origem no commit `e1cddbf5e53dd2e099d953071b06c1d2be171938`. É necessário preservar o progresso real dos uploads antes do PR. O achado decorre de análise estática do backend efetivamente configurado; não foi declarado como reprodução interativa.

2. **O PR da Issue #7 ainda inclui a entrega completa da Issue #6.**  
   O diff contra a `develop` remota contém edição/exclusão de despesas, remoção/substituição de comprovantes, `PaymentStatus`, migration V10 e artefatos da US04. A spec #7 declara essa história como dependência já implementada na base; isso explica a composição da branch, mas não torna essas mudanças parte da US05. Não há autorização explícita de PR conjunto #6+#7. É necessário resolver a integração da dependência e conferir novamente o diff destinado ao PR #7. Não foi executada alteração de histórico ou de branch pelo auditor.

## Documentação

- **`docs/prd.md`:** a versão commitada marca US05 como 🟢 Live local, com rastreabilidade e integração pendente, sem afirmar implantação. Adequado ao estágio registrado.
- **`docs/architecture.md`:** a versão commitada acompanha o contrato paginado, filtros, totais, referência temporal, autorização e proteção de contexto. Também documenta separadamente a US04 acumulada.
- **`specs/README.md`:** registra US05 implementada localmente, com auditoria e integração pendentes. Após este parecer, deve manter rastreável o veredito NÃO PRONTO e seus bloqueios.
- **Premissas e abandono:** a seção “Assume que” não declara dívida; não há obrigação de `TODO #issue` decorrente dela. Os cenários de abandono estão cobertos pelos testes de contexto e navegação.
- **Fora de escopo:** não foram encontrados catálogo global US15, busca livre, banner de sete dias ou quitação rápida funcional na listagem. O botão “Marcar como Pago” está desabilitado e sem handler, conforme pedido explícito registrado. As mutações US04 acumuladas permanecem no bloqueio de escopo acima.
- Alterações externas da worktree relativas à US15 não foram usadas como documentação desta entrega.

## Validação e limites

Execuções centralizadas pelo agente principal, sem repetição concorrente pelo auditor:

- **API completa:** 306 testes, zero falhas, zero erros e zero ignorados; `BUILD SUCCESS`. Log: `apps/api/target/auditoria-us05-api-full.log`.
- **Frontend completo:** 390 testes aprovados. Log conferido: `apps/web/ajuste-voltar-cadastro-green.log`.
- **Build frontend:** exit 0; bundle inicial de 713,48 kB, com aviso de orçamento de 500 kB registrado como preexistente.
- QA autenticada desktop/mobile consta nos registros de validação; não foi repetida pessoalmente nesta auditoria. Safari não foi validado.

As suítes aprovadas não eliminam a incompatibilidade entre `withFetch()` e os eventos de progresso usados pelos uploads.

## Matéria-prima para a seção “O que este PR faz e por quê”

- Consulta despesas reais da obra autorizada, com páginas de até 15 registros e acesso ao cadastro e aos detalhes.
- Aplica abas, períodos inclusivos, categorias, fornecedor e ordenação estável antes da paginação.
- Calcula totais financeiros sobre todo o conjunto filtrado, independentemente da página.
- Descarta respostas obsoletas e oferece tentativa manual sem apresentar valores anteriores como atuais.
- Adapta a listagem para desktop/mobile, com carregamento identificado e preservação da estrutura visual.
