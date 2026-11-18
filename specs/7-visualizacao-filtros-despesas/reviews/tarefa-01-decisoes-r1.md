# Decisões — Tarefa 1, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Cobertura insuficiente dos testes para comprovar integralmente CA1 e CA8 | conformidade | aceito | O teste deve demonstrar explicitamente os campos do contrato, a exclusão lógica, o isolamento e a ausência de acesso a comprovantes. |
| 2 | Possível N+1 ao mapear categoria, fornecedor e pagamento | código | aceito | A listagem paginada deve evitar consultas adicionais por registro e preservar desempenho previsível. |
| 3 | Falhas HTTP sem estado de erro, feedback ou retry | código | aceito | A tela precisa informar falhas de consulta e permitir nova tentativa sem apresentar sucesso ou dados antigos como atuais. |
