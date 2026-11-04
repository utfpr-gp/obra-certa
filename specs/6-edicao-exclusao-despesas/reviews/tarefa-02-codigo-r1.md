# Parecer de Código — Tarefa 2

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Teste não compila: `fixture.componentInstance.expense.set({...saved, …})` recebe tipo incompatível** — `expense-edit.spec.ts:169`
   Regra violada: architecture.md §9.1 — "Comando de Verificação de Tipos e Build: `npm run build` (com `strictTemplates: true`)" e §9.1 geral (testes devem ser executáveis).
   Prejuízo concreto: `npm run build` e `ng test` falham com `TS2345` porque o objeto `saved` é inferido sem anotação de tipo explícita; `receiptState` fica com tipo `string` em vez de `'NONE' | 'PENDING' | 'UPLOADED'`. O `.set()` do signal `expense: Signal<ExpenseResponse | null>` rejeita o argumento. O teste não roda — a cobertura de "pendente → paga" declarada na tarefa nunca é exercida.
   Correção mínima: anotar `const saved: ExpenseResponse = { … }` no topo do spec (ou adicionar `as const` no campo `receiptState`).

## Sugestões (não bloqueiam)

- **`ExpenseService` expõe dois construtores públicos** (`ExpenseService.java:161–179`): o construtor de sete parâmetros (com `Clock`) é público mas existe apenas para testes (injeção manual de `Clock`). A alternativa idiomática no Spring é marcar esse construtor como `@VisibleForTesting` ou usar `@Primary`/`@Bean` de Clock no contexto de teste via `@MockBean Clock clock` (o próprio teste já usa `@MockBean`). Não é violação de regra, mas o construtor extra sem anotação pode causar ambiguidade de injeção se outro `Clock` bean for registrado no futuro.

- **`dueDate` enviado como `undefined` quando `paid = true`** (`expense-edit-modal.component.ts:906`): o spread `...(!value.paid && value.dueDate ? {dueDate: value.dueDate} : {})` omite `dueDate` do payload quando pago. O teste de "pendente → paga" verifica `request.request.body.dueDate` como `undefined` — correto. Mas se o usuário salvar como pago e o campo interno ainda tiver valor (troca rápida de select), o campo não vaza. Comportamento aceitável; apenas documente a intenção.

- **Migration V10 não cria o índice de performance** `idx_payments_status_due` declarado em `architecture.md §3` (`CREATE INDEX idx_payments_status_due ON pending_payments (status, due_date) WHERE deleted_at IS NULL`): a migration adiciona as colunas mas não cria o índice. O índice pertence a esta migration ou a uma futura; como `architecture.md` o documenta como planejado (sem obrigação de entrega nesta tarefa), fica como sugestão.

## Observações fora do escopo deste diff

- Os testes backend (`PaymentSchemaMigrationTest`, `ExpensePaymentUpdateIntegrationTest`) falharam localmente por ausência de PostgreSQL — o perfil `test` tenta usar Flyway com SQL de índices parciais (`WHERE`) que H2 não suporta. Isso é infraestrutura local, não defeito do diff. Recomenda-se abrir Issue de manutenção para documentar o requisito de PostgreSQL na execução local dos testes de integração (ou configurar Testcontainers como fallback).
- `ExpenseUpdateIntegrationTest` (teste preexistente) foi ajustado corretamente para incluir `paid` no body e no `@ParameterizedTest`; nenhum defeito introduzido nessa parte.
