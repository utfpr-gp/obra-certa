# Parecer de Conformidade — Tarefa 5 (Issue 48, rodada 1)

**Veredito:** APONTAMENTOS

Duas limitações da minha leitura, que o orquestrador deve considerar:
- O shell foi recusado (`permission.rejected`). Não rodei `git diff --cached bf9959e` nem a suíte. Li os arquivos da árvore de trabalho, que devem refletir o índice mas não foram comparados ao commit `bf9959e`.
- Por isso, a suíte não conta como verificada. Ela entra como pendência de verificação, não como critério atendido.

## Critérios verificados

| Critério (da spec / plano) | Situação | Onde |
| --- | --- | --- |
| CA3: prévia identifica categoria com teto existente e mostra o valor, inclusive zero | **não atendido** (falso positivo para categoria só com despesa) | `sinapi-form.component.ts:125` e `:148`; `sinapi-form.component.html:100-101` |
| CA3: prévia mostra zero como teto existente | atendido | `sinapi-form.component.spec.ts:245` (`R$ 0,00 preservado`) |
| CA3: cria tetos só com parcela positiva e sem teto ativo | atendido | `BudgetService.java:231-237`; teste `BudgetSinapiConfirmationIntegrationTest.java:128-137` |
| CA3: parcela zero não cria teto | atendido | `BudgetService.java:231-232`; teste `BudgetSinapiConfirmationIntegrationTest.java:179-193` |
| CA3: excluídas ficam sem redistribuição | atendido | `BudgetService.java:231` (`continue`, sem recálculo) |
| CA4: verifica de novo os tetos ativos, dentro da transação | atendido | `BudgetService.java:215`, `:223-227` |
| CA4: preserva tetos criados após a prévia | atendido (via `ON CONFLICT`) | `BudgetRepository.java:38-48`; teste `BudgetSinapiConfirmationIntegrationTest.java:270-307` |
| CA4: falha em um teto novo reverte o lote | atendido | `BudgetService.java:215` (`TransactionTemplate`); teste `BudgetSinapiConfirmationIntegrationTest.java:252-267` |
| CA4: repetição preserva e não duplica | atendido | `BudgetService.java:223-244`; teste `BudgetSinapiConfirmationIntegrationTest.java:196-208` |
| CA4: obra precisa ser do proprietário autenticado | atendido | `BudgetService.java:196-197`; teste `BudgetSinapiConfirmationIntegrationTest.java:151-162` |
| Plano: 200 com `created` e `preserved` | atendido | `BudgetController.java:79-86`; `SinapiConfirmationDTO.java` |
| Plano: 409 quando o custo mudou | atendido | `BudgetService.java:206-213`; teste `BudgetSinapiConfirmationIntegrationTest.java:140-148` |
| Plano: 404 de obra alheia antes do SIDRA e da gravação | atendido | `BudgetService.java:196-206`; teste `:151-162` |
| Plano: 400 para ordem fora do PRD | atendido | `BudgetService.java:248-267`; teste `:211-221` |
| Plano: 400 para custo negativo antes do banco | atendido | `SinapiConfirmDTO.java:22` (`@Positive`); teste `:224-231` e `BudgetControllerTest.java:352-360` |
| Plano: categorias únicas, percentuais e soma 100% | atendido | `BudgetService.java:250-252`; `SinapiAllocationCalculator.java:80-95`; teste `:234-249` |
| Plano: sem migration nova | atendido | Migrations em `db/migration` vão de V1 a V13; nenhuma V14 |
| Plano: `ddl-auto` inalterado (`validate`) | atendido | `application-test.properties:11`, `application-dev.properties:12`, `application-prod.properties:12` |
| Plano: front recarrega só após sucesso | atendido | `sinapi-form.component.ts:232-234` (`confirmed` só no `next`); `budget-form-modal.component.html:50`; `budgets-page.component.ts:134-141`; teste `budgets-page.component.spec.ts:553-590` |
| Plano: front marca preservados | parcialmente atendido (ver apontamento 1) | `sinapi-form.component.html:100-101` |
| Escopo: nada além da tarefa | **não atendido** (ver apontamento 2) | `BudgetController.java:46-53` |

