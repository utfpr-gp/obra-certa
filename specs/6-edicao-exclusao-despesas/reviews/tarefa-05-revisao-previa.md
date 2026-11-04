# Revisão prévia — Tarefa 5

Base da implementação: `bbbc358c1427447ec1adc963cc0fbba900fcc0f0`. Código da US04 permanece no estado aprovado da Tarefa 4 (`cd3002573bbe38b063b01316099dfbfd504c3444`). Conferência de escopo anterior à implementação, conforme a condição do autor no plano; não substitui os dois pareceres posteriores.

## Estado conferido

- Spec aprovada; Tarefas 1 a 4 concluídas. Tarefa 5 é a próxima pendente, sem pareceres de código ou conformidade.
- `ExpenseController` oferece criação, leitura e edição; não existe DELETE da despesa.
- Despesa e pagamento possuem `deleted_at`; o repositório de pagamento já existe. Nenhuma migration é necessária.
- A consulta de posse existente filtra despesa e obra ativas pelo proprietário. Os agregados financeiros somam somente despesas não excluídas.
- A exclusão física já existe em `ReceiptStorage`. A Tarefa 4 demonstrou o limite explícito de commit anterior à exclusão do arquivo; não introduziu fila ou agendamento.
- `ConfirmModalComponent` já oferece descrição, cancelar, X, Escape, confirmação bloqueada durante saving e backdrop inerte. O cancelamento continua possível durante envio, mas não desfaz uma operação já recebida pelo servidor.
- A rota `/contas` já existe e pode ser oferecida após sucesso, sem introduzir a listagem da US05.

## Contrato da tarefa

Confirmar a exclusão aplica soft delete na despesa e no pagamento existente na mesma transação. Preservar as linhas, o teto da categoria e o histórico de quitação. Depois do commit, tentar apagar o comprovante uma vez; falha não reativa registros e é comunicada por `receiptDeletionFailed` na resposta de exclusão. Não criar infraestrutura de recuperação ou prometer limpeza futura.

## Provas previstas

- Linhas permanecem no banco, pagamento fica inativo e gasto desaparece dos agregados, com teto preservado.
- Falha de persistência não apaga o arquivo; falha do storage mantém a exclusão financeira confirmada e informa o resultado real.
- Repetição e identificadores alheios/inexistentes/excluídos retornam 404 sem storage. Após exclusão, leitura, edição e operações de comprovante não acessam mais o registro.
- Abrir o diálogo não exclui. Cancelar, X e Escape antes do envio não fazem requisição. Backdrop é inerte e confirmação repetida durante envio não gera outro DELETE.
- Sucesso retira os dados da despesa da consulta e oferece retorno a Contas a Pagar. Falhas não são apresentadas como sucesso e não causam reenvio automático.

O tutor apresentou a explicação antes do código e o autor autorizou: “Pode implementar”. A retomada se restringe à Tarefa 5 da US04; não incluir a listagem da US05.
