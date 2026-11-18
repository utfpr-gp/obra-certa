# Parecer de Conformidade — Tarefa 4 (rodada 2)

**Veredito:** APROVADO

> **Nota de execução:** o harness desta sessão bloqueou shell para tudo que não é `git` (`npx ng test` e `.\mvnw.cmd` → `Permission denied: shell`), então **não executei os testes**. O parecer é estático sobre o diff `git diff d3486ba` (20 arquivos, sem migration). O despacho registra que o orquestrador executou frontend 124/124 e backend 59/59 após a correção — informação de contexto, não atestada por mim.

## Rodada 1

O único apontamento bloqueante está **resolvido**:

- `budgets-page.component.spec.ts:326-350` (“Editar”): agora preenche o valor (`setField('budget-form-amount','1800')`, `:339`), clica `budget-form-submit` (`:340`), asserta `setBudget(project.id,'cat-alvenaria',{estimatedAmount:1800})` (`:343-347`), `getOverview.calls.count() === 2` (`:348`) e o fechamento do modal (`:349`).
- `budgets-page.component.spec.ts:352-374` (“Definir teto”): idem, com `define-ceiling-cat-hidraulica`, valor `900`, `setBudget` (`:367-371`), segundo `getOverview` (`:372`) e modal fechado (`:373`).
- O caminho “Adicionar orçamento” (`:302-324`) permaneceu intacto, e os três caminhos agora provam o encadeamento página → modal → serviço → recarga. Nenhuma asserção anterior foi afrouxada.

## Critérios verificados

| Critério (da spec/plano) | Situação | Onde |
| --- | --- | --- |
| CA1 — cria o teto quando não há registro ativo | atendido | `BudgetService.java:123-131`; `BudgetServiceTest.java:197-233` |
| CA1 — atualiza o registro existente sem duplicar (RN08) | atendido | `BudgetService.java:123-131`; `BudgetServiceTest.java:235-266` (`times(1)` no `save`) |
| CA1 — um único orçamento ativo por par obra/categoria | atendido | `BudgetRepository.java:15` + índice único parcial da V6 (Tarefa 1) |
| CA1 — vínculo do orçamento com o dono da obra | atendido | `BudgetService.java:126`; `BudgetServiceTest.java:227-232` |
| CA1 — devolve planejado, gasto e percentual recalculados | atendido | `BudgetService.java:133-137` e `toCategory` (`:148-160`); asserts em `BudgetServiceTest.java:220-225`; `BudgetControllerTest.java:57-82` |
| CA7 (escrita) — 404 “Projeto não encontrado” para obra alheia no `PUT` | atendido | `BudgetService.java:118-119`; `BudgetServiceTest.java:268-280`; `BudgetControllerTest.java:84-94` |
| CA7 (escrita) — 404 “Categoria não encontrada”, sem revelar existência | atendido | `BudgetService.java:120-121`; `BudgetServiceTest.java:282-296`; `BudgetControllerTest.java:96-119` |
| Plano — `PUT …/{projectId}/categories/{categoryId}` → 200 com `BudgetCategoryDTO` | atendido | `BudgetController.java:32-38`; `BudgetControllerTest.java:57-82` |
| Plano — `BudgetSetDTO` com `@NotNull`, `@DecimalMin("0.01")`, `@Digits(13,2)` e mensagem única | atendido | `BudgetSetDTO.java:9-13` |
| Plano — modal prova categoria travada na edição, envio do valor e cancelamento | atendido | `budget-form-modal.component.spec.ts:70-80`, `:92-121`, `:123-131` |
| Plano — página prova “Adicionar orçamento”, “Definir teto” e “Editar” chamando o serviço e recarregando o painel | atendido | `budgets-page.component.spec.ts:302-324`, `:326-350`, `:352-374` |
| Migration: nenhuma | atendido | `git diff --stat d3486ba` sem arquivos em `db/migration` |
| Arquivos previstos pelo plano | atendido | todos os 8 previstos presentes; nenhum arquivo de produção extra |

Verificações adicionais de não-regressão: o `GET` (Tarefa 3) continua `readOnly` e intocado (`BudgetService.java:59-113`); a guarda Anti-IDOR resolve a obra antes de tocar categoria/orçamento/despesa, o que garante o mesmo 404 para obra inexistente e alheia; `ResourceNotFoundException()` sem argumento continua com “Projeto não encontrado” (`ResourceNotFoundException.java:5-7`), então as leituras não mudaram; o modal é o componente real nos testes de página (o mock de `BudgetService` é compartilhado), logo o clique em `budget-form-submit` exercita `ngSubmit` de verdade; nenhuma rota nova em `SecurityConfigurations`; `BudgetSetDTO`/`BudgetService.setBudget` espelham o contrato do plano e o glossário (`Budget`/`/api/budgets`).

## Apontamentos

Nenhum.
