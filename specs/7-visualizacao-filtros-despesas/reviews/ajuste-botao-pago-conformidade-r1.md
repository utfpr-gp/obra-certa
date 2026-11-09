# Parecer de Conformidade — Tarefa ajuste-botao-pago R1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1: preservar acesso à consulta individual | atendido | `accounts-page.component.ts:187`, `accounts-page.component.ts:219` |
| Recorte autorizado: botão desabilitado, `type="button"`, somente para `!expense.paid`, sem ação | atendido | `accounts-page.component.ts:188`, `accounts-page.component.ts:220`; autorização em `reviews/acoes-quitacao-proposta.md:26` |
| Ausência do botão em registros pagos e durante carregamento | atendido | `accounts-page.component.spec.ts:328`, `accounts-page.component.spec.ts:374` |
| CA11: apresentação desktop/mobile com DS e altura mínima de 44px | atendido na implementação; validação desktop bloqueada | `accounts-page.component.spec.ts:205`, `accounts-page.component.spec.ts:334` |
| Quitação funcional da US08 | fora desta tarefa | `spec.md:94` |
| Testes executáveis comprovando o recorte | não atendido | `apps/web/ajuste-botao-pago-green.log` |

## Apontamentos

1. **A nova asserção desktop falha na suíte final** — `apps/web/src/app/features/expenses/accounts-page.component.spec.ts:319`  
   Critério relacionado: `spec.md:90`, CA11, apresentação e ações em desktop/mobile; método de revisão exige testes executados e aprovados como evidência.  
   Evidência: o teste espera `Ver detalhes Marcar como Pago`, mas o `textContent` produzido é `Ver detalhesMarcar como Pago`. O espaçamento visual vem de `gap-2`; a asserção exige um espaço textual inexistente. A suíte executada terminou com **1 FAILED, 387 SUCCESS**. O RED registrou **2 FAILED, 19 SUCCESS**. O build concluiu, com aviso de orçamento do bundle.
