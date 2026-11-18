# Parecer de Código — Tarefa 5

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum.

O diff preserva as camadas: o controller delega ao serviço, que valida a posse da obra antes de consultar o orçamento. `zeroBudget` executa em transação, altera o registro existente e reutiliza os cálculos de saldo, percentual e estado.

No frontend, a comunicação HTTP permanece no serviço tipado, com URL derivada de `environment.apiUrl`. A página usa signals, `computed`, controle de fluxo `@if` e o `ConfirmModalComponent` compartilhado. O teste acrescentado para `hasBudget: true` com `plannedAmount: 0` verifica o comportamento visível sem depender de métodos privados.

**Validação executada nesta revisão:** `.\mvnw.cmd test`, em `apps/api`, com perfil `test` e PostgreSQL local: **63 testes, zero falhas, zero erros e zero ignorados**. Frontend e build não foram reexecutados por este revisor; foram informados no despacho e ficaram sob validação paralela.

## Sugestões (não bloqueiam)

- `apps/api/src/main/java/com/obracerta/service/BudgetService.java:152`: a montagem de `CategoryRow` repete a sequência de `setBudget`. Uma futura extração pode centralizar essa montagem; os cálculos financeiros já permanecem compartilhados em `toCategory`.
- `apps/web/src/app/features/budgets-page/budgets-page.component.spec.ts:467`: o teste de confirmação verifica chamada e recarga. Usar uma segunda resposta de painel com valores zerados também demonstraria a atualização visível após a recarga.

## Observações fora do escopo deste diff

- O tratamento de falhas de zeramento permanece pendente da Tarefa 9, como previsto no plano e indicado no comentário do handler.
- `docs/architecture.md` descreve `CHECK > 0`, enquanto a migration V6 já permite zero. Também estabelece `201 Created` para todo POST, enquanto o plano aprovado define `200 OK` para a ação de zeramento. São ajustes de documentação.
- A conversão de orçamento para DTO dentro do serviço antecede esta tarefa, embora a arquitetura descreva uma camada `mapper/`. Pode ser avaliada em manutenção separada.
