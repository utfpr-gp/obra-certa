# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

Base do diff: `6dcc15d` → working tree/index, restrito a `apps/api`, `apps/web` e `specs/8-relatorios-graficos-gastos`. Revisão somente leitura: nenhum arquivo foi criado, alterado ou removido por mim.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA11 — composição visual (indicadores, rosca, barras, resumo e detalhamento) antes da lista individual | atendido | `report-presentation.component.html:3,5-10,12-48,50,52-72`; `report-visual-export.service.ts:48-55` |
| CA11 — captura dos gráficos e do detalhamento na exportação, em resolução legível (2x) | atendido | `report-visual-export.service.ts:63-70`; `report-visual-export.service.spec.ts:26-46` |
| CA11 — arquivo único com o apêndice de despesas **depois** das páginas visuais | atendido | `report-visual-export.service.ts:72-75`; `report-visual-export.service.spec.ts:48-69` |
| CA11 — paginação legível, sem cortar linhas/seções | atendido | `report-visual-export.service.ts:84-150,152-182`; `report-visual-export.service.spec.ts:71-78` |
| CA11 — sem elementos de navegação ou controles interativos | atendido | `report-visual-export.service.spec.ts:43` |
| CA11 — apresentação reutilizada entre tela e exportação, sem duplicar fórmulas | atendido | `report-presentation.model.ts:1-63`; `report-presentation.component.ts:13-15`; `reports-page.component.html:21` |
| CA11 — todo o histórico e todas as categorias, sem alterar a seleção da tela | atendido | `report-visual-export.service.ts:50-53`; `reports-page.component.spec.ts:172-186` |
| CA11 — composição desktop mesmo acionado pelo celular | atendido | `report-presentation.component.css:8-15` (media queries presas a `:host:not(.export-mode)`; `:host.export-mode{width:1320px}`); `report-visual-export.service.spec.ts:31` |
| CA3 — identificação, orçado, realizado, pago, a pagar e lista individual no PDF único; nome `relatorio-{obra}-{data}.pdf` | atendido | `ReportPdfService.java:39-48,57-66`; `ReportPdfServiceTest.java:16-30`; `reports-page.component.spec.ts:90-114` |
| CA3 — apêndice sem repetir o consolidado por categoria | atendido | `ReportPdfService.java:49-56`; `ReportPdfServiceTest.java:53-67` |
| CA3 — em falha, somente uma mensagem, sem retry automático nem ação de tentar novamente | atendido | `reports-page.component.ts:95-99,116-119`; `reports-page.component.spec.ts:116-124,188-201` |
| CA4 — obra sem movimentação exportável (visual + apêndice) | atendido | `ReportPdfServiceTest.java:32-39,69-75`; `report-visual-export.service.spec.ts:80-84`; `reports-page.component.spec.ts:270-287` |
| CA5 — obra alheia responde 404 também no novo contrato | atendido | `ReportController.java:34-38`; `ReportControllerTest.java:52-62`; `ReportServiceTest.java:204-210` |
| CA6 — exclusão lógica ignorada no detalhamento individual/apêndice | atendido | `ExpenseRepositoryTest.java:159-202` |
| Abandono — troca de obra/saída descarta resposta HTTP e composição local, inclusive A→B→A; retorno não reexporta | atendido | `reports-page.component.ts:93-94`; `reports-page.component.spec.ts:126-163,203-225`; `report-visual-export.service.spec.ts:86-126` |
| Prevenção de clique duplicado e estado da tela preservado ao concluir/falhar | atendido | `reports-page.component.ts:88,100-119`; `reports-page.component.spec.ts:90-114,188-201` |
| Download direto pelo botão existente; sem diálogo de impressão nem seletor de formato | atendido | `reports-page.component.html:8`; `reports-page.component.ts:104-114` |
| Bibliotecas fixadas (versões exatas) e carregamento sob demanda; limites de build intocados | atendido | `package.json:36-37`; `package-lock.json` (entradas `html-to-image`/`pdf-lib` + deps); `report-visual-export.service.ts:14-20`; `angular.json` inalterado |
| Migration: nenhuma | atendido | nenhuma `V*__*.sql` no diff |
| Arquivos previstos no plano; harness temporário removido | atendido | diff restrito aos arquivos previstos; `report-pdf-visual.fixture.spec.ts` ausente da árvore e do índice |
| Preservar as regressões existentes da exportação | atendido | `ReportControllerTest.java:35-50` (`GET /reports/pdf` intacto); casos Jasmine de exportação reescritos sob o novo contrato |
| Validação visual do PDF (plan.md, Tarefa 6) | sem evidência registrada no repositório | nenhum registro em `specs/8-relatorios-graficos-gastos/reviews/`; observação 1 |

