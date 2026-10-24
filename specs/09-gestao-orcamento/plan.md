# Plano — Issue #9

## Decisões técnicas

### Backend (`apps/api`)

- **Endpoints REST:**
  - `GET /api/budgets?projectId={uuid}` → `200 OK` com `BudgetOverviewDTO` (totais da obra + linhas por categoria). A obra é buscada por `id + usuário autenticado + deleted_at IS NULL`; obra alheia ou inexistente devolve `404 Projeto não encontrado`.
  - `PUT /api/budgets/{projectId}/categories/{categoryId}` → `200 OK` com `BudgetCategoryDTO`. Corpo `BudgetSetDTO`. Cria o teto quando não existe registro ativo e atualiza o existente quando já existe (RN08), sem duplicar linha.
  - `POST /api/budgets/{projectId}/categories/{categoryId}/zero` → `200 OK` com `BudgetCategoryDTO`. Grava `estimated_amount = 0` no registro ativo, preservando-o; devolve `404 Orçamento não encontrado` se não houver registro para zerar.
  - `GET /api/expense-categories` → `200 OK` com `List<CategoryResponseDTO>`, ordenada alfabeticamente (pt-BR). As 9 categorias vêm do banco, não de constante do frontend.
- **DTOs (Java Records):**
  - `BudgetSetDTO`: `estimatedAmount` (`@NotNull`, `@DecimalMin("0.01")`, `@Digits(integer = 13, fraction = 2)`), com mensagem única “Informe um valor positivo com até duas casas decimais.”.
  - `BudgetCategoryDTO`: `categoryId`, `categoryName`, `plannedAmount`, `spentAmount`, `balanceAmount`, `percentage` (nullable quando não há teto), `state`, `hasBudget`.
  - `BudgetOverviewDTO`: `projectId`, `totalPlanned`, `totalSpent`, `available`, `globalPercentage` (nullable), `exceededCategories`, `budgetedCategories`, `categories`.
  - `CategoryResponseDTO`: `id`, `name`.
- **Enums:** `BudgetState { ON_TRACK, WARNING, EXCEEDED, NO_BUDGET }`.
- **Regras concentradas no `BudgetService`:**
  - `spentAmount` = soma de `expenses.total_price` com `project_id` da obra e `deleted_at IS NULL` (inclui pagas e pendentes; ignora soft delete).
  - `balanceAmount = plannedAmount − spentAmount` (pode ser negativo).
  - `percentage` = `spent / planned × 100`, escala 1, `HALF_UP`; `null` quando `planned = 0`.
  - Estado decidido pela razão exata: `EXCEEDED` quando `spent >= planned` e `planned > 0`; `WARNING` quando `spent/planned >= 0,90` e `< 1`; `ON_TRACK` abaixo de 90%; `NO_BUDGET` quando `planned = 0`.
  - Linhas do painel: categorias com registro de orçamento ativo **ou** com despesa ativa; ordenadas por nome (Collator pt-BR).
  - `exceededCategories` = quantidade em `EXCEEDED`; `budgetedCategories` = quantidade com `planned > 0`.
  - RN02: se `0 < estimatedAmount < spent`, lança `BudgetBelowSpentException` → `409 Conflict` com a mensagem “O orçamento não pode ser menor do que o total de despesas já realizadas nesta categoria: R$ X”. Valor igual a `spent` é aceito.
  - Anti-IDOR: toda operação resolve a obra por `findByIdAndUserIdAndDeletedAtIsNull`; categoria inexistente devolve `404 Categoria não encontrada`.
- **Repositórios:**
  - `BudgetRepository`: `findByProjectIdAndDeletedAtIsNull` (com `category` carregada) e `findByProjectIdAndCategoryIdAndDeletedAtIsNull`.
  - `ExpenseRepository`: projeção agrupada `sumActiveByCategory(projectId)` (id, nome e soma por categoria) e `sumActiveByProjectAndCategory(projectId, categoryId)`, ambas filtrando `deleted_at IS NULL`.
  - `ExpenseCategoryRepository` e `SupplierRepository` (novos; o segundo só para o seeder).
