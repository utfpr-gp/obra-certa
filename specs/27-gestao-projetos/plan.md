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

- [x] **Tarefa 1 — Criar schema relacional da tabela projects e chaves estrangeiras**
  - Cobre: CA10
  - Teste primeiro: Teste de integração do Spring Boot com Flyway e Testcontainers provando a aplicação da migration `V2`, conferindo a criação da tabela `projects` e as colunas `project_id` em `budgets` e `expenses`, com `ddl-auto=validate` passando sem divergências.
  - Migration: `V2__create_projects_and_project_fk.sql`
  - Arquivos previstos:
    - `apps/api/src/main/resources/db/migration/V2__create_projects_and_project_fk.sql`
    - `apps/api/src/main/java/com/obracerta/model/entity/Project.java`
    - `apps/api/src/main/java/com/obracerta/enums/ProjectType.java`
    - `apps/api/src/main/java/com/obracerta/enums/ProjectStatus.java`
    - `apps/api/src/main/java/com/obracerta/model/entity/Budget.java`
    - `apps/api/src/main/java/com/obracerta/model/entity/Expense.java`
    - `apps/api/src/test/java/com/obracerta/migration/ProjectSchemaMigrationTest.java`

- [x] **Tarefa 2 — Implementar cadastro e detalhe de obras com isolamento Anti-IDOR**
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

- [x] **Tarefa 2A — Provar o isolamento Anti-IDOR com repository e fluxo integrados**
  - Depende de: Tarefa 2
  - Cobre: reforço de CA7 e fechamento do bloqueio da revisão da Tarefa 2
  - Teste primeiro: Teste `@DataJpaTest` contra PostgreSQL real/Testcontainers criando usuários A e B e uma obra de B, provando que a consulta filtrada pelo usuário A retorna vazio, a consulta pelo usuário B encontra a obra, obra própria com `deleted_at` preenchido retorna vazio e ID inexistente retorna vazio. Teste de fluxo integrado com controller, service e repository reais, usando autenticação do usuário A, provando `GET` contra obra de B com HTTP 404 e payload idêntico ao de ID inexistente, sem alterar a obra de B. Renomear o teste unitário existente para refletir que ele cobre apenas `Optional.empty()` e executar uma mutação temporária da query para confirmar que a suíte falha sem o filtro por usuário; reverter a mutação antes de concluir.
  - Dependência de escopo: os cenários equivalentes de `PUT` e `DELETE` contra obra alheia devem ser adicionados à Tarefa 4, junto com os endpoints de edição e exclusão lógica; não antecipar esses endpoints nesta tarefa.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/api/src/test/java/com/obracerta/repository/ProjectRepositoryTest.java`
    - `apps/api/src/test/java/com/obracerta/controller/ProjectAntiIdorIntegrationTest.java`
    - `apps/api/src/test/java/com/obracerta/service/ProjectServiceTest.java`

- [x] **Tarefa 3 — Implementar validações de entrada e tratamento de erros no backend**
  - Cobre: CA6
  - Teste primeiro: Teste em `apps/api` com `@WebMvcTest` provando que submissões com nome vazio ou com menos de 3 caracteres, ou sem o tipo obrigatório, retornam HTTP 400 Bad Request com payload de erro e mensagens descritivas de validação.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/model/dto/project/ProjectCreateDTO.java`
    - `apps/api/src/main/java/com/obracerta/model/dto/project/ProjectUpdateDTO.java`
    - `apps/api/src/main/java/com/obracerta/exception/GlobalExceptionHandler.java`
    - `apps/api/src/test/java/com/obracerta/controller/ProjectValidationTest.java`

