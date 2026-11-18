# Parecer de Código — Tarefa 6

**Veredito:** APROVADO

Base do diff: `6dcc15d` → working tree (sem commit), restrito a `apps/api`, `apps/web` e `specs/8-relatorios-graficos-gastos`. Revisão somente leitura: nenhum arquivo foi criado, alterado ou removido.

## Verificação das 6 correções aceitas na rodada 1

| # | Correção aceita | Situação | Evidência |
| --- | --- | --- | --- |
| 1 | Harness temporário `report-pdf-visual.fixture.spec.ts` (log do PDF em base64) | **real** | arquivo ausente da árvore e do diff (`*fixture*` em `apps/web/src` → vazio); nenhum `console.log` em `features/reports/*.ts` |
| 2 | JUnit de exclusão lógica no detalhamento individual | **real** | `ExpenseRepositoryTest.activeExpenseDetailQueryExcludesSoftDeletedExpensesAndMatchesTheAuthorizedConsolidation` (`:159-201`) — `@DataJpaTest` com PostgreSQL real, persiste despesa com `deletedAt` e prova que não sai em `findActiveByProjectAndOwner`; executado: 5/5 verdes |
| 3 | Teste do arquivo único provando anexo e ordem do apêndice | **real** | `report-visual-export.service.spec.ts:48-69` compara `getPageCount()` com *folhas capturadas + 2 páginas do apêndice* e confere tamanho de página **por posição** (visual antes, apêndice depois); remover `load`+`copyPages` quebra o teste |
| 4 | Teste que lia `@Transactional` por reflexão | **real** | nenhum `getAnnotation`/`getMethod` nos testes de relatório; substituído por `ReportServiceTest:182-210` (comportamento + `verify(...times(1))`) |
| 5 | `exportPdf` morto no `ReportService` Angular | **real** | `report.service.ts` expõe só `get` e `exportSnapshot`; `exportPdf`/`reports/pdf` em `apps/web/src` aparece apenas como handler da página (`reports-page.component.ts:86`) |
| 6 | Duplicação da aquisição do snapshot no backend | **real** | `ReportService.authorizedSnapshot:63-69`, consumido por `exportPdf:49-53` e `exportSnapshot:55-61`; `verifyNoInteractions` em `ReportServiceTest:204-210` |

## Apontamentos (bloqueiam)

**Nenhum.** O código novo respeita a régua: controller magro sem repositório injetado (`ReportController:34-38`), DTO como record (`ReportExportDTO`), componente sem `HttpClient` e HTTP concentrado em `core/services/report.service.ts`, `inject()`/signals/`@if`/`@for` exclusivos, sem segredo nem URL de ambiente no código, sem falha engolida (só o abandono intencional vira `null`, e o chamador o distingue), e os testes novos verificam comportamento observável — inclusive o caminho de paginação/`splitChart` (45 categorias em `report-visual-export.service.spec.ts:71-78`) e o descarte em cada fronteira assíncrona.

## Sugestões (não bloqueiam)

Mantenho aqui a classificação da rodada 1 (sugestões não promovidas pelo autor); sinalizo onde a régua deste revisor seria mais dura.

1. **Orçamento de CSS a 0,29 kB do erro** — `apps/web/src/app/features/reports/report-presentation.component.css:1` (7,71 kB contra `maximumWarning` 4 kB e `maximumError` 8 kB em `apps/web/angular.json`). O build passa e os limites não foram afrouxados (correto), mas qualquer estilo novo na apresentação quebra o build. Prejuízo: a próxima tarefa que tocar essa tela não tem folga nenhuma.
2. **Valores de design reescritos em TypeScript** — `report-visual-export.service.ts:31` (`841.89`/`595.28`), `:46` (`1320px`), `:63` e `:89` (`#f8fafc`), `:157` (`padding:22px 23px;margin-bottom:22px`). Pela régua deste revisor isso é "duplicação de regra que já existe no repo" (reprova); mantenho como sugestão porque já foi classificada assim e não promovida. Prejuízo: mudar token de cor/espaçamento diverge o PDF da tela sem nenhum teste falhar.
3. **Paginação acoplada a classes de apresentação com `!`** — `report-visual-export.service.ts:107` (`block.classList.contains('charts')`), `:120-121` (`querySelector('tbody')!`, `.detail-note!`), `:145-146`. Prejuízo: renomear uma classe virará `TypeError` em produção; hoje os specs pegam (falham por contagem de linhas), então é dívida, não risco aberto.
4. **Asserção de `Blob` que não pode falhar** — `reports-page.component.spec.ts:185` (`toEqual(new Blob([...]))`; `Blob` não tem propriedades enumeráveis). Prejuízo: o teste fica verde mesmo se o download receber outro conteúdo; verificar `instanceof`/`size`/identidade.
5. **`ReportExport` fora de `core/models/`** — `report.service.ts:7-11`. `docs/architecture.md` §1 reserva `core/models/` para "interfaces e types TypeScript (espelho dos DTOs)"; é a única interface de contrato dentro de `core/services`.
6. **Isolamento `REPEATABLE_READ` sem prova de comportamento** — `apps/api/src/main/java/com/obracerta/service/ReportService.java:55`. A correção 4 removeu o teste acoplado (certo), mas nada prova a consistência do snapshot; o teste de repositório garante apenas que o conjunto ativo é o mesmo. Sugestão: teste de integração de concorrência ou registrar explicitamente a limitação.
7. **PDFBox + base64 dentro da transação** — `ReportService.java:55-60`. A conexão e o snapshot ficam abertos durante a composição do apêndice, e o JSON carrega o PDF inteiro (~33% maior). Prejuízo: transação longa e payload grande em obra com muitas despesas.
8. **Composição não é lazy; só as bibliotecas são** — `report-visual-export.service.ts` entra no bundle inicial porque `/relatorios` é rota eager (`app.routes.ts` usa `component:`); confirmei no artefato: `report-export-sheet` está em `main-TAIR6P5X.js` (595,56 kB) e `pdf-lib`/`html-to-image` nos chunks lazy (438,60 kB e 14,54 kB). A proposta pedia "as novas bibliotecas **e a composição**" sob demanda.
9. **Restos de estilo na página** — `reports-page.component.css:1-3`: `:host`, `*{box-sizing}` e `h1,h2,p` repetidos na apresentação, e `.positive` (`:2`) órfão no template da página.
10. **Estilo herdado da tarefa 4** — `ReportController.java:35-37` usa nomes totalmente qualificados no corpo; `ReportExportDTO.java:3` tem javadoc em inglês, único no pacote.
11. **Ganchos de teste sem uso** — `report-presentation.component.html:3` (`report-export-heading`) e `report-visual-export.service.ts:88` (`report-export-sheet`) não são consultados por nenhum spec.