- **Restrição legada:** `expenses.budget_id` continua `NOT NULL` (V1). O cenário “categoria sem teto” é representado por um registro de orçamento com `estimated_amount = 0`, que mantém o vínculo da despesa. A consulta do painel já tolera categoria com despesa e sem registro de orçamento, para quando a US03 flexibilizar esse vínculo. Nenhuma alteração em `expenses` nesta história.
- **Erro:** `ResourceNotFoundException` ganha construtor com mensagem (o construtor sem argumentos continua devolvendo “Projeto não encontrado”); `GlobalExceptionHandler` ganha o handler de `BudgetBelowSpentException` → 409 no mesmo `ApiErrorResponse`.
- **Segurança:** nenhuma rota nova é liberada no `SecurityConfigurations`; todas continuam sob `anyRequest().authenticated()`.

### Migração de schema

- `V6__budget_constraints_and_unique_index.sql`:
  - Normaliza `estimated_amount` nulo para `0.00`, define `NOT NULL` e `DEFAULT 0.00`;
  - Adiciona `CHECK (estimated_amount >= 0)` (zero é permitido por causa do zeramento da RN08/CA4);
  - Antes do índice, soft-deleta duplicatas ativas por `(project_id, category_id)`, mantendo a mais recente (`updated_at`/`created_at`/`id`);
  - Cria `idx_budgets_project_category_active` único e parcial em `(project_id, category_id) WHERE deleted_at IS NULL`.
- `V7__seed_predefined_expense_categories.sql`:
  - Insere as 9 categorias pré-definidas apenas quando o nome ainda não existe (`INSERT ... SELECT ... WHERE NOT EXISTS`), de forma idempotente, com `gen_random_uuid()::VARCHAR(36)`.
- Migrações já aplicadas (V1–V5) não são editadas.

### Frontend (`apps/web`)

- **Modelos (`core/models/budget.model.ts`):** `Budget`, `BudgetState`, `BudgetCategory`, `BudgetOverview`, `BudgetSetDTO`. `ExpenseCategory` existente é reutilizada.
- **Serviços:**
  - `BudgetService` (`core/services/budget.service.ts`): `getOverview(projectId)`, `setBudget(projectId, categoryId, dto)`, `zeroBudget(projectId, categoryId)`.
  - `CategoryService` (`core/services/category.service.ts`): `getCategories()`.
  - Nenhum componente chama `HttpClient` diretamente.
- **Tela `/orcamentos` (`features/budgets-page`):**
  - `BudgetsPageComponent` consome `ActiveProjectService.activeProject` por `effect`; ao trocar de obra, fecha diálogos, ignora respostas antigas (contador de requisição) e recarrega.
  - Carrega em paralelo `getOverview` e `getCategories` (`forkJoin`); estados de `loading`, `loadError` e retry.
  - KPIs com `KpiCardComponent`: total planejado, total gasto, saldo disponível, categorias excedidas (`X de Y`).
  - Tabela com categoria, planejado, gasto, saldo, uso (barra + percentual), estado e ações. Barra limitada a 100% de largura; percentual pode passar de 100%.
  - Cores: verde `ON_TRACK`, amarelo `WARNING`, vermelho `EXCEEDED`, cinza/vermelho `NO_BUDGET`.
  - Linha `NO_BUDGET` com gasto > 0 exibe o alerta de auditoria do CA3, “Definir teto” habilitado e “Reclassificar despesa” desabilitado com `title` explicativo.
  - Ações “Editar” e “Zerar” aparecem quando `hasBudget`; “Zerar” só quando `plannedAmount > 0`.
  - Estado vazio (sem orçamento e sem despesa) e estado sem obra ativa, ambos com CTA conforme CA8.
  - Sem busca, filtro por estado ou ordenação configurável (fora de escopo).
- **Modal de formulário (`features/budgets-page/components/budget-form-modal`):**
  - `ReactiveFormsModule`; categoria bloqueada na edição e selecionável na criação (apenas categorias sem registro ativo).
  - Validação: categoria obrigatória; valor obrigatório, `>= 0,01` e no máximo 2 casas decimais.
  - Exibe erro 409 da API sem fechar o modal e mantém os valores digitados.
  - `Escape`/Cancelar fecham; clique no backdrop não fecha; botão desabilitado durante o envio.
- **Zeramento:** reutiliza `ConfirmModalComponent` com título/descrição da categoria; confirmação chama `zeroBudget`; cancelar/`Escape` não chamam a API.
- **Formatação:** `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` para moeda exata; percentual com 1 casa e vírgula; `—` quando `globalPercentage` é `null`.
- **Acessibilidade/testes:** `data-testid` em KPIs, linhas, barra, badges, botões, modais e estados; `title` nos atalhos desabilitados.

### Comandos de teste