## Apontamentos

1. **Categoria só com despesa aparece como "Teto atual R$ 0,00 preservado". Bloqueia (CA3).**
   - `apps/web/src/app/features/budgets-page/components/sinapi-form/sinapi-form.component.ts:125` monta `existing` com `row.plannedAmount` de **todas** as linhas de `existingBudgets`, sem filtrar `hasBudget`.
   - `BudgetService.java:97-102` cria linhas de categorias que só têm despesa, com `plannedAmount = 0` e `hasBudget = false` (`BudgetService.java:330-335`, `:289-300`).
   - Resultado: `sinapi-form.component.html:100` exibe o marcador "preservado" para essas categorias, mesmo sem teto. CA3 pede que a prévia identifique apenas as categorias com teto existente.
   - O teste `sinapi-form.component.spec.ts:58-69` só cria tetos com `hasBudget: true`, então o caso não é coberto.
   - Correção sugerida para o autor decidir: filtrar por `row.hasBudget` ao montar `existing`, e acrescentar um teste com categoria `hasBudget: false` e despesa.

2. **`@ExceptionHandler` local em `BudgetController` altera o PUT de orçamento. Bloqueia pela regra "comportamento que a spec não pediu".** Escopo extra, a decidir pelo autor.
   - `BudgetController.java:46-53` registra um handler para `MethodArgumentNotValidException` no controller inteiro. Ele passa a valer também para `PUT /api/budgets/{projectId}/categories/{categoryId}` (`BudgetController.java:71-77`).
   - Efeito: os 400 de validação do PUT passam a ter `Cache-Control: no-store`. O corpo continua igual, porque delega a `GlobalExceptionHandler.handleMethodArgumentNotValid`.
   - A spec e o plano pedem `no-store` para o fluxo SINAPI (`plan.md:12`, Tarefa 6). Nenhum teste cobre o PUT com esse header.
   - Alternativa: setar o header apenas nos métodos do fluxo SINAPI, ou restringir o handler a eles.

## Sugestões (não bloqueiam)

- Acrescentar teste no `sinapi-form.component.spec.ts` para categoria só com despesa (`hasBudget: false`). Ele pegaria o apontamento 1.
- Um `finishId` que sumiu da consulta também vira 409 "custo mudou" (`BudgetService.java:208-213`). A mensagem é aceitável, mas não é o caso descrito no plano. Vale o autor confirmar.
- O teste `falhaNoMeioDoLoteRevertTodosOsTetosNovos` (`BudgetSinapiConfirmationIntegrationTest.java:252-267`) prova o rollback pela ausência de tetos, o que é a asserção certa. O 409 depende do mapeamento de `DataIntegrityViolationException` no `GlobalExceptionHandler`, que já existia.

## Observações fora do escopo

- `BudgetController.java:88-93` (`zeroBudget`) e o `setBudget` não mudaram nesta tarefa. Não avaliei além do que estava no diff.

## Pendência de verificação (não atribuída à tarefa)

- `ExpenseRegistrationIntegrationTest`: 9 falhas na suíte completa do backend. Não há evidência no diff de que ela seja causada pela tarefa. O `@AfterEach` de `BudgetSinapiConfirmationIntegrationTest` remove só as próprias fixtures (`:113-125`), com deleções escopadas por obra e usuário. Não rodei a suíte, então a causa (resíduo de banco de teste) continua não confirmada.
- Comandos a rodar pelo orquestrador, com shell liberado: `mvn test` (ou equivalente) em `apps/api` e `npm test` em `apps/web`, para confirmar a suíte e os testes citados acima.
