# Parecer de Conformidade — Tarefa 6 (US06, Issue #8)

**Veredito: REPROVADO** — a implementação cobre o CA11 na prática, mas há 3 apontamentos bloqueantes (1 artefato temporário commitado, 1 teste JUnit exigido pela tarefa que não existe e 1 asserção que não prova o que o próprio teste diz provar).

Base do diff: `6dcc15d`. Revisão somente leitura — nenhum arquivo foi alterado.

## Critérios verificados

| Critério (da spec / tarefa) | Situação | Onde |
| --- | --- | --- |
| CA11 — composição visual (indicadores, rosca, barras, resumo, detalhamento) antes do detalhamento individual | atendido | `report-presentation.component.html:1-72`; `report-visual-export.service.ts:59-75` |
| CA11 — apresentação reutilizada entre tela e exportação, sem duplicar fórmulas | atendido | `report-presentation.model.ts:1-63`; `reports-page.component.html:21`; `reports-page.component.ts:18` |
| CA11 — todas as categorias / todo o histórico, sem alterar a seleção da tela | atendido | `report-presentation.model.ts:7`; `reports-page.component.spec.ts:172-186` |
| CA11 — composição desktop mesmo acionado no celular | atendido | `report-presentation.component.css:3` (`:host.export-mode{width:1320px}` + media queries presas a `:not(.export-mode)`) |
| CA11 — sem navegação/controles interativos | atendido | `report-visual-export.service.spec.ts:43` |
| CA11 — paginação legível, sem cortar conteúdo | atendido | `report-visual-export.service.ts:84-150`; `report-visual-export.service.spec.ts:48-55` |
| CA11 — detalhamento individual anexado ao MESMO arquivo, depois do visual | **não provado por teste** | `report-visual-export.service.spec.ts:38-39` (apontamento 3) |
| CA3 — identificação, orçado, realizado, pago, a pagar, balanço, lista e data; nome `relatorio-{obra}-{data}.pdf`; apenas uma mensagem de erro | atendido | `ReportPdfService.java:39-63`; `ReportPdfServiceTest.java:53-67`; `reports-page.component.spec.ts:116-124` |
| CA3 — apêndice sem repetir o consolidado por categoria | atendido | `ReportPdfService.java:49-56`; `ReportPdfServiceTest.java:65` |
| CA4 — obra vazia exportável | atendido | `report-visual-export.service.spec.ts:57-61`; `ReportPdfServiceTest.java:69-75` |
| CA5 — obra alheia responde 404 também no novo contrato | atendido | `ReportControllerTest.java:53-62`; `ReportServiceTest.java:201-207` |
| CA6 — exclusão lógica ignorada no PDF/apêndice | implementado, **não provado por teste** | `ExpenseRepository.java:59-69` (apontamento 2) |
| Abandono — sair/trocar de obra descarta, inclusive A→B→A; retorno não reexporta | atendido | `reports-page.component.ts:93-116`; `reports-page.component.spec.ts:126-163,203-225`; `report-visual-export.service.spec.ts:63-101` |
| Prevenção de clique duplicado | atendido | `reports-page.component.ts:88`; `reports-page.component.spec.ts:90-114` |
| Sem diálogo de impressão, sem seletor de formato, download direto no botão existente | atendido | `reports-page.component.ts:104-114` |
| Bibliotecas fixadas e carregamento sob demanda; sem mexer nos limites de build | atendido | `package.json:36-37` (versões exatas); `report-visual-export.service.ts:14-20`; `angular.json` intocado |
| Arquivos previstos no plano da tarefa | **não atendido** | `report-pdf-visual.fixture.spec.ts` (apontamento 1) |

---

## Apontamentos bloqueantes

**1. Harness temporário de QA visual commitado no repositório, fora dos arquivos previstos e rodando na suíte normal**
`apps/web/src/app/features/reports/report-pdf-visual.fixture.spec.ts:1` — `// Temporary synthetic visual QA harness. Remove after PDFs have been recovered.` — arquivo novo e **staged** (aparece como `A` no `git status`).
Evidência adicional: `:52-54` faz `console.log` do PDF inteiro em base64 (`QA_PDF:...:END_QA_PDF`) a cada execução, e `:55` eleva o timeout do teste para 60 s.
Critério violado: plan.md, Tarefa 6 → *“Arquivos previstos: `apps/web/package.json` e lockfile; página de relatórios, apresentação compartilhada e testes; serviço local de captura/composição e testes; serviço HTTP de relatórios e testes; controlador/serviços de relatórios PDF e testes Java correspondentes.”* — este arquivo não está na lista e o próprio cabeçalho pede remoção.
O que falta: remover o arquivo do commit (ou movê-lo para fora da árvore versionada) antes do PR. Ele é capturado pelo `--include=src/app/features/reports/**/*.spec.ts` do comando de teste da issue e polui/infla a suíte.

**2. Falta o teste JUnit de exclusão lógica exigido pela tarefa para o detalhamento individual (CA6)**
Critério violado: plan.md, Tarefa 6 → *“Teste primeiro: JUnit para apêndice autorizado sem repetição do consolidado, informações obrigatórias de quitação/data/nome, obra vazia, 404 **e exclusão lógica**”*; e **CA6 — Exclusão lógica:** *“ignorar despesas excluídas nos gráficos e no PDF”*.
Evidência: a lista individual do PDF/apêndice vem de `findActiveByProjectAndOwner` (`apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:59-69`, usada em `ReportService.java:55`). Nenhum teste executa essa consulta: `ReportServiceTest.java:182-199` mocka o repositório; o único teste que persiste despesa apagada e verifica query de relatório é `ExpenseRepositoryTest.java:131` (`ownerReportQueryExcludesDeletedExpensesAndExpensesFromAnotherOwner`), que cobre `sumActiveByCategoryAndOwner`, não a consulta do detalhamento.
O que falta: um teste de repositório (ou de serviço com repositório real) provando que despesa com `deletedAt` não aparece em `findActiveByProjectAndOwner`, inclusive para o `exportSnapshot`. A implementação aparenta estar correta (`e.deletedAt is null`), mas o critério fica sem prova.