- Backend unitário: `cd apps/api; .\mvnw.cmd -Dtest=BudgetServiceTest,DemoDataSeederServiceTest test`
- Backend completo (perfil `test` + PostgreSQL, como na CI):
  ```powershell
  cd apps/api
  $env:SPRING_PROFILES_ACTIVE='test'
  $env:SPRING_DATASOURCE_URL='jdbc:postgresql://localhost:5432/obracerta_test'
  $env:SPRING_DATASOURCE_USERNAME='postgres'
  $env:SPRING_DATASOURCE_PASSWORD='postgres'
  .\mvnw.cmd test
  ```
- Frontend: `cd apps/web; npx ng test --watch=false --browsers=ChromeHeadless`
- Build: `cd apps/web; npm run build`

---

## Tarefas

- [x] **Tarefa 1 — Preparar schema de orçamento e categorias**
  - Cobre: nenhum CA (passo técnico que destrava CA1, CA3 e CA4)
  - Teste primeiro:
    - `BudgetSchemaMigrationTest` (JUnit, perfil `test`): falha antes das migrations porque `estimated_amount` aceita `NULL`/negativo, não há índice único parcial e as categorias não existem. Prova V6 e V7 aplicadas, `NOT NULL`, `CHECK >= 0`, deduplicação de orçamentos ativos, bloqueio de duplicata ativa, permissão de novo registro após soft delete e as 9 categorias presentes uma única vez.
    - `ExpenseCategoryControllerTest` + `ExpenseCategoryServiceTest`: `GET /api/expense-categories` devolve 200 com as categorias ordenadas; sem o controller/service, o teste não compila.
  - Migration: `V6__budget_constraints_and_unique_index.sql`, `V7__seed_predefined_expense_categories.sql`
  - Arquivos previstos:
    - `apps/api/src/main/resources/db/migration/V6__budget_constraints_and_unique_index.sql`
    - `apps/api/src/main/resources/db/migration/V7__seed_predefined_expense_categories.sql`
    - `apps/api/src/main/java/com/obracerta/model/entity/Budget.java` (apenas `nullable = false` no valor)
    - `apps/api/src/main/java/com/obracerta/repository/ExpenseCategoryRepository.java`
    - `apps/api/src/main/java/com/obracerta/repository/BudgetRepository.java`
    - `apps/api/src/main/java/com/obracerta/service/ExpenseCategoryService.java`
    - `apps/api/src/main/java/com/obracerta/controller/ExpenseCategoryController.java`
    - `apps/api/src/main/java/com/obracerta/model/dto/category/CategoryResponseDTO.java`
    - `apps/api/src/test/java/com/obracerta/migration/BudgetSchemaMigrationTest.java`
    - `apps/api/src/test/java/com/obracerta/controller/ExpenseCategoryControllerTest.java`
    - `apps/api/src/test/java/com/obracerta/service/ExpenseCategoryServiceTest.java`

