# Parecer de Conformidade — Tarefa 2

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec / do plano) | Situação | Onde |
| --- | --- | --- |
| Seed cria **usuário demo** (`demo@obracerta.com`, papel `USER`, senha codificada) | atendido (por leitura) | `apps/api/src/main/java/com/obracerta/service/DemoDataSeederService.java:131-135` |
| Seed cria **obra demo** vinculada ao usuário | atendido (por leitura) | `DemoDataSeederService.java:142-150` |
| Seed cria **fornecedor demo** | atendido (por leitura) | `DemoDataSeederService.java:152-160` |
| Seed cria **orçamentos** por categoria, incluindo **categoria zerada com despesa** (pré-requisito de CA3) | atendido (por leitura) | `DemoDataSeederService.java:66-72` e `:180-197`; prova em `DemoDataSeederServiceTest.java:164-171` |
| Seed cria **despesas** com totais esperados (6 despesas, R$ 53.100,00; planejado R$ 85.000,00) | atendido (por leitura) | `DemoDataSeederService.java:74-86`; totais fixados em `DemoDataSeederServiceTest.java:122-140` e por categoria em `:145-149` |
| Cenário cobre os estados do painel (verde/amarelo/vermelho/zerado) para demonstração de CA2–CA4 | atendido (por leitura) | Elétrica 9.000/8.000 (estourado), Alvenaria 11.400/12.000 (95%), Fundação e Mão de Obra abaixo de 90%, Hidráulica 0 com despesa |
| **Segunda execução não duplica nada**, provado por `never()` nos `save` | atendido (por leitura) | `DemoDataSeederService.java:117-119`; `DemoDataSeederServiceTest.java:195-201` |
| Senha do demo **codificada** pelo `PasswordEncoder`, jamais crua no código Java nem em log | atendido (por leitura) | `DemoDataSeederService.java:134`; `DemoDataSeederRunner.java:41-43`; `DemoDataSeederTest.java:104-107` |
| Runner **condicional à propriedade** e **restrito ao perfil `dev`**; default resolve para falso | atendido (por leitura) | `DemoDataSeederRunner.java:20-25`; `apps/api/src/main/resources/application-dev.properties:22` (`${SEED_ENABLED:false}`) |
| **Nenhuma migration** criada e escopo restrito aos 5 arquivos previstos (sem frontend, sem `SecurityConfigurations`, sem `plan.md`/`spec.md`) | atendido | `git diff --cached --stat 10a56c0` → 5 arquivos, 599 inserções; `git status --porcelain` sem nenhum outro caminho |
| Nomes aderentes ao glossário (`Project`, `Supplier`, `Budget`, `Expense`, `ExpenseCategory`) e camada `Service`/`Repository`/`configuration` | atendido | `docs/architecture.md:245-249` e `:273-275`; pacotes em `service/`, `repository/`, `configuration/` |
| **Execução do teste direcionado e da suíte completa** | não atendido (bloqueio de ambiente) | ver Apontamento 1 |
| Nome do seeder: spec diz `DevDemoDataSeeder`; plano/diff usam `DemoDataSeederService` + `DemoDataSeederRunner` | observação (não bloqueia) | `specs/09-gestao-orcamento/spec.md:60` × `DemoDataSeederService.java:43` / `DemoDataSeederRunner.java:26` |
| Lista de categorias hardcoded no seeder duplica a V7 (`PREDEFINED_CATEGORY_NAMES`) | observação (não bloqueia; risco de drift, não de conformidade) | `DemoDataSeederService.java:55-64` / `:169-176` |

## Apontamentos

1. **Não foi possível executar `DemoDataSeederServiceTest` nem a suíte completa: o comando Maven não está liberado para este agente** — `.opencode/agents/revisor-conformidade.md:10-20`
   Critério violado: `specs/09-gestao-orcamento/plan.md:113` (o teste primeiro é parte da entrega da tarefa) e a própria regra do agente de que teste que não roda não conta como critério atendido.
   Evidência: a allowlist de `bash` cobre apenas `git diff/log/status`, `ls`, `cat`, `npm test*`, `npm run test*`, `npx vitest*` e `npx jest*`. Tentei `.\mvnw.cmd -Dtest=DemoDataSeederServiceTest test`, `cd apps/api; .\mvnw.cmd ...` e `mvn -v` — todos retornaram `Permission denied: shell`. A stack declarada é Java 21 / Spring Boot com Maven Wrapper (`docs/architecture.md:270`), portanto nenhum comando de teste do backend é liberado. Não há, no repositório, script npm que acione o Maven (`package.json:8` roda só o frontend). Também não pude delegar a execução a um subagente (`Subagent depth limit reached`). Consequência: **todas as linhas "atendido (por leitura)" acima vêm de inspeção estática do diff e do teste, não de execução** — nem a compilação do teste foi verificada. Recomendo acrescentar `".\\mvnw.cmd*"` e `"mvn*"` à allowlist antes do próximo despacho; sem isso o parecer sai incompleto para toda tarefa do backend.
