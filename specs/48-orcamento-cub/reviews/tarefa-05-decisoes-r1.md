# Decisões — Tarefa 5, rodada 1

| # | Apontamento | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Categoria só com despesa aparece como "Teto atual R$ 0,00 preservado" na prévia (`sinapi-form.component.ts:125`), e o servidor cria teto para ela | Conformidade e código | Aceito | O autor solicitou o ajuste. |
| 2 | `@ExceptionHandler` local no `BudgetController` altera o PUT de orçamento (`no-store` nos 400 de validação) | Conformidade | Aceito | O autor solicitou o ajuste. O `no-store` deve valer só para o fluxo SINAPI. |
| 3 | Fechar o modal durante o envio perde a recarga do painel (`budget-form-modal.component.ts:203-207`) | Código | Aceito | O autor solicitou o ajuste. |
| 4 | Estouro numérico vira erro errado: `ArithmeticException` vira 500 (`SinapiAllocationCalculator.java:49`); total acima de `NUMERIC(15,2)` vira 409 "custo mudou" | Código | Aceito | O autor solicitou o ajuste. Entrada do cliente fora do limite deve ser 400. |