- [x] **Tarefa 2 — Semear dados de demonstração no perfil dev**
  - Cobre: nenhum CA (habilita a demonstração manual de CA2, CA3 e CA4 sem a US03)
  - Teste primeiro:
    - `DemoDataSeederServiceTest` (JUnit, Mockito): falha antes do serviço existir. Prova que o seed cria usuário demo, obra, fornecedor, orçamentos (incluindo uma categoria zerada com despesa) e despesas com os totais esperados; prova também que uma segunda execução não duplica nada.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/service/DemoDataSeederService.java`
    - `apps/api/src/main/java/com/obracerta/configuration/DemoDataSeederRunner.java` (`CommandLineRunner`, condicional à propriedade)
    - `apps/api/src/main/java/com/obracerta/repository/SupplierRepository.java`
    - `apps/api/src/main/resources/application-dev.properties` (`obracerta.seed.enabled`, `obracerta.seed.password`)
    - `apps/api/src/test/java/com/obracerta/service/DemoDataSeederServiceTest.java`

- [x] **Tarefa 3 — Ler o painel, calcular consumo e exibir estados vazios**
  - Cobre: CA2 (progresso e alertas), CA8 (estados vazios) e a leitura do CA7 (Anti-IDOR)
  - Teste primeiro:
    - Backend: `BudgetServiceTest.getOverview` com repositórios mockados prova totais, saldo negativo, percentual global, os três limiares (89,99% / 90% / 100%) decididos pela razão exata, `percentage = null` sem teto e `NO_BUDGET`; `ExpenseRepositoryTest` prova que a agregação soma só despesas ativas e agrupa por categoria; `BudgetAntiIdorIntegrationTest` prova 404 para obra de outro usuário e para obra inexistente com o mesmo payload.
    - Frontend: `budgets-page.component.spec.ts` prova KPIs formatados, barras/percentuais, estado vazio com CTA, estado sem obra ativa (sem chamar a API) e retry de erro de carregamento. Antes da tela real, o placeholder “budgets works!” falha.
  - Migration: nenhuma (V6/V7 na Tarefa 1)
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/enums/BudgetState.java`
    - `apps/api/src/main/java/com/obracerta/model/dto/budget/BudgetCategoryDTO.java`
    - `apps/api/src/main/java/com/obracerta/model/dto/budget/BudgetOverviewDTO.java`
    - `apps/api/src/main/java/com/obracerta/service/BudgetService.java`
    - `apps/api/src/main/java/com/obracerta/controller/BudgetController.java`
    - `apps/api/src/main/java/com/obracerta/repository/BudgetRepository.java`
    - `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java`
    - `apps/api/src/test/java/com/obracerta/service/BudgetServiceTest.java`
    - `apps/api/src/test/java/com/obracerta/repository/ExpenseRepositoryTest.java`
    - `apps/api/src/test/java/com/obracerta/controller/BudgetAntiIdorIntegrationTest.java`
    - `apps/web/src/app/core/models/budget.model.ts`
    - `apps/web/src/app/core/services/budget.service.ts`
    - `apps/web/src/app/core/services/category.service.ts`
    - `apps/web/src/app/features/budgets-page/budgets-page.component.{ts,html,css,spec.ts}`
    - `apps/web/src/app/core/services/budget.service.spec.ts`
    - `apps/web/src/app/core/services/category.service.spec.ts`

- [ ] **Tarefa 4 — Criar e editar orçamento (uma linha por categoria)**
  - Cobre: CA1 e a escrita do CA7 (Anti-IDOR)
  - Teste primeiro:
    - Backend: `BudgetServiceTest.setBudget` prova criação, atualização do registro existente sem duplicar, vínculo com o dono da obra e 404 para obra alheia/categoria inexistente; `BudgetControllerTest` prova `PUT` 200 e 404 no payload padrão.
    - Frontend: `budget-form-modal.component.spec.ts` prova categoria travada na edição, envio do valor e cancelamento; `budgets-page.component.spec.ts` prova “Adicionar orçamento”, “Definir teto” e “Editar” chamando o serviço e recarregando o painel.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/model/dto/budget/BudgetSetDTO.java`
    - `apps/api/src/main/java/com/obracerta/service/BudgetService.java`
    - `apps/api/src/main/java/com/obracerta/controller/BudgetController.java`
    - `apps/api/src/test/java/com/obracerta/service/BudgetServiceTest.java`
    - `apps/api/src/test/java/com/obracerta/controller/BudgetControllerTest.java`
    - `apps/web/src/app/features/budgets-page/components/budget-form-modal/budget-form-modal.component.{ts,html,css,spec.ts}`
    - `apps/web/src/app/features/budgets-page/budgets-page.component.{ts,html,spec.ts}`
    - `apps/web/src/app/core/services/budget.service.ts`

- [ ] **Tarefa 5 — Zerar orçamento preservando o registro**
  - Cobre: CA4 e a escrita do CA7 (Anti-IDOR)
  - Teste primeiro:
    - Backend: `BudgetServiceTest.zeroBudget` prova `estimated_amount = 0`, registro preservado, totais recalculados, 404 quando não há registro e 404 para obra alheia; `BudgetControllerTest` prova `POST .../zero` 200.
    - Frontend: `budgets-page.component.spec.ts` prova que “Zerar” abre o `ConfirmModal`, confirmar chama o serviço e recarrega, e cancelar/`Escape` não chamam a API.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/service/BudgetService.java`
    - `apps/api/src/main/java/com/obracerta/controller/BudgetController.java`
    - `apps/api/src/test/java/com/obracerta/service/BudgetServiceTest.java`
    - `apps/api/src/test/java/com/obracerta/controller/BudgetControllerTest.java`
    - `apps/web/src/app/features/budgets-page/budgets-page.component.{ts,html,spec.ts}`

