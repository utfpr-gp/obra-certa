# Parecer de Código — Tarefa 6 (US06, Issue #8)

**Veredito: REPROVADO**

Base do diff: `6dcc15d` → working tree, restrito a `apps/api`, `apps/web` e `specs/8-relatorios-graficos-gastos`.

---

## Apontamentos (bloqueiam)

### 1. Harness temporário de QA commitado como spec, com `console.log` do PDF inteiro em base64
`apps/web/src/app/features/reports/report-pdf-visual.fixture.spec.ts:1` e `:48-55`

```
1: // Temporary synthetic visual QA harness. Remove after PDFs have been recovered.
54: console.log(`QA_PDF:visual-${empty ? 'vazio' : 'categorias'}.pdf:${base64}:END_QA_PDF`);
55: }, 60000);
```

O próprio arquivo declara que deveria ser removido. Ele entra no glob de teste do repositório (`angular.json` não restringe `include`), então roda em **todo** `ng test` e também no comando de testes desta tarefa (`--include=src/app/features/reports/**/*.spec.ts`): gera dois PDFs reais (html-to-image + pdf-lib), com timeout de 60 s cada, e despeja o arquivo inteiro em base64 no log do Karma/CI. A asserção de comportamento é só `getPageCount() > 1` — o valor do teste é o log, não a verificação.

Regra violada: `.agents/rules/utf-rules.md` §4 (teste na camada do comportamento) e o critério deste revisor (“teste acoplado a detalhe/artefato de depuração não pertence à suíte”).

Prejuízo concreto: a suíte fica lenta e ruidosa a cada execução e no CI; o artefato de validação visual fica versionado como se fosse teste de regressão, mas não falha se a composição visual mudar.

Correção esperada: remover o arquivo do repositório. Se a evidência visual precisar ser preservada, ela pertence a `specs/8-relatorios-graficos-gastos/reviews/` (ou a um script fora da suíte), não a um `*.spec.ts`.

---

### 2. Teste de serviço verifica a anotação `@Transactional` por reflexão, não o comportamento
`apps/api/src/test/java/com/obracerta/service/ReportServiceTest.java:196-198` (e `:195`)

```java
var transaction = ReportService.class.getMethod("exportSnapshot", String.class)
        .getAnnotation(org.springframework.transaction.annotation.Transactional.class);
assertThat(transaction.readOnly()).isTrue();
assertThat(transaction.isolation()).isEqualTo(...REPEATABLE_READ);
```

O teste chama-se `...InRepeatableReadTransaction`, mas não prova consistência de snapshot nenhuma: lê metadado da anotação. Também `:195` (`argThat(page -> page.isUnpaged())`) acopla o teste à assinatura do método de repositório.

Regra violada: “teste acoplado a detalhe de implementação, que quebra em qualquer refatoração” (lista de reprovação do revisor) e `docs/architecture.md` §9.2 (unitário de serviço cobre regra; consistência transacional se prova em teste de integração/repositório).

Prejuízo concreto: mover a anotação para a interface/classe, renomear o método ou trocar `Page` por `List` mantém o comportamento e quebra o teste; ao mesmo tempo, remover o `REPEATABLE_READ` **sem** remover o teste não é detectado se alguém só ajustar a asserção. O teste dá confiança falsa justamente sobre o ponto mais delicado da tarefa (mesmo snapshot para relatório e apêndice).

Correção esperada: substituir por asserção de comportamento observável (ex.: teste de integração/repositório que comprove que o consolidado e o apêndice vêm da mesma leitura autorizada) e remover a leitura da anotação.

---

### 3. Código de produção morto: `ReportService.exportPdf` (Angular) sem nenhum chamador
`apps/web/src/app/core/services/report.service.ts:26-30`

Busca no `apps/web/src` mostra que `exportPdf` só é chamado pelo próprio spec (`report.service.spec.ts:34` e `:65`). A página agora usa exclusivamente `exportSnapshot` (`reports-page.component.ts:100`). Sobram, no cliente, dois caminhos de exportação — um deles produz o PDF antigo, sem a composição visual do CA11.

Regra violada: reprovação por “abstração/indireção sem ganho” e por deixar caminho alternativo que contradiz o critério aceito; a própria tarefa pede preservar `GET /reports/pdf` no **servidor**, não um segundo método no cliente.

Prejuízo concreto: quem voltar ao arquivo verá dois métodos de exportação e nenhuma indicação de qual é o oficial; um uso futuro de `exportPdf` regride o CA11 silenciosamente (o teste atual de `exportPdf` continua verde).