**3. O teste de “arquivo único com o detalhamento individual anexado” não prova que o apêndice entrou no PDF**
`apps/web/src/app/features/reports/report-visual-export.service.spec.ts:38-39`
Evidência: `const pdf = await PDFDocument.load(...); expect(pdf.getPageCount()).toBeGreaterThan(1);` — para a massa daquele teste a própria paginação visual já gera 2 folhas (cabeçalho + indicadores + gráficos + resumo numa, tabela na seguinte), então o teste continua verde se as linhas `report-visual-export.service.ts:72-74` (load + copyPages do apêndice) forem removidas. O apêndice criado em `:15` (`'Expense appendix'`) nunca é procurado no resultado, e nada verifica que as páginas do apêndice venham **depois** das visuais.
Critério violado: **CA11** — *“... seguida da lista individual de despesas ativas”*; **Decisão 3 do autor** (spec.md:58) — *“Aproveitar a página visual ... nas primeiras páginas do PDF e manter a lista individual de despesas nas seguintes”*; e plan.md, Tarefa 6 → *“montagem de arquivo único, paginação e nome”*.
O que falta: asserção de conteúdo/ordem — p.ex. extrair o texto da última página e conferir a despesa do apêndice, ou comparar `getPageCount()` com `folhas capturadas + páginas do apêndice`.

---

## Sugestões (não bloqueantes)

1. `apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:195` verifica apenas `page.isUnpaged()` para o `exportSnapshot`, enquanto o teste equivalente de `exportPdf` (`:39`) também exige ordenação por `id`. A ordem da lista individual (por `purchaseDate`,`id`) fica sem prova no novo contrato — o PDF depende dela para ser determinístico.
2. `reports-page.component.ts:6` importa `ReportVisualExportService` estaticamente, então o serviço de composição (183 linhas) entra no bundle inicial; só as bibliotecas são lazy (`report-visual-export.service.ts:17`). A proposta aprovada (`proposta-pdf-visual.md:26`) pede que *“as novas bibliotecas **e a composição** sejam carregadas apenas para exportar”*. O limite de build não foi alterado, então não há quebra — mas a divergência de estratégia existe.
3. Não há registro da “Validação visual” exigida pela tarefa (renderizar e inspecionar o PDF inteiro, comparando gráficos/cores/valores, em desktop e 360 px) em `specs/8-relatorios-graficos-gastos/reviews/tarefa-06-validacao-r1.md`. O harness do apontamento 1 sugere que os PDFs foram gerados, mas o passo não está documentado.
4. `apps/web/tarefa6-audit.json` permanece como arquivo não rastreado na árvore de trabalho (não entra no diff revisado, mas é resíduo da execução e tende a vazar para o commit).
5. `report-visual-export.service.ts:152-166`: ao dividir o painel de distribuição entre folhas, o gráfico de rosca é clonado inteiro em cada pedaço (`chunk` remove apenas `.distribution-item`), repetindo o mesmo desenho em páginas consecutivas. Não contraria a spec, mas gera repetição visual no PDF.

---

## O que eu executei

- `git diff 6dcc15d --stat -- apps/api apps/web specs/8-relatorios-graficos-gastos` → 26 arquivos, +915/−176.
- `git diff 6dcc15d -- apps/api` (backend completo), `-- apps/web/src/app/core ...`, `-- .../report-visual-export.service.ts ...`, `-- .../report-presentation.component.*`, `-- .../reports-page.component.*`, `-- .../report-visual-export.service.spec.ts .../report-pdf-visual.fixture.spec.ts`, `-- .../reports-page.component.spec.ts`, `-- specs/.../plan.md specs/.../spec.md` — lidos integralmente.
- `git status --porcelain --untracked-files=all -- apps/api apps/web` → 22 arquivos staged, incluindo o harness temporário; `apps/web/tarefa6-audit.json` não rastreado.
- Leitura direta de `ReportService.java`, `ReportPdfService.java`, `ReportController.java`, `ReportServiceTest.java`, `ReportControllerTest.java`, `ReportPdfServiceTest.java`, `ExpenseRepository.java`, `ExpenseRepositoryTest.java`, `report-visual-export.service.ts`, `reports-page.component.{ts,html,css}`, `report-presentation.*` e specs.
- **Testes não executados**: a camada de permissões deste ambiente negou `docker`, `.\mvnw.cmd`, `mvn`, `npx.cmd`, `npm.cmd` e `node` (`Permission denied: shell`); `npm test` está liberado, mas falha antes de rodar porque a política do PowerShell bloqueia `npm.ps1` (`about_Execution_Policies`). Portanto não houve verificação dinâmica — o parecer acima é estático. O comando de execução precisa ser repetido por quem tem o shell liberado: o backend com `-Dtest=ReportControllerTest,ReportServiceTest,ReportPdfServiceTest,ExpenseRepositoryTest,ProjectRepositoryTest,ProjectLifecycleTest` e o frontend com o `--include` da issue (atenção: esse `--include` passa a arrastar o arquivo do apontamento 1).