- [ ] **Tarefa 6 — Validar valor e bloquear redução abaixo do gasto (RN02)**
  - Cobre: CA5 e CA6
  - Teste primeiro:
    - Backend: `BudgetControllerTest` prova 400 para valor nulo, zero, negativo e com 3 casas; `BudgetServiceTest` prova 409 quando `0 < novo < gasto`, mensagem com o total formatado, e aceite quando `novo == gasto`, sem persistir no bloqueio.
    - Frontend: `budget-form-modal.component.spec.ts` prova bloqueio de valor vazio/zero/negativo/3 casas e exibição da mensagem de 409 sem fechar; `budgets-page.component.spec.ts` prova o atalho “Ver despesas desta categoria” desabilitado com o `title` de US05.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/exception/BudgetBelowSpentException.java`
    - `apps/api/src/main/java/com/obracerta/exception/GlobalExceptionHandler.java`
    - `apps/api/src/main/java/com/obracerta/exception/ResourceNotFoundException.java`
    - `apps/api/src/main/java/com/obracerta/model/dto/budget/BudgetSetDTO.java`
    - `apps/api/src/main/java/com/obracerta/service/BudgetService.java`
    - `apps/api/src/test/java/com/obracerta/controller/BudgetControllerTest.java`
    - `apps/api/src/test/java/com/obracerta/service/BudgetServiceTest.java`
    - `apps/web/src/app/features/budgets-page/components/budget-form-modal/budget-form-modal.component.{ts,html,spec.ts}`
    - `apps/web/src/app/features/budgets-page/budgets-page.component.{ts,html,spec.ts}`

- [ ] **Tarefa 7 — Alertar despesas em categoria sem teto**
  - Cobre: CA3
  - Teste primeiro:
    - Backend: `BudgetServiceTest` prova `NO_BUDGET` e `hasBudget` para categoria zerada com despesa ativa e para categoria com despesa sem registro; `ExpenseRepositoryTest` garante que a despesa soft-deleted não gera alerta.
    - Frontend: `budgets-page.component.spec.ts` prova a mensagem literal do alerta, “Definir teto” abrindo o formulário daquela categoria e “Reclassificar despesa” desabilitado com tooltip US04/US05.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/service/BudgetService.java`
    - `apps/api/src/main/java/com/obracerta/model/dto/budget/BudgetCategoryDTO.java`
    - `apps/api/src/test/java/com/obracerta/service/BudgetServiceTest.java`
    - `apps/api/src/test/java/com/obracerta/repository/ExpenseRepositoryTest.java`
    - `apps/web/src/app/features/budgets-page/budgets-page.component.{ts,html,css,spec.ts}`

- [ ] **Tarefa 8 — Fechar os caminhos de abandono**
  - Cobre: CA9
  - Teste primeiro:
    - Frontend: `budget-form-modal.component.spec.ts` prova `Escape`, botão Cancelar e X sem emissão de `submit` e sem perda por clique no backdrop; `budgets-page.component.spec.ts` prova que trocar a obra ativa fecha os diálogos, descarta o formulário, ignora a resposta atrasada da obra anterior e recarrega a nova; prova também que o botão fica desabilitado durante o envio (sem segunda chamada).
    - Backend: `BudgetServiceTest` prova que `setBudget` repetido com o mesmo valor e `zeroBudget` repetido continuam idempotentes.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/features/budgets-page/components/budget-form-modal/budget-form-modal.component.{ts,html,spec.ts}`
    - `apps/web/src/app/features/budgets-page/budgets-page.component.{ts,html,spec.ts}`
    - `apps/api/src/test/java/com/obracerta/service/BudgetServiceTest.java`

- [ ] **Tarefa 9 — Tratar falha de rede e sessão expirada**
  - Cobre: CA10
  - Teste primeiro:
    - Frontend: `budgets-page.component.spec.ts` prova que erro de rede/5xx no carregamento mostra `AlertBanner` com retry; erro no salvamento mantém o modal e os valores digitados; erro no zeramento mantém o diálogo; 401 limpa a sessão e navega para `/login` (comportamento do `authInterceptor` já existente, exercitado pela página).
    - `budget.service.spec.ts` prova que os três métodos propagam o erro sem transformar o payload.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/features/budgets-page/budgets-page.component.{ts,html,spec.ts}`
    - `apps/web/src/app/features/budgets-page/components/budget-form-modal/budget-form-modal.component.{ts,html,spec.ts}`
    - `apps/web/src/app/core/services/budget.service.spec.ts`

---

## Critérios sem tarefa

*(Vazio — todos os critérios CA1 a CA10 estão cobertos pelo plano acima)*
