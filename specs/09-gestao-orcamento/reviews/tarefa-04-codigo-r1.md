# Parecer de Código — Tarefa 4

**Veredito:** APROVADO

> **Limitação de execução:** o harness bloqueou shell para tudo que não é `git` — `.\mvnw.cmd -v` e `.\mvnw.cmd -Dtest=... test` retornaram `Permission denied: shell`. O parecer é **estático**: li o diff inteiro (`git diff d3486ba`), o `docs/architecture.md`, o `spec.md`/`plan.md` e os arquivos de contexto (`Budget`, `BudgetCategoryDTO`, `ExpenseRepository`, `SecurityConfigurations`, `GlobalExceptionHandler`, `project-modal`, `BudgetAntiIdorIntegrationTest`). Os comandos de teste do despacho **não foram executados**.

## Apontamentos (bloqueiam)

Nenhum. Os pontos que o papel trata como reprovação foram checados um a um e estão limpos:

- **Camadas:** `BudgetController` só recebe/valida/delega; `BudgetService` concentra a regra e é o único que toca repositório, inclusive a checagem Anti-IDOR (`BudgetService.java:118`). Nenhum repositório injetado no controller (regra §5.2.1).
- **Anti-IDOR:** a obra é resolvida por `findByIdAndUserIdAndDeletedAtIsNull` **antes** de qualquer outra consulta (`BudgetService.java:118-121`), então obra alheia e obra inexistente devolvem o mesmo `ResourceNotFoundException()` → 404 "Projeto não encontrado" (§7.2). O teste `BudgetServiceTest.java:270-281` prova inclusive que, no 404 de obra alheia, nenhum outro repositório é tocado (`verifyNoInteractions`).
- **Contrato HTTP:** `PUT` → `200 OK` com DTO; nenhuma entidade JPA atravessa o controller (§5.2.2, §6.1); DTO é record (`BudgetSetDTO.java`), espelhando o model TS (`budget.model.ts:28`).
- **Validação:** `@Valid` + `@NotNull`/`@DecimalMin("0.01")`/`@Digits(13,2)` no DTO, coerente com `decimal(15,2)` e com a mensagem literal do CA6.
- **Transação:** `setBudget` é `@Transactional` de escrita (`BudgetService.java:115`); a leitura continua `readOnly` — sem risco de `LazyInitializationException` no ramo de atualização, porque o caminho só lê `estimatedAmount` e usa a `category` já carregada.
- **Frontend:** componente do modal usa `inject()`, `input()`/`output()`, signals, `ReactiveFormsModule`, `@if`/`@for` e `data-testid` (§5.1.1-§5.1.5, §9.1). Nenhum componente fala com `HttpClient`; a chamada passa por `core/services/budget.service.ts` (§5.1.7). Nenhum `any`, nenhum segredo/URL de ambiente no código.
- **Duplicação:** procurei antes de afirmar — não existe validador numérico equivalente no repo (grep por `invalidAmount|TwoDecimals` só acha o novo arquivo), nem outra computação de "categorias sem teto". O `toCategory`/`stateOf`/`percentageOf` da Tarefa 3 é **reutilizado**, não recopiado.
- **Testes frágeis:** os specs novos falam por `data-testid`, e o caminho real `(ngSubmit)` do modal é exercitado pelo clique no `budget-form-submit` em `budgets-page.component.spec.ts:314`. O modal só chama `component.save()` direto nos casos de unidade, o que é o padrão já adotado em `project-modal.component.spec.ts`.

## Sugestões (não bloqueiam)

1. **`spentOfCategory` agrega a obra inteira para usar uma categoria** — `BudgetService.java:140-146`. O plano previa `sumActiveByProjectAndCategory(projectId, categoryId)` (§Repositórios). Hoje cada `PUT` traz o agregado de todas as categorias e filtra em memória. Com 9 categorias é irrelevante em performance; o custo real é que existem **duas leituras diferentes** do mesmo fato (o `getOverview` itera o agregado em `BudgetService.java:75-80`, o `setBudget` filtra o mesmo agregado) que precisarão evoluir juntas se a regra de "gasto" mudar.

2. **Corrida no upsert pode virar 500, não 409** — `BudgetService.java:123-131`. Dois `PUT` simultâneos na mesma obra/categoria sem linha existente: ambos veem `Optional.empty()`, ambos inserem, e o `idx_budgets_project_category_active` derruba o segundo com `DataIntegrityViolationException`. `GlobalExceptionHandler` não tem handler para ela, e §5.2.3 manda **409** para "violações de unicidade de banco". A UI protege o duplo clique, mas duas abas não.

3. **Import não usado introduzido pelo diff** — `BudgetServiceTest.java:34` (`import static org.mockito.Mockito.never;`). `never` não é usado em nenhum ponto do arquivo; só `times` é. Ruído que o próximo leitor vai investigar à toa.

4. **`@MockBean` está deprecado no Spring Boot 3.4+** — `BudgetControllerTest.java:22-24`, `37-40`. `@MockitoBean` é o substituto. O padrão é o mesmo de `ExpenseCategoryControllerTest.java:11`, então é dívida do repo, mas este é o arquivo novo e a troca aqui evita que o próximo teste copie a forma antiga.

