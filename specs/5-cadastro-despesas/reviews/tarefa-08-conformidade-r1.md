# Parecer de Conformidade — Tarefa 8

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA11 — Cancelar ou fechar antes do envio não cria despesa | atendido | apps/web/src/app/features/expenses/expense-context.spec.ts:71 |
| CA11 — Trocar de obra encerra formulário, arquivo e contexto orçamentário anteriores | atendido | apps/web/src/app/features/expenses/expense-form.component.ts:89 |
| CA11 — Respostas atrasadas não contaminam o contexto atual, inclusive A → B → A | atendido | apps/web/src/app/features/expenses/expense-context.spec.ts:49 |
| CA11 — Sem obra, orientar seleção ou cadastro | atendido | apps/web/src/app/features/expenses/expense-form.component.html:134 |
| Plano — Atualização dos metadados da mesma obra preserva campos e arquivo | atendido | apps/web/src/app/features/expenses/expense-context.spec.ts:43 |
| Plano — Persistir na obra validada no payload original | atendido | apps/api/src/test/java/com/obracerta/controller/ExpenseRegistrationIntegrationTest.java:68 |
| CA6 — Reabrir a consulta individual após fechar a página | não atendido | apps/web/src/app/features/expenses/expense-detail.component.ts:99 |
| CA12 e CA13 — Idempotência e recuperação após login | fora desta tarefa | specs/5-cadastro-despesas/plan.md:93 |

Validação independente concluída: 16 testes de integração aprovados com PostgreSQL 16.15 e Flyway; 55 testes Angular aprovados com ChromeHeadless. As execuções iniciais ficaram bloqueadas pelo sandbox; as execuções com permissão ampliada concluíram com código 0.

## Apontamentos

1. **A consulta individual deixa de funcionar ao reabrir seu endereço antes da inicialização da obra ativa** — `apps/web/src/app/features/expenses/expense-detail.component.ts:99`  
   Critério violado: `specs/5-cadastro-despesas/spec.md:22` — CA6 exige acessar novamente a despesa, inclusive após fechar a página e entrar de novo, para consultar a tag e reenviar o comprovante.  
   Evidência: o construtor retorna sem executar o GET quando `activeProject()` está nulo. A navbar inicializa a obra somente após a resposta assíncrona de `getProjects()` (`apps/web/src/app/shared/components/navbar/navbar.component.ts:109`). Quando essa resposta chega, o efeito do detalhe apenas limpa o estado e apresenta “A obra foi alterada”; ele não inicia a consulta. Assim, abrir diretamente `/despesas/:id` em uma nova carga impede consultar a despesa mesmo depois de a obra correta ser restaurada. Os testes aprovados selecionam uma obra antes de criar o componente e não cobrem essa sequência.
