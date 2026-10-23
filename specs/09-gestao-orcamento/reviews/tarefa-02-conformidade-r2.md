# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

## Critérios verificados

| Critério | Situação | Onde |
| --- | --- | --- |
| Correção aceita na r1: lista das 9 categorias (`PREDEFINED_CATEGORY_NAMES`) removida do serviço | atendido | `apps/api/src/main/java/com/obracerta/service/DemoDataSeederService.java` — grep não encontra o símbolo no serviço (só em `BudgetSchemaMigrationTest`, arquivo da Tarefa 1, intocado) |
| Guarda deriva os nomes exigidos da **união de `DEMO_BUDGETS` e `DEMO_EXPENSES`** (`distinct`), sem terceira cópia da V7 | atendido | `DemoDataSeederService.java:180-190` |
| Guarda valida **apenas** esses nomes e lança `IllegalStateException` **com os nomes faltantes** | atendido | `DemoDataSeederService.java:160-178` (mensagem em `:172-174`) |
| Caminho feliz do teste fornece **apenas as 5 categorias usadas** | atendido | `DemoDataSeederServiceTest.java:301-308` (5 `ExpenseCategory`) e `:247` |
| Teste “categoria usada ausente → `IllegalStateException` com o nome faltante” | atendido | `DemoDataSeederServiceTest.java:205-222` (`hasMessageContaining(HIDRAULICA)` em `:212-214`, sem nenhum `save` em `:216-221`) |
| Seed cria **usuário demo** (`demo@obracerta.com`, papel `USER`, senha codificada) | atendido (por leitura) | `DemoDataSeederService.java:130-133`; prova em `DemoDataSeederServiceTest.java:104-109` |
| Seed cria **obra demo** vinculada ao usuário e **fornecedor demo** | atendido (por leitura) | `DemoDataSeederService.java:140-158`; prova em `DemoDataSeederServiceTest.java:111-117` |
| **5 orçamentos**, com **Hidráulica zerada e com despesa** (pré-requisito de CA3) e total planejado **R$ 85.000,00** | atendido (por leitura) | `DemoDataSeederService.java:60-66`; totais em `DemoDataSeederServiceTest.java:123-130`; vínculo da zerada em `:165-172` |
| **6 despesas**, total gasto **R$ 53.100,00**, com vínculo a orçamento, obra, usuário, categoria e fornecedor | atendido (por leitura) | `DemoDataSeederService.java:68-80`; `DemoDataSeederServiceTest.java:137-163` |
| **Segunda execução não duplica**: usuário + obra existentes → retorno **antes de qualquer save** | atendido (por leitura + `never()`) | `DemoDataSeederService.java:109-113`; `DemoDataSeederServiceTest.java:183-203` |
| Usuário existente + obra ausente → completa o cenário; usuário ausente → cria (reordenação não alterou idempotência) | atendido (por leitura; branch de completude sem teste dedicado) | `DemoDataSeederService.java:109-128` |
| Runner **condicional à propriedade** e **restrito ao perfil `dev`**; default resolve para falso | atendido | `apps/api/src/main/java/com/obracerta/configuration/DemoDataSeederRunner.java:19-26`; `apps/api/src/main/resources/application-dev.properties:22` (`${SEED_ENABLED:false}`) |
| Senha **codificada** pelo `PasswordEncoder` e **não logada** | atendido | `DemoDataSeederService.java:132`; `DemoDataSeederRunner.java:41-43` (log sem senha); `DemoDataSeederServiceTest.java:105-108` |
| Nenhum escopo novo: apenas os 5 arquivos da tarefa + 3 registros de `reviews/`; sem migration, frontend, `SecurityConfigurations`, `plan.md`, `spec.md` ou `PREDEFINED_CATEGORIES` | atendido | `git diff 10a56c0 --name-only` → 8 caminhos; `git status --porcelain` sem nada fora disso; `git diff --stat` vazio (nada não staged) |
| Sugestões não bloqueantes da r1 **não** implementadas, conforme item 5 da decisão | atendido | `matchIfMissing = false`, `findFirstByName`, datas fixas e asserção do fornecedor (`DemoDataSeederServiceTest.java:117`) permanecem como estavam |
| Execução do teste direcionado e da suíte completa | não executado — **limitação de ambiente já decidida na r1** | `.\mvnw.cmd` segue retornando `Permission denied: shell` neste sandbox, como em `reviews/tarefa-02-decisoes-r1.md:3-14`. Confirma-se o número reportado pelo orquestrador: 3 testes nesta classe (2 da r1 + o caso novo) ⇒ 38 + 1 = **39/39**. Todo o parecer acima é estático, por inspeção do diff |
| Nome do seeder: `spec.md:60` diz `DevDemoDataSeeder`; código usa `DemoDataSeederService` + `DemoDataSeederRunner` | observação (não bloqueia; já registrada na r1) | `specs/09-gestao-orcamento/spec.md:60` × `DemoDataSeederService.java:49` / `DemoDataSeederRunner.java:26` |

## Apontamentos

Nenhum apontamento bloqueante. A correção aceita da r1 está presente e completa (guarda derivada de `DEMO_BUDGETS ∪ DEMO_EXPENSES`, mensagem com os nomes faltantes, caminho feliz só com 5 categorias e caso de categoria ausente coberto); o cenário da tarefa e a idempotência permanecem intactos, e o diff não traz escopo novo. Permanecem apenas as observações não bloqueantes já conhecidas e não promovidas pela decisão da r1.
