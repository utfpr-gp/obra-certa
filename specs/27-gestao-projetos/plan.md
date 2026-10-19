# Plano — Issue #27

## Decisões técnicas

### Backend (`apps/api`)

- **Endpoints REST:**
  - `GET /api/projects`: Retorna lista `List<ProjectResponseDTO>` de obras não excluídas pertencentes exclusivamente ao usuário autenticado.
  - `POST /api/projects`: Criação de nova obra vinculada ao usuário autenticado (201 Created + `ProjectResponseDTO`).
  - `GET /api/projects/{id}`: Detalhe da obra com validação anti-IDOR (retorna 404 se não pertencer ao usuário logado ou estiver excluída).
  - `PUT /api/projects/{id}`: Atualização de nome, tipo, localização e status da obra com validação anti-IDOR e `@Valid`.
  - `DELETE /api/projects/{id}`: Exclusão lógica (204 No Content), definindo `deleted_at = Instant.now()`.
- **DTOs (Java Records imutáveis):**
  - `ProjectCreateDTO`: `name` (@NotBlank, @Size(min=3, max=255)), `type` (@NotNull ProjectType), `location` (@Size(max=255)).
  - `ProjectUpdateDTO`: `name` (@NotBlank, @Size(min=3, max=255)), `type` (@NotNull ProjectType), `status` (@NotNull ProjectStatus), `location` (@Size(max=255)).
  - `ProjectResponseDTO`: `id`, `name`, `type`, `location`, `status`, `createdAt`, `updatedAt`.
- **Entidades e Enums:**
  - `Project`: UUID `id`, `user` (@ManyToOne), `name`, `type`, `location`, `status`, `deletedAt`, `createdAt`, `updatedAt`.
  - `ProjectType`: `NEW_CONSTRUCTION`, `RENOVATION`, `EXPANSION`.
  - `ProjectStatus`: `IN_PROGRESS`, `PAUSED`, `COMPLETED`.
  - Atualização em `Budget` e `Expense`: inclusão do atributo `@ManyToOne @JoinColumn(name = "project_id") Project project`.
- **Autorização e Anti-IDOR:**
  - Extração do usuário corrente autenticado a partir do token JWT via `SecurityContextHolder`.
  - Métodos de busca no `ProjectRepository`: `findByUserIdAndDeletedAtIsNull(UUID userId)` e `findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId)`. Tentativas de acesso a obras alheias geram `ResourceNotFoundException` mapeada para HTTP 404.

### Migração de schema

- `V2__create_projects_and_project_fk.sql`:
  - Criação da tabela `projects` (`id` VARCHAR(36) PK, `user_id` VARCHAR(36) FK -> `users.id`, `name`, `type`, `location`, `status`, `deleted_at`, `created_at`, `updated_at`).
  - Adição da coluna `project_id` VARCHAR(36) em `budgets` e chave estrangeira para `projects(id)`.
  - Adição da coluna `project_id` VARCHAR(36) em `expenses` e chave estrangeira para `projects(id)`.
  - Criação de índices parciais no PostgreSQL: `idx_projects_user_active` em `projects(user_id) WHERE deleted_at IS NULL`.

### Frontend (`apps/web`)

- **Modelos (`core/models/project.model.ts`):**
  - Tipos e interfaces: `Project`, `ProjectType`, `ProjectStatus`, `ProjectCreateDTO`, `ProjectUpdateDTO`.
- **Serviços Singleton:**
  - `ProjectService` (`core/services/project.service.ts`): cliente HTTP consumindo `/api/projects` com métodos `getProjects()`, `getProjectById(id)`, `createProject(dto)`, `updateProject(id, dto)`, `deleteProject(id)`.
  - `ActiveProjectService` (`core/services/active-project.service.ts`): gerencia o estado reativo com `activeProject = signal<Project | null>(null)`, sincroniza a seleção no `localStorage` por chave de usuário, e fornece métodos para trocar a obra ativa e selecionar a primeira obra válida caso a atual seja excluída.
- **Componentes e Telas:**
  - `NavbarComponent`: seletor de obras com dropdown reativo exibindo a obra ativa, lista de obras cadastradas, botão de adicionar nova obra e ação de editar obra atual.
  - `ProjectModalComponent`: modal para cadastro e edição da obra com formulário reativo (`ReactiveFormsModule`), validação inline de nome mínimo 3 caracteres, tipo obrigatório, botão "Definir Orçamentos" e retenção de dados digitados em caso de falha de rede.
  - `HomePageComponent`: atualizado para consumir `ActiveProjectService`, exibindo card/banner de orientação com CTA para `/orcamentos` quando a obra ativa não possuir orçamentos cadastrados, ou estado de onboarding quando o usuário tiver zero obras.

---

## Tarefas

- [ ] **Tarefa 1 — Criar schema relacional da tabela projects e chaves estrangeiras**
  - Cobre: CA10
  - Teste primeiro: Teste de integração do Spring Boot com Flyway e Testcontainers provando a aplicação da migration `V2`, conferindo a criação da tabela `projects` e as colunas `project_id` em `budgets` e `expenses`, com `ddl-auto=validate` passando sem divergências.
  - Migration: `V2__create_projects_and_project_fk.sql`
  - Arquivos previstos:
    - `apps/api/src/main/resources/db/migration/V2__create_projects_and_project_fk.sql`
    - `apps/api/src/main/java/com/obracerta/model/entity/Project.java`
    - `apps/api/src/main/java/com/obracerta/model/enums/ProjectType.java`
    - `apps/api/src/main/java/com/obracerta/model/enums/ProjectStatus.java`
    - `apps/api/src/main/java/com/obracerta/model/entity/Budget.java`
    - `apps/api/src/main/java/com/obracerta/model/entity/Expense.java`
    - `apps/api/src/test/java/com/obracerta/migration/ProjectSchemaMigrationTest.java`

