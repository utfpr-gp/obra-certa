APROVADO

# Parecer de Conformidade — Tarefa 4A

**Veredito:** APROVADO (com a ressalva de execução registrada ao final)

## Critérios verificados

| Critério | Situação | Onde |
| --- | --- | --- |
| CA3 — chave já ativa na obra bloqueia a confirmação sem gravar linha | atendido (preservado da Tarefa 4) | `NfeImportControllerConfirmTest.java:214-229` |
| CA4 — item sem categoria impede a gravação e indica os itens | atendido (preservado da Tarefa 4) | `NfeImportControllerConfirmTest.java:155-167` |
| CA5 (parte de linhas) — N linhas com categoria, `nfe_key`, data de emissão, fornecedor e `budget_id` | atendido (preservado da Tarefa 4) | `NfeImportControllerConfirmTest.java:86-119` |
| Fechamento (1): rota da confirmação é `POST /api/projects/{projectId}/nfe/imports`; `@RequestMapping` da classe inalterado | atendido | `NfeImportController.java:16` (mapeamento da classe, sem alteração no diff) + `NfeImportController.java:27` (`/imports`) |
| Fechamento (2): `ExpenseService.update` resolve orçamento por `ExpenseReferenceResolver.resolveBudget` | atendido | `ExpenseService.java:181`; regra idêntica em `ExpenseReferenceResolver.java:20-22` |

## Verificação detalhada dos itens do despacho

**(a) Rota e mapeamento da classe** — O `@RequestMapping` da classe permanece `"/api/projects/{projectId}/nfe"` (`NfeImportController.java:16`, intocado no diff), e o método de confirmação passou a `@PostMapping(value = "/imports", ...)` (`NfeImportController.java:27`). A rota final exposta é exatamente `/api/projects/{projectId}/nfe/imports`. Atendido.

**(b) Testes de confirmação na rota nova** — `CONFIRM` passou a `"/nfe/imports"` (`NfeImportControllerConfirmTest.java:55`) e o helper monta `multipart("/api/projects/" + projectId + CONFIRM)` (`:239`). Todos os casos de confirmação passam pelo helper, e as asserções de `$.path` usam o mesmo `CONFIRM` (`:162`, `:177`, `:192`). Busca por `/nfe/confirm` em `apps/` não retorna nenhuma ocorrência em código ou teste. Atendido.

**(c) Semântica do update** — Antes: `budgets.findByProjectIdAndCategoryIdAndDeletedAtIsNull(projectId, categoryId).orElse(null)`. Depois: `references.resolveBudget(expense.getProject().getId(), category.getId())` (`ExpenseService.java:181`), e `resolveBudget` executa exatamente a mesma consulta com o mesmo `orElse(null)` (`ExpenseReferenceResolver.java:20-22`). Nenhuma mudança de semântica. Atendido.

**(d) Teste novo de edição** — `trocaDeCategoriaResolveOrcamentoDaNovaCategoriaPelaMesmaRegraDaCriacao` (`ExpensePaymentUpdateIntegrationTest.java:134-155`) muda a categoria via `PUT /api/expenses/{id}` (`:144-148`) e afirma o orçamento persistido: `assertThat(reloaded.getBudget()).isNotNull()` e `assertThat(reloaded.getBudget().getId()).isEqualTo(budgetOutra.getId())` (`:153-154`). Não se limita à descrição. Atendido.

**(e) Escopo** — O diff contra `260413f` toca somente os quatro arquivos previstos. Não há DTO de pagamento, comprovante, XML gravado, upsert de razão social, teste de 404 novo, nem tratamento de `categoryId` malformado ou CNPJ. As sugestões da rodada 2 permanecem explicitamente fora, como o plano manda (`plan.md:78`). Atendido.

## Apontamentos

_Nenhum._

## Sugestões

_Nenhuma._

## Execução de testes

Não rodou. O shell deste revisor recusou a execução dos comandos Maven (`Permission denied: shell`, inclusive para `.\mvnw.cmd -v`), embora `git` esteja liberado. Portanto os itens acima foram verificados por leitura do diff, do código e dos testes; a suíte `NfeImportControllerConfirmTest,NfeImportControllerPreviewTest,NfeKeyGuardTest,ExpenseServiceTest,ExpensePaymentUpdateIntegrationTest` não foi executada nesta revisão.

## Execução do orquestrador

Rodei a suíte citada a partir de `apps/api` com PostgreSQL local (`obracerta_test`): 44 testes, 0 falhas, 0 erros, `BUILD SUCCESS` (`ExpensePaymentUpdateIntegrationTest` 8, `NfeImportControllerConfirmTest` 8, `NfeImportControllerPreviewTest` 8, `ExpenseServiceTest` 12, `NfeKeyGuardTest` 8).