5. **O teste de controller não prova o binding do corpo** — `BudgetControllerTest.java:63`. Como o stub usa `any(BudgetSetDTO.class)`, o teste passaria mesmo se o `estimatedAmount` do JSON fosse mapeado errado. Um `ArgumentCaptor` (ou `eq(new BudgetSetDTO(new BigDecimal("1500.00")))`) fecha o elo JSON → record que é o objeto do teste.

6. **CA7 escrita só tem prova unitária** — `BudgetAntiIdorIntegrationTest.java:57-92` cobre apenas o `GET`. O `PUT` reaproveita exatamente a mesma guarda (e a mesma query, já coberta), então o risco é baixo; ainda assim, um caso com `PUT /api/budgets/{idDaObraDeB}/{cat}` esperando 404 rentabiliza o teste que já existe, sem código novo de produção.

7. **Cast para sair da tipagem do form** — `budget-form-modal.component.ts:101` (`value.estimatedAmount as number`). O `as` existe porque o grupo é `nonNullable` mas o controle foi declarado aceitando `null`. Um `FormControl<number | null>` num grupo `fb.group` (não `nonNullable`) mantém o tipo honesto e elimina a asserção — hoje um `null` que escapasse da validação viraria `estimatedAmount: null` em runtime sem o compilador reclamar.

8. **Botão "Adicionar orçamento" ativo durante `loading()`/`loadError()`** — `budgets-page.component.html:27-34`. Se clicado com o carregamento em voo, o modal abre com lista vazia de categorias (o `load()` zerou `categories`, `budgets-page.component.ts:185`); se o carregamento falhou, o formulário fica inutilizável e ainda cobre o `AlertBanner` de retry. Desabilitar em `loading() || !!loadError()` resolve com uma linha.

9. **`placeholder="Ex.: 1500,00"` em `<input type="number">`** — `budget-form-modal.component.html:53-60`. O placeholder sugere vírgula decimal, que o controle nativo só aceita conforme o locale do navegador; em navegador com locale en-US o usuário digita `1500,00` e o campo fica vazio/inválido sem explicação. Se a intenção é aceitar o formato pt-BR sempre, o caminho é `type="text"` + validação (que já existe).

10. **Asserção de detalhe irrelevante no spec de serviço** — `budget.service.spec.ts:73` (`expect(request.request.params.keys()).toEqual([])`). Não há requisito de "sem query string no PUT"; a linha só cria uma expectativa que quebra se algum dia um interceptor/opção adicionar parâmetro legítimo. O `method` e o `body` já provam o contrato.

11. **Estado residual no `closeBudgetForm`** — `budgets-page.component.ts:104-108` limpa `modalOpen`/`modalEditingCategory`/`modalPreselectedCategoryId`, mas deixa `modalProjectId` com o valor antigo. Inofensivo hoje (só é lido em `onBudgetSaved`), mas é o tipo de estado que envelhece mal quando a Tarefa 8 mexer em troca de obra.

12. **Redundância de asserção no spec do modal** — `budget-form-modal.component.spec.ts:72-77` verifica o mesmo fato duas vezes (`form.controls.categoryId.disabled` e `select.disabled`). Manter só o DOM prova o requisito ("categoria travada") sem acoplar ao `FormControl`; o interno pode ficar apenas no teste de envio, onde importa que o valor seja lido de um controle desabilitado.

## Observações fora do escopo deste diff

- **`GlobalExceptionHandler` não cobre `DataIntegrityViolationException` nem `HttpMessageNotReadableException`** (`GlobalExceptionHandler.java:14-51`). As duas escapam do `ApiErrorResponse` exigido por §5.2.3 e caem no payload padrão do Boot. É pré-existente (o `ProjectController` já recebia `@RequestBody`), mas a Tarefa 6 mexe nesse arquivo — é a hora natural de fechar. Candidata a Issue de manutenção se a Tarefa 6 não pegar.
- **Divergência doc × repo:** `docs/architecture.md` declara Spring Boot **4.1.x** (§1, §5.2) e Vitest (§9.1), mas `apps/api/pom.xml:8` está em **3.5.4** e os specs são Jasmine/Karma. Nada a ver com esta tarefa, mas o `@MockBean` (sugestão 4) só é definitivamente removido se/quando o upgrade acontecer.
- **`Budget` tem `user_id` próprio** (`Budget.java:25-27`) enquanto o MER de `architecture.md:174-182` não lista essa coluna. Pré-existente (V1), não tocado pelo diff; vale conferir se a coluna é redundante com `project.user_id` quando a US de manutenção passar por ali.

**Resumo:** a Tarefa 4 respeita as camadas e os padrões declarados, reutiliza a conversão da Tarefa 3 em vez de recriar regra, e os testes cobrem exatamente o que o plano pediu (criação, atualização sem duplicar, vínculo com o dono, 404 de obra alheia/categoria inexistente, `PUT` 200 + payload padrão de 404, categoria travada, envio, cancelamento e os três pontos de entrada da tela). As sugestões são de robustez e higiene, não de correção.
