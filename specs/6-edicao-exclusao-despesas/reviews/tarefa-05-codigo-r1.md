# Parecer de Código — Tarefa 5

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum.

O diff mantém o sentido Controller → Service → Repository. O controlador retorna record, a autorização reutiliza a query por proprietário com filtros de exclusão da despesa e da obra, e o relógio permanece injetável, conforme `docs/architecture.md`, §§5.2 e 7.

A exclusão financeira usa `TransactionTemplate` com `REQUIRES_NEW`: despesa e pagamento recebem o mesmo instante na mesma transação; a chamada ao storage acontece depois que `execute` retorna. A falha do armazenamento é comunicada por `receiptDeletionFailed`, sem reativação financeira nem infraestrutura de limpeza. A estratégia acompanha o padrão já existente em `ExpenseReceiptService`, sem criar colaborador desnecessário.

No Angular, a comunicação HTTP permanece em `core/services`, com tipos explícitos. O componente usa `inject()`, signals e controle de fluxo moderno. A separação entre diálogo aberto e requisição em andamento permite fechar o diálogo sem liberar outro DELETE. O modal compartilhado foi reutilizado sem alteração.

Os novos testes verificam comportamento observável: contratos HTTP, persistência, agregados, rollback, autorização e interações na interface. A conexão PostgreSQL independente comprova o commit antes do storage; o trigger de teste provoca uma falha real de persistência.

Conferi os logs originais fornecidos: RED com 8 falhas esperadas na API e 9 no frontend; GREEN com 148 testes backend sem falhas ou erros e 124 testes frontend aprovados; build concluído. Não executei testes adicionais.

## Sugestões (não bloqueiam)

- Na Tarefa 7, acrescentar o cenário “DELETE concluído com resposta perdida → consultar estado → GET 404”. `expense-detail.component.ts:202` reutiliza `loadExpense`, cujo handler de erro conserva a despesa previamente carregada. A tela informa indisponibilidade, mas ainda apresenta o card antigo. A consolidação de recuperação de falhas está prevista expressamente para aquela tarefa.
- Documentar a exceção de contrato da exclusão de despesa: `docs/architecture.md`, §6.1, estabelece genericamente DELETE com 204, enquanto esta tarefa exige DTO para comunicar o resultado financeiro e a falha no comprovante, implementado com 200. O contrato está consistente entre API, frontend e testes; a sugestão é eliminar a ambiguidade documental.

## Observações fora do escopo deste diff

- Alterações preexistentes em `docs/prd.md`, `docs/architecture.md` e a remoção do rascunho da US05 foram reconhecidas como externas à Tarefa 5, conforme despacho.
- O build registra aviso de bundle inicial de 641,47 kB para orçamento de 500 kB. O launcher registra demora ao encerrar o ChromeHeadless após os testes concluídos. Essas evidências não demonstram bloqueio causado pela Tarefa 5.
- A matriz integrada de autenticação e a consolidação completa de contexto e recuperação continuam atribuídas às Tarefas 6 e 7.
