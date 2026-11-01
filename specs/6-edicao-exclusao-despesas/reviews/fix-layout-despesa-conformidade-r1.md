# Parecer de Conformidade — Tarefa Ajuste visual US04

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Pedido do usuário: aderência ao design system | não atendido integralmente | `expense-detail.component.ts:17`; `expense-edit-modal.component.html:4` |
| CA1 — Campos de edição e obra imutável preservados | atendido | `expense-edit-modal.component.html:7` |
| CA2 — Alerta de orçamento preservado | atendido | `expense-detail.component.ts:38` |
| CA3 — Situação de pagamento e vencimento preservados na interface | atendido | `expense-edit-modal.component.html:25` |
| CA4/CA5 — Consulta, remoção, substituição, progresso e erros de comprovante preservados | atendido | `expense-detail.component.ts:75` |
| CA6 — Confirmação de exclusão e distinção entre sucesso financeiro e falha de arquivo preservadas | atendido | `expense-detail.component.ts:33`; `expense-detail.component.ts:107` |
| CA7 — Cancelamentos, fechamento e bloqueio durante envio preservados | atendido | `expense-edit-modal.component.html:5`; `expense-edit-modal.component.html:50` |
| CA9 — Destaque dos campos inválidos preservado | atendido | `expense-edit-modal.component.html:11` |
| CA10 — Orientação sem obra, mensagens de falha e consulta de estado preservadas | atendido | `expense-detail.component.ts:22`; `expense-edit-modal.component.html:48` |
| CA8 e garantias de persistência/API dos demais critérios | fora desta tarefa | Diff restrito aos dois templates |
| Regressão existente e compilação | atendido | Logs conferidos: `us04-fix-layout-tests.log` registra 153 SUCCESS; `us04-fix-layout-build.log` registra compilação concluída |

## Apontamentos

1. **A tipografia dos títulos ainda diverge dos tokens obrigatórios** — `apps/web/src/app/features/expenses/expense-detail.component.ts:17`, `:49`, `:76`; `apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.html:4`
   
   Critério violado: pedido de adequação ao design system; `docs/design-tokens.md:13` declara os tokens obrigatórios, e as linhas 52–54 definem H1 com `text-2xl text-slate-800`, H2 com `text-xl text-slate-800` e H3 com `text-base text-slate-700`.
   
   Evidência: o H1 recebe `md:text-3xl text-slate-900`; os H2 usam `text-slate-900`; “Comprovante” usa `text-lg text-slate-900`. Não há autorização apresentada para essas variações.