- [ ] **Tarefa 2 — Implementar cadastro e detalhe de obras com isolamento Anti-IDOR**
  - Cobre: CA1, CA7
  - Teste primeiro: Testes unitários e de integração em `apps/api` (`ProjectServiceTest` e `ProjectControllerTest`) provando: (1) que a criação vincula a obra ao usuário autenticado e a persiste; (2) que consultar uma obra existente pertencente a outro usuário retorna HTTP 404 (Anti-IDOR) sem expor detalhes.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/repository/ProjectRepository.java`
    - `apps/api/src/main/java/com/obracerta/model/dto/project/ProjectCreateDTO.java`
    - `apps/api/src/main/java/com/obracerta/model/dto/project/ProjectResponseDTO.java`
    - `apps/api/src/main/java/com/obracerta/service/ProjectService.java`
    - `apps/api/src/main/java/com/obracerta/controller/ProjectController.java`
    - `apps/api/src/test/java/com/obracerta/service/ProjectServiceTest.java`
    - `apps/api/src/test/java/com/obracerta/controller/ProjectControllerTest.java`

- [ ] **Tarefa 3 — Implementar validações de entrada e tratamento de erros no backend**
  - Cobre: CA6
  - Teste primeiro: Teste em `apps/api` com `@WebMvcTest` provando que submissões com nome vazio ou com menos de 3 caracteres, ou sem o tipo obrigatório, retornam HTTP 400 Bad Request com payload de erro e mensagens descritivas de validação.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/model/dto/project/ProjectCreateDTO.java`
    - `apps/api/src/main/java/com/obracerta/model/dto/project/ProjectUpdateDTO.java`
    - `apps/api/src/main/java/com/obracerta/exception/GlobalExceptionHandler.java`
    - `apps/api/src/test/java/com/obracerta/controller/ProjectValidationTest.java`

- [ ] **Tarefa 4 — Implementar edição de nome/dados e exclusão lógica no backend**
  - Cobre: CA3, CA4
  - Teste primeiro: Teste em `apps/api` provando que `PUT /api/projects/{id}` altera o nome e demais dados preservando orçamentos/despesas, e que `DELETE /api/projects/{id}` aplica exclusão lógica (`deleted_at != null`), garantindo que a obra deletada não é retornada em `GET /api/projects`.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/model/dto/project/ProjectUpdateDTO.java`
    - `apps/api/src/main/java/com/obracerta/service/ProjectService.java`
    - `apps/api/src/main/java/com/obracerta/controller/ProjectController.java`
    - `apps/api/src/test/java/com/obracerta/service/ProjectLifecycleTest.java`

- [ ] **Tarefa 5 — Desenvolver serviço de cliente HTTP e gerenciamento de obra ativa no Angular**
  - Cobre: CA2
  - Teste primeiro: Teste no Vitest em `apps/web` (`project.service.spec.ts` e `active-project.service.spec.ts`) provando o consumo dos endpoints REST com token JWT, a reatividade do Signal `activeProject`, a sincronização com `localStorage` e a seleção automática da primeira obra válida caso o cache esteja desatualizado.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/core/models/project.model.ts`
    - `apps/web/src/app/core/services/project.service.ts`
    - `apps/web/src/app/core/services/active-project.service.ts`
    - `apps/web/src/app/core/services/project.service.spec.ts`
    - `apps/web/src/app/core/services/active-project.service.spec.ts`

- [ ] **Tarefa 6 — Integrar seletor na Navbar e modal de cadastro/edição com atalho para orçamentos**
  - Cobre: CA1, CA2, CA3, CA9
  - Teste primeiro: Teste no Vitest em `apps/web` (`navbar.component.spec.ts` e `project-modal.component.spec.ts`) provando: (1) a listagem e alternância de obras na Navbar; (2) a abertura do modal de edição com o nome atual e atualização reativa do nome na tela; (3) a exibição do botão "Definir Orçamentos"; (4) a preservação dos dados do formulário sem reset quando ocorre erro de rede/timeout.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/shared/components/navbar/navbar.component.ts`
    - `apps/web/src/app/shared/components/navbar/navbar.component.html`
    - `apps/web/src/app/shared/components/project-modal/project-modal.component.ts`
    - `apps/web/src/app/shared/components/project-modal/project-modal.component.html`
    - `apps/web/src/app/shared/components/project-modal/project-modal.component.spec.ts`
    - `apps/web/src/app/shared/components/navbar/navbar.component.spec.ts`

- [ ] **Tarefa 7 — Implementar fluxo de onboarding para zero obras e estado sem orçamentos na Home**
  - Cobre: CA5, CA8
  - Teste primeiro: Teste no Vitest em `apps/web` (`home-page.component.spec.ts` e modal de exclusão/onboarding) provando: (1) exibição do estado de onboarding quando o usuário possui zero obras cadastradas; (2) exibição do card/banner com CTA para `/orcamentos` quando a obra ativa não possui orçamentos; (3) cancelamento não-destrutivo ao fechar modal de exclusão via botão ou tecla `Escape`.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/features/home-page/home-page.component.ts`
    - `apps/web/src/app/features/home-page/home-page.component.html`
    - `apps/web/src/app/shared/components/onboarding-modal/onboarding-modal.component.ts`
    - `apps/web/src/app/shared/components/onboarding-modal/onboarding-modal.component.html`
    - `apps/web/src/app/features/home-page/home-page.component.spec.ts`

---

## Critérios sem tarefa

*(Vazio — todos os critérios CA1 a CA10 estão cobertos pelo plano acima)*
