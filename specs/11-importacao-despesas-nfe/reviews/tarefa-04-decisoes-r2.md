# Decisões — Tarefa 4, rodada 2

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Rota `/nfe/confirm` diverge do plano (`/nfe/imports`) (`NfeImportController.java:~31`) | conformidade | aceito | O plano é a referência. Correção pendente: renomear a rota para `/imports` ou corrigir o plano. |
| 2 | Busca de orçamento duplicada em `ExpenseService.update` (`ExpenseService.java:181-182`) | código | aceito | Deve passar pelo `ExpenseReferenceResolver.resolveBudget`. |

Sugestões não triadas: teste de 404 para obra inexistente e excluída no `confirm`; `categoryId` malformado virando 500; normalização e validação de 14 dígitos do CNPJ na importação.

Observação de ambiente: `ExpenseRegistrationIntegrationTest` depende de contagem global de fornecedores sem limpeza. Defeito pré-existente, candidato a manutenção.

**Escalada:** itens aceitos na rodada 2 encerram o ciclo da Tarefa 4 (não existe rodada 3). Os ajustes seguem em nova tarefa, com contador de rodadas reiniciado.