- [x] **Tarefa 4 — Implementar edição de nome/dados e exclusão lógica no backend**
  - Cobre: CA3, CA4
  - Teste primeiro: Teste em `apps/api` provando que `PUT /api/projects/{id}` altera o nome e demais dados preservando orçamentos/despesas, e que `DELETE /api/projects/{id}` aplica exclusão lógica (`deleted_at != null`), garantindo que a obra deletada não é retornada em `GET /api/projects`.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/model/dto/project/ProjectUpdateDTO.java`
    - `apps/api/src/main/java/com/obracerta/service/ProjectService.java`
    - `apps/api/src/main/java/com/obracerta/controller/ProjectController.java`
    - `apps/api/src/test/java/com/obracerta/service/ProjectLifecycleTest.java`

- [x] **Tarefa 4A — Corrigir pendências temporais e ampliar a prova do soft delete**
  - Depende de: Tarefa 4
  - Cobre: fechamento dos apontamentos aceitos na revisão da Tarefa 4
  - Teste primeiro: ampliar `ProjectLifecycleTest` para criar e verificar explicitamente um `PendingPayment` após a exclusão lógica; adicionar cobertura determinística do instante de exclusão com `Clock.fixed()`; validar a migration e o mapeamento dos campos `deleted_at` com o tipo temporal compatível com timezone definido na arquitetura.
  - Correções obrigatórias:
    - Injetar `java.time.Clock` no `ProjectService` e usar o instante controlado para a exclusão lógica.
    - Corrigir a migration dos vínculos financeiros para usar o tipo temporal com timezone (`timestamptz`), preservando a regra de migrations versionadas e sem editar migrations já aplicadas.
    - Comprovar explicitamente a propagação do soft delete para `pending_payments`.
  - Migration: criar uma nova migration versionada para corrigir o tipo temporal, sem editar a V3 se ela já tiver sido aplicada em qualquer ambiente.
  - Arquivos previstos:
    - `apps/api/src/test/java/com/obracerta/service/ProjectLifecycleTest.java`
    - `apps/api/src/main/java/com/obracerta/service/ProjectService.java`
    - `apps/api/src/main/java/com/obracerta/service/...` (configuração/bean de `Clock`, se necessária conforme o padrão existente)
    - `apps/api/src/main/resources/db/migration/V<N>__...sql`

- [x] **Tarefa 5 — Desenvolver serviço de cliente HTTP e gerenciamento de obra ativa no Angular**
  - Cobre: CA2
  - Teste primeiro: Teste no Vitest em `apps/web` (`project.service.spec.ts` e `active-project.service.spec.ts`) provando o consumo dos endpoints REST com token JWT, a reatividade do Signal `activeProject`, a sincronização com `localStorage` e a seleção automática da primeira obra válida caso o cache esteja desatualizado.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/core/models/project.model.ts`
    - `apps/web/src/app/core/services/project.service.ts`
    - `apps/web/src/app/core/services/active-project.service.ts`
    - `apps/web/src/app/core/services/project.service.spec.ts`
    - `apps/web/src/app/core/services/active-project.service.spec.ts`

- [x] **Tarefa 6 — Integrar seletor na Navbar e modal de cadastro/edição com atalho para orçamentos**
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

- [x] **Tarefa 6A — Corrigir pendências de integração da Navbar, Home e modal**
  - Depende de: Tarefa 6
  - Cobre: fechamento dos apontamentos aceitos na revisão da Tarefa 6
  - Teste primeiro: ampliar os testes Angular com Karma/Jasmine para provar que a Home e a Navbar refletem o mesmo `ActiveProjectService`, que o modal fecha antes da navegação para `/orcamentos`, que falha no carregamento inicial exibe feedback explícito e que todos os campos permanecem preenchidos com nova submissão possível após erro de criação ou edição.
  - Correções obrigatórias:
    - Integrar o cabeçalho da Home ao estado global de obra ativa, sem manter uma fonte de verdade paralela no `ObraMockService`.
    - Fechar o modal antes ou durante a navegação para `/orcamentos`.
    - Tratar falhas de `getProjects()` na Navbar com estado de erro/feedback acionável, sem fallback silencioso.
    - Reforçar os testes de erro do formulário para todos os campos e para uma nova tentativa de envio.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/features/home-page/`
    - `apps/web/src/app/shared/components/navbar/`
    - `apps/web/src/app/shared/components/project-modal/`

- [x] **Tarefa 6B — Unificar dados da Home e identidade da obra ativa**
 - Depende de: Tarefa 6A
 - Cobre: fechamento dos apontamentos aceitos na revisão da Tarefa 6A
 - Teste primeiro: ampliar os testes Angular com Karma/Jasmine para provar que todos os dados dependentes da obra ativa da Home acompanham a seleção global e que a persistência usa somente um identificador autenticado válido, sem compartilhar a chave entre sessões inválidas.
 - Correções obrigatórias:
   - Remover a fonte paralela `ObraMockService.activeObra` da Home ou associá-la explicitamente ao `ActiveProjectService.activeProject().id`, sem misturar dados de obras.
   - Testar a integração dos dados dependentes da obra ativa, além do nome no cabeçalho.
   - Centralizar a resolução do identificador autenticado em uma abstração de identidade existente ou dedicada.
   - Impedir fallback global como `current-user` para persistência por usuário quando o token não fornecer identificador válido.
 - Migration: nenhuma
 - Arquivos previstos:
   - `apps/web/src/app/features/home-page/`
   - `apps/web/src/app/core/services/`
   - `apps/web/src/app/shared/components/navbar/`
   - `apps/web/src/app/shared/components/project-modal/`

- [x] **Tarefa 6C — Integrar dashboard com obras reais e fechar isolamento de sessão**
  - Depende de: Tarefa 6B
  - Cobre: fechamento dos apontamentos aceitos na revisão da Tarefa 6B
  - Teste primeiro: ampliar os testes Angular com Karma/Jasmine para provar o dashboard com um `Project` real de UUID, sem depender de IDs artificiais do mock; validar token inválido no guard e limpar a obra ativa ao fazer logout/trocar de sessão.
  - Correções obrigatórias:
    - Substituir o dashboard mockado por serviços/contratos tipados compatíveis com `Project` real, ou criar adaptação explícita que carregue dados pelo UUID real sem estado financeiro de outra obra.
    - Fazer `Auth.isAuthenticated()` e o guard rejeitarem tokens ausentes, malformados ou expirados conforme a política existente.
    - Limpar o Signal da obra ativa e o contexto derivado ao encerrar a sessão, evitando vazamento visual entre usuários.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/features/home-page/`
    - `apps/web/src/app/core/services/`
    - `apps/web/src/app/core/guards/`
    - `apps/web/src/app/core/services/auth.ts`

