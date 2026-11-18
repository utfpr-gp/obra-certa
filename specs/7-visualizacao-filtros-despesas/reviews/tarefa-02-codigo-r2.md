# Parecer de Código — Tarefa 2

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum.

## Evidências

- **Erro padronizado:** `GlobalExceptionHandler` trata `MethodArgumentTypeMismatchException` e retorna `ApiErrorResponse` com status 400 e `fieldErrors` (`GlobalExceptionHandler.java:95-108`).
- **Camadas:** fluxo `Controller → Service → Repository → Mapper` preservado; o controller não acessa repository (`ExpenseController.java`, `ExpenseService.java`).
- **Enum:** `ExpenseTab` define exatamente `ALL`, `PENDING`, `OVERDUE` e `PAID`.
- **Clock:** `ExpenseService` injeta `Clock` e calcula uma única `referenceDate` por consulta.
- **Queries:** filtram obra própria/ativa e despesas não excluídas; regras de vencimento e pagamento estão na query (`ExpenseRepository.java:15-36`).
- **Frontend:** componente usa signals, `@for`/`@if`, `inject()` e acessa a API exclusivamente por `ExpenseService`.
- **Testes:** cobertura de abas, vencimento, exclusão lógica, data de referência e erro de aba inválida em `ExpenseSituationListingIntegrationTest`; teste Angular cobre abas vazias e retorno à primeira página.
- **Escopo:** não foram introduzidos filtros, ordenação, totalizadores ou migrações da tarefa posterior.

## Sugestões (não bloqueiam)

- Adicionar `@Validated` ao controller para garantir que `@Min/@Max` em `page` e `size` sejam realmente aplicados.
- Expandir o teste para afirmar explicitamente que vencimentos nulos e do dia não aparecem em `OVERDUE`.
- A invalidação frontend ainda compara apenas `projectId`; concorrências da mesma obra permanecem responsabilidade da Tarefa 7.

## Testes

Não foi possível executar os comandos nesta sessão por ausência de shell disponível.

Evidências pré-existentes consultadas:

- `api-r2-suite.log`: 125 testes aprovados.
- `web-r2-suite.log`: 196 testes aprovados.
- `web-r2-green.log`: execução específica distinta falhou em `accounts-navigation.spec.ts`; não corresponde diretamente ao teste de situação desta tarefa.

Nenhum arquivo foi alterado.