Correção esperada: remover o método do serviço Angular e os casos correspondentes em `report.service.spec.ts`, mantendo o endpoint `GET /reports/pdf` na API.

---

### 4. Duplicação integral da aquisição de snapshot entre `exportPdf` e `exportSnapshot`
`apps/api/src/main/java/com/obracerta/service/ReportService.java:42-49` vs `:51-60`

As duas sequências são idênticas: `getReport(projectId)` → `identity.getAuthenticatedUser().getId()` → `expenses.findActiveByProjectAndOwner(projectId, ownerId, Pageable.unpaged(Sort.by("purchaseDate","id")))`.

Regra violada: “duplicação de regra que já existe em outro lugar do repo” (lista de reprovação). Aqui a duplicação é a regra de **qual** conjunto de despesas compõe o relatório autorizado — a mesma que o CA6 e o Anti-IDOR dependem.

Prejuízo concreto: qualquer ajuste futuro (ordenação determinística, novos filtros de exclusão lógica, tratamento de obra sem despesas) feito em um caminho e não no outro faz o PDF legado e o `/export` divergirem — exatamente o risco que a tarefa tentou eliminar ao criar um snapshot único.

Correção esperada: um único método privado que devolva o par autorizado (relatório + despesas ativas) e que ambos os endpoints consumam.

---

## Sugestões (não bloqueiam)

1. **`id` duplicado durante a exportação** — `report-presentation.component.html:52-53` usa `id="detail-heading"`/`aria-labelledby="detail-heading"`. Enquanto o host de exportação existe no `document.body`, há dois elementos com o mesmo `id`; `aria-labelledby` resolve pelo primeiro. Gerar identificador único (ou dispensar o `id` na versão de exportação).
2. **Valores de design repetidos em TypeScript** — `report-visual-export.service.ts:46` (`#f8fafc`, `1320px`), `:89` (`#f8fafc`) e `:157` (`padding:22px 23px;margin-bottom:22px`) reescrevem decisões que já estão no CSS. Quando os tokens mudarem, a exportação diverge da tela sem nenhum teste falhar. Aplicar classe via CSS.
3. **Paginação dependente de classes de apresentação, não dos marcadores `data-pdf-*`** — `report-visual-export.service.ts:104` usa `[data-pdf-block]`, mas `:113-147` e `:152-158` dependem de `.detail-panel`, `tbody tr`, `tfoot`, `.detail-note`, `.bar-label`, `.exceeded-note`, `.distribution-item`, `.comparison-row`, com `querySelector(...)!`. Renomear uma classe de estilo passa a quebrar a exportação com `TypeError` em vez de erro explícito. Uniformizar tudo em atributos `data-pdf-*`.
4. **`ReportExport` mora no serviço HTTP, não em `core/models/`** — `report.service.ts:7` é a única interface de contrato definida dentro de `core/services`; `docs/architecture.md` §1 reserva `core/models/` para “interfaces e types (espelho dos DTOs)”. Mover para `core/models/report.model.ts` mantém o contrato junto dos demais modelos de relatório.
5. **Asserção de Blob que não pode falhar** — `reports-page.component.spec.ts:185`: `expect(...args[0]).toEqual(new Blob(...))`. Dois `Blob` não têm propriedades enumeráveis próprias, então `toEqual` passa para qualquer blob. Verificar `instanceof Blob`, `type` e `size`, ou a identidade do objeto devolvido pelo mock.
6. **PDFBox e base64 dentro da transação `REPEATABLE_READ`** — `ReportService.java:51-59`: a geração do apêndice e a codificação base64 ocorrem com a conexão e o snapshot abertos, e o payload JSON carrega o PDF inteiro em texto. Em obra com muitas despesas isso alonga a transação e duplica o tamanho da resposta. Encerrar a leitura antes da composição e/ou documentar o limite esperado.
7. **DTO com javadoc em inglês, único no pacote** — `model/dto/report/ReportExportDTO.java:3`. Os demais DTOs do projeto não têm comentário; se for manter, escrever em pt-BR conforme o glossário.
8. **Nomes totalmente qualificados no corpo do código** — `ReportService.java:43,47,51,56,58,59` e `ReportController.java:28-30,35-38` (`org.springframework...`, `com.obracerta...`, `java.util.Base64`). O restante do arquivo usa `import`; o trecho novo amplia o padrão ilegível herdado da tarefa 4.
9. **CSS duplicado/órfão na página** — `reports-page.component.css:1-2` mantém `:host`, `h1,h2,p` e `.positive`, que agora pertencem só à apresentação. `.positive` não tem mais uso no template da página.
10. **Sem teste para o `Cache-Control: no-store` novo** — `ReportControllerTest.java:53-62` valida o corpo do `/export`, mas não o header que o controller passou a definir (`ReportController.java:36`). O payload é financeiro; vale travar essa regressão no teste.
11. **Cobertura de exclusão lógica no caminho novo** — o plano pede JUnit de “exclusão lógica” para o apêndice. Os testes novos mockam `expenseRepository` (`ReportServiceTest.java:185`), então o filtro `e.deletedAt is null` (`ExpenseRepository.java:59-65`) não é exercitado a partir de `exportSnapshot`. Um caso de repositório/integração fecharia o cenário.
12. **Orçamento de estilo de componente** — `report-presentation.component.css` é praticamente uma cópia integral do CSS que existia na página e o projeto tem `anyComponentStyle` com erro em 8 kB (`angular.json:45-49`). Como não consegui rodar o build, confirme que `npm run build` continua passando sem afrouxar o limite (o `angular.json` não foi alterado, o que está correto).