- [x] **Tarefa 7 — Implementar fluxo de onboarding para zero obras e estado sem orçamentos na Home**
  - Cobre: CA5, CA8
  - Teste primeiro: Teste no Karma/Jasmine em `apps/web` (`home-page.spec.ts` e `ConfirmModalComponent`) provando: (1) exibição do estado de onboarding quando o usuário possui zero obras cadastradas; (2) exibição do card/banner com CTA para `/orcamentos` quando a obra ativa não possui orçamentos; (3) cancelamento não-destrutivo ao fechar modal de exclusão via botão, fechamento ou tecla `Escape`.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/features/home-page/home-page.ts`
    - `apps/web/src/app/features/home-page/home-page.html`
    - `apps/web/src/app/shared/components/project-modal/project-modal.component.ts`
    - `apps/web/src/app/shared/components/project-modal/project-modal.component.html`
    - `apps/web/src/app/shared/components/confirm-modal/confirm-modal.component.html`
    - `apps/web/src/app/features/home-page/home-page.spec.ts`

- [x] **Tarefa 7A — Corrigir estado de orçamentos, exclusão e modal**
  - Depende de: Tarefa 7
  - Cobre: fechamento dos apontamentos aceitos na revisão da Tarefa 7
  - Fechamento: encerrada na rodada 2 (limite atingido); o apontamento aceito residual — onboarding após cadastro pela Navbar — foi movido para a Tarefa 8.
  - Teste primeiro: ampliar os testes Angular com Karma/Jasmine para distinguir lista de obras vazia de ausência de obra ativa, distinguir obra com/sem orçamento por fonte/estado explícito, tratar erro de `DELETE` com feedback, bloquear clique externo no `ConfirmModal` e usar seletores semânticos nos testes.
  - Correções obrigatórias:
    - Não exibir o card de “sem orçamentos” para toda obra por default; usar dado real ou estado explicitamente modelado, sem inventar orçamento.
    - Exibir erro acionável quando `deleteProject()` falhar, mantendo o estado coerente.
    - Impedir que o backdrop confirme/cancele por clique externo acidental; manter cancelamento explícito por botão, fechamento e Escape.
    - Cobrir a resposta vazia de obras no onboarding e remover testes acoplados à ordem dos botões.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/features/home-page/`
    - `apps/web/src/app/shared/components/confirm-modal/`
    - testes Angular relacionados

