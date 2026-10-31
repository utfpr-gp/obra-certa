# Decisões — Tarefa 1, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Validações de negócio escapam do contrato padronizado de erros: `ExpenseService.invalid()` usa `ResponseStatusException` sem tratamento em `GlobalExceptionHandler`. | código | aceito | O autor respondeu explicitamente “Sim, corrigir também” à pergunta sobre padronizar as respostas de erro de validação da API. |
| 2 | Acesso ao cadastro foi colocado como “Cadastrar despesa” no menu principal; deve ser um botão dentro de “Contas a pagar”, levando a `/despesas/nova`. | autor | aceito | Correção solicitada diretamente pelo autor: “O correto seria dentro de contas a pagar, ter um botao cadastrar conta, ou despesa, ou etc que leva a rota http://localhost:4200/despesas/nova”. |

As sugestões não bloqueantes do parecer de código não foram promovidas a apontamentos pelo autor. Testes de contrato necessários à correção do item 1 fazem parte dessa correção; não há aceite para ampliar esta rodada com recuperação de consulta individual.

O item 2 refina a navegação prevista na tarefa 1. `/contas` ainda não tinha rota implementada; sua entrada terá o botão solicitado, sem antecipar listagem geral de despesas ou gestão de pagamentos. O plano registra essa decisão de interface aprovada pelo autor.
