# Parecer de Código — Tarefa 1

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Validações de negócio escapam do contrato padronizado de erros** — `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:80`

   Regra violada: `docs/architecture.md`, §5.2.3: todas as falhas devem devolver o payload padronizado por `@RestControllerAdvice`, incluindo `message`, `path` e `fieldErrors`.

   Evidência: `invalid()` lança `ResponseStatusException`, mas `GlobalExceptionHandler` trata somente `BudgetBelowSpentException`, `ResourceNotFoundException` e `MethodArgumentNotValidException`. Assim, total zero, excesso de casas decimais, modo inválido e seleção ambígua de fornecedor seguem o tratamento padrão do Spring, fora de `ApiErrorResponse`.

   Prejuízo concreto: requisições inválidas ao mesmo endpoint passam a ter contratos de erro diferentes conforme a validação ocorra no DTO ou no serviço. Clientes não conseguem consumir consistentemente a mensagem e os campos previstos pela arquitetura.

## Sugestões (não bloqueiam)

- Acrescentar asserções do corpo padronizado nos testes HTTP de valores inválidos e fornecedor ambíguo; atualmente eles verificam apenas o status `400`, permitindo que essa divergência passe.
- Oferecer nova tentativa na consulta individual após falha transitória — `apps/web/src/app/features/expenses/expense-detail.component.ts:46`. Atualmente a recuperação exige recarregar a página.

## Observações fora do escopo deste diff

- O Maven emite aviso preexistente sobre o escopo `annotationProcessor` da dependência Lombok no `pom.xml`.

## Validação executada

- Diff completo revisado contra `a759ee390202c63dff785ccfaa6db0f7eae370a2`.
- `ExpenseServiceTest`: 9 testes passaram, sem falhas.
- `npm.cmd run build`: passou; aviso de bundle inicial de 589,01 kB para orçamento de 500 kB.
- Integração e Karma ficaram com o outro revisor, conforme despacho.
- Nenhum arquivo fonte foi alterado.
