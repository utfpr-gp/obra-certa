# Parecer de Código — Tarefa 1

**Veredito:** APROVADO

> Nota de execução: a suíte não pôde ser executada neste ambiente — o harness negou a execução de `.\mvnw.cmd` (permission denied) tanto pelo comando completo quanto pelo atalho. Este parecer é estático, sobre o diff de `9bca9d7`.

## Apontamentos (bloqueiam)

Nenhum. O que verifiquei e ficou de pé:

- **Camadas:** `controller → service → repository`, controller magro (sem repository injetado), DTO como `record` sem vazar `ExpenseCategory` — conforme `architecture.md` §5.2.1–2. Controller idêntico em forma ao `ProjectController` (constructor injection, `ResponseEntity.ok`).
- **Rota e contrato:** `/api/expense-categories` no plural/kebab-case e `List<T>` simples com `200`, como manda §6.1–2; nenhuma rota nova liberada em `SecurityConfigurations` (segue sob `anyRequest().authenticated()`).
- **V6:** ordem das instruções coerente com o próprio comentário — normaliza `NULL` → `0.00`, `DEFAULT`, `NOT NULL`, `CHECK >= 0`, **soft delete** das duplicatas e só então o índice único parcial; o predicado `WHERE deleted_at IS NULL` casa com `architecture.md` §3.1, e o `UPDATE ... SET deleted_at` (nunca `DELETE`) preserva a FK `expenses.budget_id NOT NULL` da V1.
- **V7:** nomes idênticos aos 9 de `expense-category.model.ts` (acentos conferidos um a um), `WHERE NOT EXISTS` por nome, `gen_random_uuid()::VARCHAR(36)` compatível com `id VARCHAR(36)` da V1 — e `expense_categories` não tem coluna `type`, então a lista de colunas do `INSERT` está correta.
- **Testes:** os três exercitam comportamento (status/payload, ordem, constraints), não estrutura interna; o probe schema com `Propagation.NOT_SUPPORTED` + `DROP ... CASCADE` é a única forma honesta de provar a deduplicação antes do índice existir, e o `finally` limpa o schema. `BudgetSchemaMigrationTest` segue o padrão já estabelecido em `ProjectSchemaMigrationTest`.

## Sugestões (não bloqueiam)

1. **Repontar as despesas das duplicatas soft-deletadas para o orçamento sobrevivente** — `V6__budget_constraints_and_unique_index.sql:24-39`
   A deduplicação carimba `deleted_at` na duplicata e deixa as `expenses.budget_id` apontando para uma linha inativa. O painel da história não quebra (Tarefa 3 soma por `project_id` + `category_id`, não pelo vínculo), mas a corrente `expense → budget` passa a apontar para registro "excluído"; quando a US03/US05 ler `expense.budget` para exibir a categoria, essas despesas antigas mostrarão um orçamento que não existe mais como ativo. Um `UPDATE expenses SET budget_id = <sobrevivente>` antes do índice fecha isso enquanto a migration ainda pode ser ajustada.

2. **`expense_categories.name` continua sem `UNIQUE`** — `V7__seed_predefined_expense_categories.sql:11`
   `architecture.md` §3 declara `varchar name UK "not null"`, e o schema da V1 não tem essa constraint. Hoje a unicidade do dado mestre depende só do `WHERE NOT EXISTS` desta migration; qualquer writer futuro (o seeder da Tarefa 2 ou um insert manual) pode duplicar "Alvenaria", e aí `findByName` — que a Tarefa 2 vai precisar — passa a estourar `IncorrectResultSizeDataAccessException` ou o `GET` a devolver a categoria duas vezes. Adicionar `uk_expense_categories_name` na própria V7 é barato e alinha o schema ao MER.

3. **`DEFAULT 0.00` transforma esquecimento em "teto zerado" silencioso** — `V6__budget_constraints_and_unique_index.sql:17`
   Se a Tarefa 4 criar o `Budget` sem preencher `estimatedAmount`, o banco grava `0,00` em vez de recusar — e o painel exibe `NO_BUDGET`/alerta de auditoria no lugar de um erro de programação. O default é decisão do plano, então não cabe bloquear; vale garantir no `BudgetServiceTest` da Tarefa 4 uma asserção de que o valor é sempre setado explicitamente.

4. **`Collator.PRIMARY` não desempata** — `ExpenseCategoryService.java:29-33`
   Com `PRIMARY`, nomes que diferem só por acento/caixa comparam como iguais; como o `findAll()` não tem `ORDER BY` e `List.sort` é estável, a ordem entre esses dois fica dependente da ordem física de retorno do Postgres. `SECONDARY`/`TERTIARY` mantém o comportamento pt-BR e dá ordem determinística. Não há par assim hoje entre as 9 categorias — é prevenção para o catálogo crescer.

5. **Conversão fora da camada `mapper/`** — `ExpenseCategoryService.java:30-32`
   `architecture.md` §5.2.2 atribui a conversão Entity → DTO a `mapper/` (é o que `ProjectMapper` faz). Aqui o `new CategoryResponseDTO(...)` está inline no service. Para um record de dois campos um mapper seria indireção de caso único — por isso não bloqueia —, mas registre a decisão: se a Tarefa 3 também mapear inline, `mapper/` nasce morto e a convenção fica dividida.

## Observações fora do escopo deste diff

- **`architecture.md` §3 ficou desatualizado em relação ao schema real:** ainda diz `budgets.estimated_amount ... CHECK > 0`, não lista `budgets.user_id` nem `expenses.budget_id`, e declara `expense_categories.name` como UK. O `CHECK >= 0` da V6 é intencional (CA4 zera o teto), mas sem atualizar o documento o próximo auditor vai comparar o banco com um texto que já não descreve o banco. Candidata a Issue de documentação.
- **`PREDEFINED_CATEGORIES` em `apps/web/src/app/core/models/expense-category.model.ts:15-25`** continua no repositório com ids fixos (`cat-fundacao`…) que a V7 não cria — os ids agora são UUID gerados no banco. Nada o consome hoje (só a definição), mas se a Tarefa 3 esquecer de removê-lo e alguma tela enviar `cat-alvenaria` como `categoryId`, a API responde `404 Categoria não encontrada`. `obra-mock.service.ts` repete os mesmos nomes com ids/valores fictícios — mesma dívida. Candidatas a Issue de manutenção.
- **`@MockBean` está deprecado no Spring Boot 3.5.4** (o pom do projeto), substituído por `@MockitoBean`; `ProjectControllerTest` já fazia assim antes desta tarefa, então o novo teste apenas segue a convenção vigente. Migração da suíte inteira é Issue de manutenção.
- **Dois pacotes de serviço convivem** (`com.obracerta.service` e o legado `com.obracerta.services`); o novo código acertou o pacote canônico, mas a duplicidade é dívida pré-existente.