## Apontamentos

Nenhum apontamento bloqueante. As seis correções aceitas na rodada 1 são reais e não houve regressão observada:

1. Harness `report-pdf-visual.fixture.spec.ts` (log do PDF em base64) removido da árvore e do índice — `git status` não o lista e não há `*fixture*` em `apps/web/src`.
2. Teste JUnit de exclusão lógica do detalhamento existe e usa repositório real: `ExpenseRepositoryTest.java:159-202` persiste despesa com `deletedAt`, despesa de outro dono e prova que `findActiveByProjectAndOwner` devolve só as ativas, com o total batendo com `sumActiveByCategoryAndOwner` e com `totalPaid`/`totalPending`.
3. O teste de arquivo único agora prova anexo e ordem: `report-visual-export.service.spec.ts:48-69` comparara `getPageCount()` com `folhas capturadas + páginas do apêndice` e valida as dimensões (A4 paisagem nas visuais, 300×200 no apêndice) por faixa de páginas.
4. A leitura da anotação `@Transactional` por reflexão desapareceu (`grep` sem ocorrência em `ReportServiceTest.java`); o lugar é ocupado por comportamento observável: `ReportServiceTest.java:181-202` prova que o relatório e o apêndice saem da **mesma** chamada autorizada (`verify(...).times(1)` em `findActiveByProjectAndOwner`, mesmo `report` e mesma lista entregues a `generateAppendix`).
5. `ReportService.exportPdf` (Angular) removido e substituído por `exportSnapshot` (`report.service.ts:7-11,22-24`), com o endpoint `GET /reports/pdf` preservado no servidor e coberto por `ReportControllerTest.java:35-50`.
6. Duplicação da aquisição do snapshot eliminada: `ReportService.java:49-72` centraliza em `authorizedSnapshot`, consumido por `exportPdf` e `exportSnapshot`.

### Observações (não bloqueantes, fora do veredito)

1. **Validação visual sem registro.** O plano pede “renderizar e inspecionar o PDF final inteiro … em desktop e em 360px”, e é justamente o único passo da tarefa sem evidência no repositório (`reviews/tarefa-06-validacao-r1.md` cobre aceite, RED e ambiente, não a inspeção do PDF). O risco é concreto porque os testes de exportação substituem `html-to-image`/`pdf-lib` por spies (`report-visual-export.service.spec.ts:20-22`), então o caminho real DOM→PNG (fontes, SVG da rosca) não é exercitado por teste. Na rodada 1 isso foi sugestão não promovida pelo autor; registro aqui para que a inspeção do arquivo gerado seja feita antes do PR.
2. **Avisos de orçamento de build.** `npm run build` sai 0 e os limites não foram alterados, mas `report-presentation.component.css` está em 7,71 kB (aviso 4 kB, erro 8 kB) e o bundle inicial em 757,09 kB (aviso 500 kB, erro 1 MB) — margem estreita para o CSS caso o arquivo cresça ~4%.
3. **Resíduo de execução não rastreado.** `apps/web/tarefa6-audit.json` (dump de `npm audit --json`, ~127 kB) continua na árvore de trabalho. Não está no diff nem no índice, então não entra no commit por si, mas convém remover antes do PR.
4. **Marcação duplicada durante a exportação.** `report-presentation.component.html:53` (`id="detail-heading"`/`aria-labelledby`) coexiste com a da página enquanto o host de exportação está no `document.body`. Sem efeito visual no PDF; já apontado como sugestão na rodada 1.
5. **Rosca repetida na divisão de folhas.** `report-visual-export.service.ts:152-182` clona o painel de distribuição inteiro por pedaço, mantendo o mesmo desenho da rosca em páginas consecutivas quando o painel não cabe. Não contraria CA11, mas gera repetição visual.

