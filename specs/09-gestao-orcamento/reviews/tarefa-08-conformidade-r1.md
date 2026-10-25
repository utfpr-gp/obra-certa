# Parecer de Conformidade — Tarefa 8

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Cancelar, fechar pelo X ou pressionar Escape no formulário não envia gravação nem emite sucesso (CA9) | atendido | `apps/web/src/app/features/budgets-page/components/budget-form-modal/budget-form-modal.component.ts:136-143`; `budget-form-modal.component.spec.ts:134-148` |
| Clique no backdrop preserva o preenchimento e não fecha nem salva (CA9) | atendido | `budget-form-modal.component.spec.ts:151-158`; comportamento existente no template do formulário |
| Trocar a obra ativa fecha formulário e confirmação, descarta o contexto anterior e carrega o painel da nova obra (CA9) | atendido | `apps/web/src/app/features/budgets-page/budgets-page.component.ts:80-96,121-126,152-157`; `budgets-page.component.spec.ts:180-201` |
| Formulário reaberto após troca de obra não conserva o rascunho descartado (CA9) | atendido | `budget-form-modal.component.ts:57-71`; `budgets-page.component.spec.ts:198-200` |
| Resposta atrasada de leitura não substitui o painel da obra atual (CA9) | atendido | Guarda existente em `BudgetsPageComponent.load`; `budgets-page.component.spec.ts:204-213` |
| Respostas antigas de sucesso ou erro no salvamento não alteram um diálogo posterior, inclusive no ciclo A→B→A (CA9) | atendido | `budget-form-modal.component.ts:108,117-124,136-148`; `budget-form-modal.component.spec.ts:171-189`; `budgets-page.component.spec.ts:216-250` |
| Respostas antigas de sucesso ou erro no zeramento não fecham um diálogo posterior nem recarregam indevidamente o painel (CA9) | atendido | `budgets-page.component.ts:141-178`; `budgets-page.component.spec.ts:216-250` |
| Salvar fica desabilitado durante a requisição e o método impede submissão repetida (CA9) | atendido | `budget-form-modal.component.ts:94-109`; atributo existente no botão Salvar; `budget-form-modal.component.spec.ts:161-168`; `budgets-page.component.spec.ts:255-276` |
| Confirmar zeramento fica desabilitado durante a requisição, com guarda adicional contra repetição (CA9) | atendido | `budgets-page.component.ts:160-169`; `budgets-page.component.html:230-238`; `apps/web/src/app/shared/components/confirm-modal/confirm-modal.component.ts:19,31-33`; `confirm-modal.component.html:48`; `confirm-modal.component.spec.ts:29-40` |
| Confirmação mantém Cancelar/X/Escape e backdrop inerte; cancelamento continua disponível durante envio (CA9) | atendido | Comportamentos existentes em `confirm-modal.component.ts` e template; `confirm-modal.component.spec.ts:43-48,70-108` |
| Repetir definição com o mesmo valor preserva o registro ativo e o resultado financeiro; repetir zeramento preserva o registro zerado (CA9) | atendido | `apps/api/src/test/java/com/obracerta/service/BudgetServiceTest.java:414-471` |
| Complemento do `ConfirmModal` permanece dentro do escopo explicitamente autorizado, com estado de envio inicialmente falso | atendido | `specs/09-gestao-orcamento/plan.md:208`; `confirm-modal.component.ts:19` |
| Nenhuma migration ou alteração de produção backend | atendido | Diff completo contra `eed2330c5b3377d4fd670fc0a4e56780bfdf86f2` |
| Tratamento completo de rede/401 e categoria inexistente no zeramento | fora desta tarefa | Tarefas 9 e 10 do plano |
| Testes frontend executados nesta revisão | atendido: **157 testes passaram** | Em `apps/web`: `npx.cmd ng test --watch=false --browsers=ChromeHeadless`; execução ampliada após bloqueio de inicialização do Chrome |
| Testes backend | execução atribuída ao revisor de código; implementador informou 73 testes aprovados | Não reexecutados por este revisor; os testes de idempotência foram lidos no diff |

## Apontamentos
