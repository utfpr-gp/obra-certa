# Parecer de Conformidade — Tarefa 8

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA11 — Cancelar ou fechar antes do envio não cria despesa | atendido | apps/web/src/app/features/expenses/expense-context.spec.ts:71 |
| CA11 — Trocar de obra encerra os dados e o arquivo do formulário anterior | atendido | apps/web/src/app/features/expenses/expense-form.component.ts:89 |
| CA11 — Respostas atrasadas não contaminam a obra atual, inclusive A → B → A | atendido | apps/web/src/app/features/expenses/expense-context.spec.ts:49 |
| CA11 — Sem obra selecionada, orientar seleção ou cadastro | atendido | apps/web/src/app/features/expenses/expense-form.component.html:134 |
| Plano — Atualização de metadados da mesma obra preserva campos e arquivo | atendido | apps/web/src/app/features/expenses/expense-context.spec.ts:43 |
| Plano — Persistir na obra validada no payload original | atendido | apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:68 |
| CA6 — Reabrir o endereço da despesa após inicialização assíncrona da obra, preservando tag e ações de comprovante | atendido | apps/web/src/app/features/expenses/expense-flow.spec.ts:103 |
| CA11 — Após inicialização assíncrona, manter invalidação de consultas, orçamento, upload e download em A → B → A | atendido | apps/web/src/app/features/expenses/expense-context.spec.ts:98 |
| CA12 e CA13 — Idempotência e recuperação após login | fora desta tarefa | specs/5-cadastro-despesas/plan.md:93 |

Leitura independente do diff integral concluída. O ajuste resolve o apontamento aceito da rodada 1: aguarda a primeira obra ativa e inicia a consulta, mantendo a invalidação após troca real.

Validação: o orquestrador executou a suíte Angular completa nesta rodada, com **255 testes aprovados**, incluindo contexto e fluxo, e código de saída 0. As fontes permaneceram inalteradas depois dessa execução. Minha tentativa compilou os dois arquivos de testes, mas o sandbox impediu iniciar o ChromeHeadless; a tentativa escalada foi interrompida sem resultado confirmado. Os **16 testes de integração da API** foram aprovados independentemente na rodada 1; código e teste da API não mudaram na rodada 2.

## Apontamentos