## O que eu executei

- `git status --short`, `git status --porcelain` — confirmei o conjunto staged (26 arquivos da tarefa), a ausência do harness temporário e os resíduos não rastreados (`apps/web/tarefa6-audit.json`, `docs/*`, `specs/09-*`, `.agents/skills/*`).
- `git diff 6dcc15d --stat -- apps/api apps/web specs/8-relatorios-graficos-gastos` → 26 arquivos, +949/−199; `git diff 6dcc15d -- apps/api`, `-- apps/web`, `-- apps/web/package.json apps/web/src/app/core ... css`, `-- specs/8-relatorios-graficos-gastos`, `-- apps/web/package-lock.json` — lidos integralmente.
- Leitura direta dos arquivos do estado final: `ReportService.java`, `ReportController.java`, `ReportPdfService.java`, `ReportExportDTO.java`, `ReportServiceTest.java`, `ReportControllerTest.java`, `ReportPdfServiceTest.java`, `ExpenseRepositoryTest.java`, `report-presentation.component.{ts,html,css}`, `report-presentation.model.ts`, `report-visual-export.service(.spec).ts`, `reports-page.component.{ts,html,css,spec.ts}`, `report.service(.spec).ts`, `report.model.ts`, `angular.json` e os pareceres/decisões da rodada 1.
- **Backend (executado por mim):** em `apps/api`, com `SPRING_PROFILES_ACTIVE=test` e `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` para `127.0.0.1:55440/obracerta_task6_test`, `.\mvnw.cmd test '-Dtest=ReportPdfServiceTest,ReportServiceTest,ReportControllerTest,ExpenseRepositoryTest'` → **24 testes, 0 falhas, 0 erros, BUILD SUCCESS** (`ReportPdfServiceTest` 5, `ReportServiceTest` 9, `ReportControllerTest` 5, `ExpenseRepositoryTest` 5).
- **Frontend (tentado, bloqueado pela política):** em `apps/web`, `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/reports/**/*.spec.ts --include=src/app/core/services/report.service.spec.ts --include=src/app/app.routes.spec.ts` falhou **antes de compilar os testes** com `× Building... [FAILED: spawn EPERM]` — o Angular CLI não consegue criar processo neste sandbox (`workspace-write`), como previsto no despacho; não tentei contornar. Usei o resultado já obtido pelo orquestrador: `task6-r2-web.log` → **37 de 37 SUCCESS**; `task6-r2-build.log` → saída 0, `report-presentation.component.css` em **7,71 kB** (aviso 4 kB / erro 8 kB), bundle inicial 757,09 kB (aviso 500 kB / erro 1 MB) e `angular.json` sem alteração de limites.
- Verificações de apoio: provedor do Postgres em 55440 acessível; lockfile contém `pdf-lib`/`html-to-image` com `integrity` e o `tslib@1.14.1` aninhado exigido por `pdf-lib` (consistente para `npm ci` do CI); `grep` sem `console.log`/`QA_PDF`/`debugger`/`fixture` no diff; `grep` sem `@Transactional` em `ReportServiceTest.java`; `karma.conf.js` inexistente (viewports padrão) e `angular.json` sem `include`; nenhum `*.pdf` versionado além de `apps/api/target/report-fixture.pdf` (artefato de build).
