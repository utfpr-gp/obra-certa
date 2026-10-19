# Parecer de Código — Tarefa 01

**Veredito:** APONTAMENTOS

*Limitação de execução:* o shell deste sandbox só liberou comandos `git` — `.\mvnw.cmd test` foi rejeitado (`Permission denied`) e `docker` também. Julguei por leitura do diff. Registro ainda que **não existe Testcontainers no diff nem no `pom.xml`**: o teste cai no datasource do perfil ativo (`application.properties:52` → `dev` → `localhost:5432`), e no CI num Postgres de serviço (`.github/workflows/ci.yml:17-56`).

## Apontamentos (bloqueiam)

1. **`project_id` nasce anulável em `budgets` e `expenses`** — `V2__create_projects_and_project_fk.sql:23`, `:26`; `Budget.java:32-34`; `Expense.java:27-29`
   Regra violada: `docs/architecture.md:176` (`budgets.project_id` "not null, FK -> projects(id)") e `:197` (`expenses.project_id`, idem). Reforçado pela spec já existente no repo, `specs/005-entidade-project-e-crud/spec.md:27` ("nullable = false") e `:43` ("Todas as despesas e orçamentos registrados devem conter um `project_id` válido").
   Prejuízo concreto: a coluna anulável + `@JoinColumn` sem `nullable = false` deixa o banco aceitar despesa/orçamento sem obra — exatamente o furo que a US14 existe para fechar. Nada no schema ou na entidade impede `INSERT` órfão, e o `ddl-auto=validate` não acusa (validate não confere nullability). Todo o filtro de escopo por obra e o Anti-IDOR da Tarefa 2 passam a ter uma linha de fuga silenciosa. Além disso, quando a Tarefa 4 (CA4, "inativa os vínculos de despesas e orçamentos") precisar de `NOT NULL`, o conserto exige outra migration com backfill — em tabela que já vai estar populada.
   *Ressalva honesta:* se a escolha foi consciente porque o banco dev já tem linhas em `budgets`/`expenses` sem obra para backfillar, então (a) isso precisa estar escrito no `plan.md` e (b) o `V3` de backfill + `SET NOT NULL` precisa existir como tarefa nomeada antes do merge — nenhuma das duas coisas existe hoje.

2. **O teste não é autocontido e grava lixo no banco do perfil ativo** — `ProjectSchemaMigrationTest.java:23` (`@SpringBootTest`, sem `@ActiveProfiles`), `:146-153` e `:165-178`
   Regra violada: `docs/architecture.md:355` e `:380` (testes contra "PostgreSQL 16+ via Testcontainers Singleton", `@DataJpaTest` + Testcontainers) — e o próprio `plan.md:52`, que exige "Teste de integração do Spring Boot com Flyway e Testcontainers".
   Prejuízo concreto: não há Testcontainers (nem no `pom.xml`), nem `@Transactional`/limpeza. Rodando o comando documentado (`.\mvnw.cmd test`) sem `SPRING_PROFILES_ACTIVE=test`, o teste conecta no Postgres **de desenvolvimento** (`application-dev.properties:2`) e **commita** `user.fk@test.com` e `Categoria FK Test` no banco que a aplicação usa — sem rollback, sem `@DirtiesContext`, e o `ON CONFLICT (email) DO NOTHING` só mascara a sujeira acumulada. Em máquina sem esse Postgres, o teste falha por `Connection refused`, não por causa da migration — o resultado passa a depender do ambiente, não do código. Para provar a V2 de forma reprodutível é preciso container efêmero (ou, no mínimo, `@ActiveProfiles("test")` explícito + rollback/limpeza).

3. **A asserção amarra o teste à versão corrente do Flyway** — `ProjectSchemaMigrationTest.java:41-43`
   Regra violada: lista de reprova ("teste acoplado a detalhe de implementação, que quebra em qualquer refatoração") + `docs/architecture.md:365` ("correções são feitas sempre para frente (`V<N+1>`)").
   Prejuízo concreto: a arquitetura **manda** criar a próxima migration para frente; qualquer `V3` (por exemplo o `deleted_at` de `budgets`/`expenses` que a Tarefa 4 vai precisar) faz `getVersion()` virar `"3"` e quebra este teste — que não tem nada a ver com aquela mudança. A mensagem ainda diz "no minimo 2" enquanto a asserção é de igualdade, o que confunde quem for consertar. As validações de coluna/FK logo abaixo já provam a V2 sem essa pinagem.