## Observações fora do escopo deste diff

- `apps/web/tarefa6-audit.json` continua como arquivo não rastreado na árvore; não entra no diff, mas tende a vazar para o commit.
- `docs/architecture.md` §6.3 segue documentando apenas `GET /api/projects/{id}/reports/pdf`; a rota interna `GET .../reports/export` não está registrada lá (e o arquivo está sujo por alterações da US15, de outra issue) — formalizar no fechamento.
- A "Validação visual" da tarefa (renderizar e inspecionar o PDF inteiro em desktop e 360 px) não está registrada no diff: `reviews/tarefa-06-validacao-r1.md` cobre aceite, dependências, RED e ambiente, não a inspeção do PDF. E o único teste automatizado da captura usa runtime falso (`REPORT_PDF_RUNTIME`), então a renderização real de rosca/barras/cores continua sem prova empírica versionada. Não é defeito de código; é confirmação pendente de quem validar o CA11.
- O aviso de bundle inicial (757,09 kB contra 500 kB) não é atribuível às bibliotecas novas: ambas estão em chunks lazy e `main` sozinho já tem 595,56 kB.
- `reports-page.component.html:10` usa `class="pdf-notice"` sem regra correspondente no CSS da página — pré-existente, o diff não tocou.

## O que eu executei

- `git status --porcelain`, `git log --oneline -5`, `git rev-parse HEAD` — confirmou base `6dcc15d`, 22 arquivos staged da tarefa e os resíduos fora de escopo (`docs/*`, `specs/09-*`, `.agents/skills/*`, `apps/web/tarefa6-audit.json`).
- `git diff --stat 6dcc15d -- apps/api apps/web specs/8-relatorios-graficos-gastos` → 26 arquivos, +949/−199.
- `git diff 6dcc15d -- apps/api`, `-- apps/web/package.json apps/web/src/app/core/services`, `-- .../reports-page.component.{html,css,spec.ts}`, `-- specs/.../spec.md specs/.../plan.md` — lidos integralmente; inspeção direta de `report-visual-export.service.ts`, `report-presentation.model.ts`, `report-presentation.component.{ts,html,css}`, `report.service.ts`, `report.model.ts`, `app.routes.ts`, `angular.json` (budgets e ausência de `include`).
- **Backend, executado por mim** em `apps/api` com `SPRING_PROFILES_ACTIVE=test` e `SPRING_DATASOURCE_*` da porta 55440 (`Test-NetConnection 127.0.0.1:55440` → disponível): `.\mvnw.cmd test '-Dtest=ReportPdfServiceTest,ReportServiceTest,ReportControllerTest,ExpenseRepositoryTest'` → **Tests run: 24, Failures: 0, Errors: 0, BUILD SUCCESS** (ReportControllerTest 5, ExpenseRepositoryTest 5 com PostgreSQL real e Flyway, ReportPdfServiceTest 5, ReportServiceTest 9).
- **Frontend, tentado e bloqueado**: `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=...` → `× Building... [FAILED: spawn EPERM]` (sandbox sem `danger-full-access`, e este subagente não pode ampliar permissão). Usei o resultado do orquestrador em `task6-r2-web.log`: 37/37 SUCCESS, com os três specs da tarefa no bundle (`reports-page.component.spec`, `report-visual-export.service.spec`, `report.service.spec`). Conferi a contagem (18 + 11 + 5 + 3 = 37) para garantir que nenhum spec foi silenciosamente excluído.
- **Build, tentado e bloqueado** pelo mesmo motivo; usei `task6-r2-build.log`: saída 0, `report-presentation.component.css` 7,71 kB, `angular.json` intocado (`git status -- apps/web/angular.json` vazio), bundles lazy de 438,60 kB e 14,54 kB, e `main` de 595,56 kB. Confirmei no artefato gerado que `report-export-sheet` está em `main-*.js` e que `pdf-lib` não está.
- Verificações de sanidade: `Get-ChildItem -Filter *fixture*` (vazio), `grep` por `exportPdf|reports/pdf`, `getAnnotation|getMethod` e `console.log|: any` (nenhum achado relevante), `html-to-image` 1.11.13 com `getFontEmbedCSS` e `pdf-lib` 1.17.1 resolvidos em `node_modules`, lockfile com 6 pacotes novos e versões exatas.
