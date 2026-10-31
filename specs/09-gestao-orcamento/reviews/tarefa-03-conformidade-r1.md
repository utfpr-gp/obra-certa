# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

> **Execução dos testes.** Frontend: `npm.cmd test -- --watch=false --browsers=ChromeHeadless` (executa o script `ng test`, `apps/web/package.json:9`) → **112 SUCCESS**. O comando literal do despacho, `npx.cmd ng test --watch=false --browsers=ChromeHeadless`, foi recusado pelo harness: `{"error":{"type":"permission.rejected","message":"Permission denied: shell"},"content":[]}`. Backend: `.\mvnw.cmd test`, `mvnw.cmd test`, `.\mvnw.cmd -v` e os focados `-Dtest=BudgetServiceTest`, `-Dtest=ExpenseRepositoryTest`, `-Dtest=BudgetAntiIdorIntegrationTest` retornaram o mesmo `Permission denied: shell`; a lista de permissões do subagente (`.opencode/agents/revisor-conformidade.md:10-20`) não libera Maven/`ng`. **Não presumo que os testes de backend passaram**: os critérios de backend abaixo foram avaliados por leitura do diff e dos testes, não por execução.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2 — linhas para cada categoria com teto ou despesa ativa, com barra e percentual | atendido | `BudgetService.java:65-86` (união orçamento + despesa); `budgets-page.component.html:110-137`; testes `BudgetServiceTest.java:132-177`, `budgets-page.component.spec.ts:155-188` |
| CA2 — total planejado, total gasto, saldo (podendo ser negativo) e percentual global no topo | atendido | `BudgetService.java:88-110`; `budgets-page.component.html:42-77`; testes `BudgetServiceTest.java:60-98`, `budgets-page.component.spec.ts:143-153` |
| CA2 — verde < 90%, amarelo 90–99,99%, vermelho ≥ 100%, decidido pela razão exata | atendido | `BudgetService.java:127-148`; teste `BudgetServiceTest.java:100-130` (89,99% arredonda para 90,0% mas fica `ON_TRACK`; 90% vira `WARNING`; 100% vira `EXCEEDED`) |
| CA2 — total planejado R$ 0,00 → percentual global `—`, sem divisão por zero | atendido | `BudgetService.java:143-148` (`percentageOf` retorna `null` com `planned = 0`); `budgets-page.component.ts:64-72`; testes `BudgetServiceTest.java:132-160` (percentual nulo com teto zero) e `budgets-page.component.spec.ts:190-214` (UI com `globalPercentage: null` → `—`) |
| CA8 — estado vazio decidido por `categories.length === 0`, com totais zerados, texto literal e CTA | atendido | `budgets-page.component.ts:30`; `budgets-page.component.html:79-95`; testes `budgets-page.component.spec.ts:190-214` e `216-241` (com `totalPlanned = 0` e uma despesa sem teto, o onboarding não aparece — prova que não é decidido por `totalPlanned === 0`) |
| CA8 — sem obra ativa: não chama a API, orienta a selecionar/cadastrar e oferece link para a Home | atendido | `budgets-page.component.ts:36-45`; `budgets-page.component.html:1-19`; teste `budgets-page.component.spec.ts:243-254` (verifica ausência de chamadas e `href="/home"`) |
| CA7 (leitura) — obra de outro usuário e obra inexistente devolvem o mesmo 404 “Projeto não encontrado” | atendido | `BudgetService.java:59-61`; `BudgetController.java:21-24`; `BudgetAntiIdorIntegrationTest.java:57-92` (login real, três corpos normalizados iguais, inclusive id malformado) |
| Agregação real de despesas: soma só ativas, agrupa por categoria e isola por obra | atendido | `ExpenseRepository.java:15-24`; `ExpenseRepositoryTest.java:50-76` (PostgreSQL real via `@DataJpaTest` + `replace = NONE`; despesa soft-deleted e despesa de outra obra ficam fora) |
| `percentage` nulo sem teto, `NO_BUDGET`, `hasBudget` por registro ativo, `totalSpent` incluindo categoria sem teto e `budgetedCategories` por `planned > 0` | atendido | `BudgetService.java:113-125`; testes `BudgetServiceTest.java:132-177` |
| Retry de erro de carregamento e serviços HTTP tipados (`budget.service`, `category.service`) | atendido | `budgets-page.component.ts:50-55`; `budgets-page.component.html:31-40`; `budgets-page.component.spec.ts:256-276`; `budget.service.ts:14-17`; `category.service.ts:14-16`; testes `budget.service.spec.ts:36-48`, `category.service.spec.ts:30-40` |
| Placeholder “budgets works!” substituído pelo painel real | atendido | `budgets-page.component.html:1-156` (o diff remove a linha antiga); não há ocorrência de “budgets works” no código |

## Apontamentos

Nenhum apontamento.