4. **Enums criados em `com.obracerta.model.enums`, e não em `com.obracerta.enums`** — `ProjectType.java:1`, `ProjectStatus.java:1`
   Regra violada: `docs/architecture.md:69` declara `enums/` como **irmão** de `model/`, no mesmo nível de `controller/`, `service/`, `repository/`; o repo já segue isso em `apps/api/src/main/java/com/obracerta/enums/UserRole.java:1`.
   Prejuízo concreto: o projeto passa a ter duas casas para o mesmo tipo de artefato — `UserRole` em `com.obracerta.enums` e `ProjectType`/`ProjectStatus` em `com.obracerta.model.enums`. `ExpenseType` e `PaymentStatus` são declarados no `architecture.md:69` no pacote `enums/`, e as tarefas seguintes (service, mapper, DTOs) vão importar de dois lugares diferentes. Note que a divergência nasceu do `plan.md:57-58`, que aponta `model/enums/` — ou seja, é preciso resolver o conflito `plan.md` × `architecture.md` (mover o código e corrigir o plano, ou atualizar a árvore da arquitetura e mover `UserRole` junto). Deixar como está é a única opção que garante a duplicação.

## Sugestões (não bloqueiam)

- `docs/architecture.md:227-236` declara índices que dependem justamente das colunas criadas aqui (`idx_budgets_project_category_active`, `idx_expenses_project_nfe_active`, `idx_expenses_project_date`, `idx_expenses_project_category`) e nenhuma tarefa do `plan.md` os cria. Sem eles, a regra de "orçamento único por categoria" e o filtro `?projectId=` (`architecture.md:327`) ficam só na intenção. Vale decidir agora se entram num `V3` desta issue.
- Não há índice algum em `budgets.project_id` / `expenses.project_id` isoladamente; as consultas por obra das próximas tarefas vão fazer *seq scan*.
- `Project.deletedAt` está como `LocalDateTime` (`Project.java:35-36`), enquanto `plan.md:12` fala em `deleted_at = Instant.now()`. O tipo escolhido agora define o contrato da Tarefa 4; `Instant` + `Clock` injetável é o que o `architecture.md:296-297` descreve e evita conversão de fuso na comparação (`TIMESTAMP` sem timezone não ajuda).
- As asserções `hasMessageContaining("fk_projects_user")` / `("fk_budgets_project")` (`:153`, `:183`) amarram o teste ao nome físico da constraint; como o nome é definido nesta mesma migration, é aceitável — mas quebra silenciosamente se alguém renomear a constraint num `V3` de manutenção.
- O `ddl-auto=validate` do CA10 é provado só indiretamente (subida de contexto); com o perfil `test` isso está garantido por `application-test.properties:11`, mas o teste não falha de forma explícita se o perfil ativo deixar de ter `validate`.

## Observações fora do escopo deste diff

- **Sem execução de testes:** não consegui rodar `.\mvnw.cmd test` (shell restrito a `git`) nem confirmar Docker. Os apontamentos 2 e 3 são por leitura.
- `V1__baseline_schema.sql` não cria `deleted_at` em `budgets`, `expenses` nem `pending_payments`, embora o MER (`architecture.md:181`, `:211`, `:222`) e a política de soft delete (`:346`) exijam — e a Tarefa 4 (CA4) depende disso. Dívida pré-existente, mas é ela que quebra o apontamento 3 na prática: o `V3` é inevitável.
- V1 usa `VARCHAR(36)` e `TIMESTAMP` sem timezone onde a arquitetura pede `uuid` nativo e `timestamptz` (`architecture.md:128`, `:154-164`). A V2 **acertou** ao seguir a V1 (a FK precisa do mesmo tipo de `users.id`); a correção é sistêmica, não desta tarefa.
- `apps/api/src/main/java/com/obracerta/services/` (plural) diverge do `service/` de `architecture.md:60`; `pom.xml` não tem Testcontainers apesar de `architecture.md:355`/`:380`; `application-test.properties` e o `ci.yml` documentam Postgres de serviço. O `architecture.md` está desatualizado nesses pontos — vale uma issue de reconciliação do documento, senão todo revisor vai cobrar Testcontainers de novo.
- `specs/005-entidade-project-e-crud/spec.md` descreve a mesma entrega desta issue (tabela `projects`, `project_id` em budgets/expenses, endpoints `/api/projects`) e segue "⚪ Aguardando Implementação" (`specs/README.md:15`). Duas ordens de serviço para o mesmo schema: risco de trabalho duplicado ou de conflito de migrations. Fechar/redirecionar a #005 é decisão de processo.
