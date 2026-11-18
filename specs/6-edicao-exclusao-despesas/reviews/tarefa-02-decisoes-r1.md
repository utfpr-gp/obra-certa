# Decisões — Tarefa 2, rodada 1

O autor autorizou a continuidade e o tratamento dos problemas relatados: “Continue o processo da tarefa 2 e verifique esses problemas”.

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Testes Angular não compilam: tipo de receiptState no fixture saved | conformidade/código | aceito | Corrigir a tipagem e executar os testes. |
| 2 | Testes backend não executam com o banco configurado incorretamente | conformidade | aceito | Executar com PostgreSQL exclusivo para testes e verificar o resultado real. |

A execução com PostgreSQL em `target/us04-t2-check-root.log` passou pelo Flyway, mas revelou `No default constructor found` ao criar ExpenseService. A correção dessa falha de inicialização faz parte do tratamento da execução backend autorizada; deve usar o Clock existente no contexto Spring. O alerta sobre os dois construtores, antes registrado como sugestão, possui agora evidência de falha em execução.

As sugestões sobre índice e omissão de dueDate no payload pago não foram promovidas a correções.
