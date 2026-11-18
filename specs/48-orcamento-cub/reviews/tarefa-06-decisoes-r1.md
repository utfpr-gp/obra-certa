# Decisões — Tarefa 6, rodada 1

| # | Apontamento | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Os dois testes de log passam por vacuidade: o fluxo SINAPI não tem `Logger`, a lista capturada fica vazia, e as asserções só olham a mensagem formatada no nível INFO (`BudgetControllerTest.java:241-274`, `BudgetSinapiConfirmationIntegrationTest.java:371-405`) | Código | Aceito | O autor solicitou o ajuste. Confirmado no código: nenhum `Logger` em `SinapiReferenceService`, `SidraClient` ou `BudgetService`. |
| 2 | Import concatenado em uma única linha, introduzido por este diff (`BudgetControllerTest.java:13`) | Código | Aceito | O autor solicitou o ajuste. Regressão de formatação criada na tarefa. |