---

## Observações fora do escopo deste diff

- `apps/web/tarefa6-audit.json` (untracked) é um dump de `npm audit --json` deixado na pasta do app; não deve entrar no commit.
- `docs/architecture.md` (alterações locais, só US15) continua documentando apenas `GET /api/projects/{id}/reports/pdf` em §6.3; a rota interna `GET .../reports/export` introduzida aqui não está registrada na arquitetura — útil formalizar no fechamento da tarefa.
- `reports-page.component.html:10` usa `class="pdf-notice"` sem regra correspondente no CSS da página — pré-existente, o diff não tocou.

---

## O que eu executei para verificar

Comandos (somente leitura, via git):

- `git status --short` — confirmou o conjunto de arquivos da tarefa e os artefatos fora de escopo (`docs/*`, `specs/09-*`, `.agents/skills/*`, `apps/web/tarefa6-audit.json`).
- `git diff 6dcc15d --stat -- apps/api apps/web specs/8-relatorios-graficos-gastos` — 26 arquivos, +915/−176.
- `git diff 6dcc15d -- apps/api` — controlador, DTO, `ReportService`, `ReportPdfService` e os três testes Java, lidos por inteiro.
- `git diff 6dcc15d -- apps/web` — package/lockfile, `report.service`, `report-presentation.*`, `report-visual-export.service(.spec)`, `report-pdf-visual.fixture.spec`, página e specs.
- `git diff 6dcc15d -- specs/8-relatorios-graficos-gastos/{spec,plan}.md` e `git diff -- docs/architecture.md` — CA11/tarefa 6 e confirmação de que a alteração de arquitetura é US15.

Leituras de apoio: `ReportService.java`, `ReportController.java`, `ReportPdfService.java`, `SecurityConfigurations.java` (rota sob `anyRequest().authenticated()`), `ExpenseRepository.java:59-73` (filtro de posse e exclusão lógica), `ReportControllerTest.java`, `ReportServiceTest.java:181-207`, `reports-page.component.{ts,html,css,spec.ts}`, `report-presentation.*`, `report-visual-export.service.ts`, `report.service.ts`, `active-project.service.ts` (incremento síncrono de `contextVersion`), `report.model.ts`, `angular.json` (budgets e ausência de `include` no teste). Também inspecionei `node_modules/pdf-lib` (`decodeFromBase64DataUri` aceita base64 puro) e `node_modules/html-to-image` (`lib/types` e `getFontEmbedCSS` existem) para validar as APIs usadas.

**Não consegui rodar as suítes nem o build.** O limite de permissões disponível neste subagente aceitou apenas `git status` e `git diff`; `npm.cmd test ...`, `.\mvnw.cmd --version`, `Get-Item` e comandos compostos com `cd ...;` foram recusados com `Permission denied: shell`. Portanto: (a) os pontos 1–4 acima são de leitura estática, não de falha observada em execução; (b) o item 12 da lista de sugestões (orçamento de CSS) e o comportamento real de `npm run build` ficaram **não verificados**; (c) as suítes Java e Jasmine devem ser executadas por quem tiver o terminal liberado antes de qualquer conclusão sobre GREEN.
