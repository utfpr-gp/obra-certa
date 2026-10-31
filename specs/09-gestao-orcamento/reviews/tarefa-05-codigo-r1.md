# Parecer de Código — Tarefa 5

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum.

O diff respeita a régua do `docs/architecture.md`: controller magro (só path vars → service → DTO, sem `Repository` injetado), serviço concentrando a regra, `@Transactional` presente em `zeroBudget` — o que é necessário aqui porque `budget.getCategory()` é lazy e `open-in-view=false` no perfil de teste (`BudgetService.java:140-158`). No frontend, o componente usa `inject()`, `signal()`/`computed()` e `@if` (nada de `*ngIf` novo, nada de construtor), a chamada HTTP passa pelo serviço de `core/services/`, a URL vem de `environment.apiUrl`, e a reutilização do `ConfirmModalComponent` evita um segundo listener de `Escape` (`budgets-page.component.ts:133-169`). A persistência em R$ 0,00 é compatível com o schema: `V6__budget_constraints_and_unique_index.sql` relaxou o `CHECK` para `>= 0` justamente para o CA4 — não há risco de violação de constraint.

## Sugestões (não bloqueiam)

- **`BudgetService.java:152-157` repete a montagem do DTO de `setBudget` (`BudgetService.java:133-137`).** As quatro linhas de `CategoryRow` + `spentOfCategory` agora existem duas vezes; extrair um `categoryRow(project, category, planned)` mantém o recálculo com fonte única e evita que uma mudança futura em `hasBudget`/`state` precise ser feita em dois lugares.
- **`budgets-page.component.ts:165-167` — handler de erro vazio.** Está correto deixar a confirmação para a T9 (CA10), mas o comentário não referencia a tarefa nem a Issue; se a T9 escorregar, um 404/500 vira clique silencioso sem feedback com o diálogo aberto. Vale um `TODO(T9/CA10)` no texto do comentário para o resíduo ser rastreável.
- **`budgets-page.component.spec.ts:439-464` não exercita o X do diálogo.** Cancelar e `Escape` estão cobertos; o X emite o mesmo `cancel`, então a cobertura é equivalente na prática, mas o CA4 nomeia o X explicitamente — uma linha clicando `close-confirmation` fecha a lacuna de prova sem custo.
- **`BudgetControllerTest.java:86-108` reafirma valores que vêm do stub** (`state`, `hasBudget`, `percentage`), então o teste só prova serialização. É o estilo já vigente no arquivo e não incomoda; se quiser um teste menos acoplado, limitar a status + `categoryId` + o campo nulo basta.
- **`docs/architecture.md:178` está defasado** em relação ao schema (`CHECK > 0` vs. `>= 0` do V6). Correção de documentação, mas é a linha que o próximo implementador vai ler antes de mexer em orçamento.

## Observações fora do escopo deste diff

- `POST /api/budgets/{projectId}/categories/{categoryId}/zero` responde `200 OK` sem `Location`, enquanto §6 do `architecture.md` manda `POST` retornar `201 Created`. O spec da issue fixa 200 de propósito — o que falta é a exceção estar escrita na convenção de API, senão o próximo endpoint de ação gera a mesma dúvida.
- `BudgetService` monta DTOs inline via `toCategory`, enquanto §5.2.2 manda converter na camada `mapper/` (hoje só existe `ProjectMapper`). É padrão anterior à T5 e a tarefa apenas o repete; candidato a Issue de manutenção, não a correção desta tarefa.
- A garantia de que a obra ativa não muda durante o zeramento vem de `zeroProjectId` capturado no clique e da comparação em `confirmZero` — o comportamento de troca de obra/duplo envio em si (CA9) fica para a T8, como previsto.

**Testes:** não reexecutados nesta revisão — o shell desta sessão está liberado apenas para `git`, e as suítes de `mvnw`/`ng test` foram negadas por permissão. O parecer se baseia no diff completo e na leitura do código tocado.