- [x] **Tarefa 8 — Sair do onboarding quando a primeira obra é criada pela Navbar**
  - Depende de: Tarefa 7A
  - Cobre: fechamento do apontamento aceito na rodada 2 da Tarefa 7A (CA1 e CA5)
  - Teste primeiro: teste no Karma/Jasmine provando que a Home sai do onboarding e exibe o dashboard quando uma obra passa a ser a ativa sem que a lista local da Home tenha sido recarregada (cadastro feito pelo modal da Navbar), mantendo o onboarding apenas quando a resposta de obras é comprovadamente vazia.
  - Correções obrigatórias:
    - Não exibir o onboarding quando já existe obra ativa válida, mesmo que a lista local da Home ainda esteja vazia.
    - Preservar o caminho de zero obras (resposta vazia) e o estado neutro de lista não vazia sem obra ativa.
    - Cobrir o caminho de cadastro pela Navbar sem depender de reload manual, sem introduzir store compartilhado nesta tarefa.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/features/home-page/`
    - `apps/web/src/app/shared/components/navbar/` (somente se indispensável para o teste do caminho)
    - testes Angular relacionados

- [ ] **Tarefa 9 — Selecionar a próxima obra ativa após a exclusão**
  - Depende de: Tarefa 8
  - Cobre: CA4 (seleção automática da próxima obra ativa) e a coerência da lista da Navbar (CA2)
  - Teste primeiro: em `home-page.spec.ts`, com duas obras e a primeira ativa, excluir a ativa e provar que a remanescente vira ativa, o dashboard exibe o nome dela e o `localStorage` guarda o id; com uma única obra, provar onboarding e limpeza da obra ativa. Provar que a obra excluída deixa de ser oferecida pela Navbar.
  - Correções obrigatórias:
    - Após o `DELETE`, selecionar a próxima obra ativa da lista e persistir a escolha no `localStorage`.
    - Se não sobrar nenhuma obra, limpar a obra ativa e exibir o onboarding.
    - Manter a lista da Navbar coerente após a exclusão, sem introduzir store compartilhado novo (recarregar sob demanda ao abrir o seletor ou usar um sinal de refresh no serviço existente).
    - Não regredir CA2, CA3 e CA8.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/features/home-page/`
    - `apps/web/src/app/shared/components/navbar/` (somente se indispensável)
    - `apps/web/src/app/core/services/active-project.service.ts` (somente se indispensável)
    - testes Angular relacionados

- [ ] **Tarefa 10 — Corrigir o contexto e o contrato do `ProjectControllerTest`**
  - Depende de: Tarefa 2A e Tarefa 3
  - Cobre: CA7 (prova de 404 uniforme) e a saúde do pipeline backend
  - Teste primeiro: fazer o `ProjectControllerTest` carregar o contexto do `@WebMvcTest` (mockar `TokenService`/dependências do `SecurityFilter` ou recortar a configuração) e afirmar o contrato real da API para obra alheia/inexistente. Decidir e registrar um único idioma para a mensagem de 404, alinhando teste e `ResourceNotFoundException`/`GlobalExceptionHandler`.
  - Correções obrigatórias:
    - `mvnw.cmd test` completo verde, não apenas o teste direcionado.
    - Não usar `@Disabled` nem excluir a classe do Surefire para mascarar a falha.
    - Cobrir GET, PUT e DELETE de obra alheia com 404, se o teste atual cobrir apenas GET.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/api/src/test/java/com/obracerta/controller/ProjectControllerTest.java`
    - `apps/api/src/main/java/com/obracerta/exception/` (somente se o contrato mudar)
    - testes de integração relacionados

- [ ] **Tarefa 11 — Fechar as lacunas de prova do CA6**
  - Depende de: Tarefa 6 e Tarefa 6A
  - Cobre: CA6 (validação de campos obrigatórios)
  - Teste primeiro:
    - `project-modal.component.spec.ts`: submit com nome vazio/curto e sem tipo deve manter o formulário inválido, não chamar `createProject`/`updateProject` e exibir a mensagem de validação.
    - Backend: PUT com nome inválido ou tipo ausente deve retornar 400 sem persistir.
  - Correções obrigatórias: nenhuma de produção se o comportamento já estiver correto; se o teste revelar falha, corrigir.
  - Migration: nenhuma
  - Arquivos previstos:
    - `apps/web/src/app/shared/components/project-modal/project-modal.component.spec.ts`
    - testes backend de validação de projeto

---

## Critérios sem tarefa

*(Vazio — todos os critérios CA1 a CA10 estão cobertos pelo plano acima)*
