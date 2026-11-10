APROVADO

# Parecer de Código — Tarefa 4A

**Escopo avaliado:** `git diff --cached 260413f -- apps/api` (4 arquivos, todos no diff).
**Régua:** `docs/architecture.md` §5.2/§5.2.1, §6 e §9; `utf-rules.md` §4.

## Apontamentos (bloqueiam)

Nenhum. As duas pendências da rodada 2 estão resolvidas na implementação e não encontrei violação de camada, padrão declarado, segredo, erro engolido, abstração de uso único nem duplicação remanescente da regra de orçamento.

## Verificação das pendências da rodada 2

1. **Rota da confirmação — atendida.**
   - `NfeImportController.java:27` — `@PostMapping(value = "/imports", ...)`.
   - `NfeImportController.java:16` — `@RequestMapping("/api/projects/{projectId}/nfe")` **inalterado**.
   - Rota composta: `POST /api/projects/{projectId}/nfe/imports` — coincide com `specs/11-importacao-despesas-nfe/plan.md:8` e com o aceite em `tarefa-04-decisoes-r2.md:5`.
   - `NfeImportControllerConfirmTest.java:55` e `:239` usam a constante `CONFIRM = "/nfe/imports"` nas chamadas **e** nas asserções de `$.path` (`:162`, `:177`, `:192`), então o teste realmente exercita a rota nova. Nenhuma referência a `/nfe/confirm` sobrou no repo (`grep` em `apps/` e `specs/`), e `apps/web` ainda não consome o endpoint (o service é da Tarefa 8) — renomear aqui não quebra cliente.

2. **Duplicação da regra de orçamento — atendida.**
   - `ExpenseService.java:181` (`update`) passou a usar `references.resolveBudget(...)`; a consulta direta a `budgets.findByProjectIdAndCategoryIdAndDeletedAtIsNull` **não existe mais** em `ExpenseService` (create em `:142`, update em `:181`, ambos via resolver).
   - `NfeImportService.java:114` usa o mesmo `references.resolveBudget`.
   - Regra única: `ExpenseReferenceResolver.java:20-22`.
   - As duas ocorrências restantes do repositório em `BudgetService.java:131` e `:155` **não** são a mesma regra: ali o orçamento é carregado para atualizar o teto (`save`/validação de gasto), não para resolver o vínculo `expense.budget_id`. Não é duplicação.

3. **Teste de edição — existe, mas é redundante e frágil (ver sugestões 1 e 2).** Ele passa antes e depois da troca, como esperado de caracterização. Não prova o *refactor* (impossível por teste de comportamento), apenas o comportamento. O problema não é o tipo, é a seleção de dados e a existência de cobertura idêntica anterior.

## Sugestões (não bloqueiam)

1. **`ExpensePaymentUpdateIntegrationTest.java:136` escolhe a segunda categoria sem garantia de que seja outra.** `categories.findAll().get(1)` depende da ordem de retorno sem `ORDER BY` (duas chamadas distintas: `:72` e `:136`). Se a ordem mudar, `outra == category`, o PUT não troca categoria alguma e o teste **passa mesmo assim** — o nome `trocaDeCategoria...` deixa de ser verdade sem ninguém perceber. O próprio repo já tem o padrão seguro em `ExpenseUpdateIntegrationTest.java:52-53` (`filter(c -> !c.getId().equals(category.getId()))`). Há ainda dependência implícita de a tabela ter ≥2 categorias, sem asserção (`NfeImportControllerConfirmTest.java:80` faz essa checagem).

2. **O teste duplica cobertura já existente e está na suíte errada.**
   - `ExpenseUpdateIntegrationTest.java:66-85` já cria orçamento para as duas categorias, troca a categoria e assere `expense.getBudget().getCategory().getId() == destination.getId()` (`:76`) — asserção mais forte que a do teste novo (`:153-154`), porque garante que o vínculo antigo **não** foi preservado.
   - `ExpensePaymentUpdateIntegrationTest` cobre o ciclo de pagamento da US04; um caso de resolução de orçamento na edição pertence a `ExpenseUpdateIntegrationTest`.
   - `plan.md:75` condicionava o teste novo a "se nenhuma suíte existente cobrir esse caminho"; ela cobria. O teste acrescenta tempo de suíte e um terceiro ponto de manutenção sobre o mesmo comportamento.

3. **O nome promete mais do que a asserção entrega.** `...PelaMesmaRegraDaCriacao` não é verificado: o teste não compara criação × edição, só o resultado da edição. Um nome focado no efeito (`edicaoComTrocaDeCategoriaVinculaOrcamentoDaCategoriaDestino`) seria honesto. Além disso, criar orçamento **também na categoria de origem** fecharia a lacuna de "manteve o orçamento antigo?" — hoje o teste só detecta `budget` nulo.

4. **Código de produção:** `ExpenseService.java:48,76` e `NfeImportService.java:40,54` mantêm o campo `budgets` apenas para construir o `ExpenseReferenceResolver`. Não é defeito (o parâmetro do construtor é necessário), mas o campo poderia ser eliminado e o resolver montado direto dos parâmetros — ganho pequeno, fica a critério.

## Observações fora do escopo deste diff

- **`POST` de criação sem `Location`.** `NfeImportController.java:27-28` devolve `201 Created` sem o header exigido por `architecture.md:414` (§6.1). Comportamento anterior ao diff — a renomeação apenas tornou a rota formalmente uma coleção (`/imports`), o que reforça a exigência. Candidato a Issue de manutenção, naturalmente endereçável na Tarefa 6, que ainda vai mexer neste contrato.
- **Isolamento de `ExpenseRegistrationIntegrationTest` (TRUNCATE manual em `obracerta_test`).** É defeito **pré-existente e fora do escopo** desta tarefa: a classe não limpa fixtures e depende do estado do banco (`ExpenseRegistrationIntegrationTest.java:28-50`), enquanto `NfeImportControllerConfirmTest` limpa as suas em `@AfterEach` (`:275-287`). Nenhuma linha do diff toca esse arquivo. A ação do implementador (limpar tabelas transacionais) foi contorno de ambiente, não mudança de código; registre como Issue de manutenção de testes, não como apontamento da Tarefa 4A.
- **A Tarefa 4A é uma terceira passada de revisão sobre a Tarefa 4** (`tarefa-04-decisoes-r2.md`). Segundo `utf-rules.md:18`, "não existe rodada 3". Se o fluxo tratar isto como re-revisão da mesma tarefa, cabe ao autor decidir se conta como nova rodada; registrando para não ficar invisível.

## Execução dos testes

**Não rodei.** O harness bloqueou o shell para `mvnw` (`Permission denied: shell`), tanto no comando completo quanto em `.\mvnw.cmd -v`. Não há como afirmar execução própria.

Como evidência secundária, os relatórios Surefire em `apps/api/target/surefire-reports/` são da execução de **2026-11-05T00:33** com exatamente o `-Dtest=NfeImportControllerConfirmTest,NfeImportControllerPreviewTest,NfeKeyGuardTest,ExpenseServiceTest,ExpensePaymentUpdateIntegrationTest` do despacho e estão verdes.

## Execução do orquestrador

Rodei a mesma suíte a partir de `apps/api` com PostgreSQL local (`obracerta_test`): 44 testes, 0 falhas, 0 erros, `BUILD SUCCESS` (`ExpensePaymentUpdateIntegrationTest` 8, `NfeImportControllerConfirmTest` 8, `NfeImportControllerPreviewTest` 8, `ExpenseServiceTest` 12, `NfeKeyGuardTest` 8).
