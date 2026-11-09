# Parecer de Conformidade — Tarefa 5

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA5 — Preservar filtros e ordenação após quitação; distinguir falha de atualização e oferecer nova consulta | atendido | `accounts-page.component.ts:406-412, 451-457`; testes em `accounts-page.component.spec.ts:865-914, 968-996`. |
| CA8 — Distinguir erro de consulta de lista vazia e permitir recuperação | atendido | `accounts-page.component.ts:460-464`; teste em `accounts-page.component.spec.ts:1029-1049`. |
| Tarefa 5 — Usar opções nomeadas em `loadPage` e limpar o aviso anterior ao iniciar outra quitação | atendido | `accounts-page.component.ts:372-387, 411-416`; teste em `accounts-page.component.spec.ts:916-940`. |
| Tarefa 5 — Testes desacoplados dos métodos internos e dirigidos pelos controles visíveis | não atendido | `accounts-page.component.spec.ts:827-828, 844-854, 947, 1002, 1040`. |

Os comandos de teste focado, `tsc` e build foram negados pelo shell, portanto não pude reexecutá-los. O orquestrador informa que a suíte completa passou após `npm ci` (501/501); não reproduzi esse resultado.

## Apontamentos

1. **Os testes ainda fabricam eventos e chamam métodos internos, contrariando o critério de interação pela interface.** — `apps/web/src/app/features/expenses/accounts-page.component.spec.ts:827-828, 844-854, 947, 1002, 1040`  
   Critério violado: `plan.md:57-58` — testes da listagem dirigidos pela interface, sem fabricar eventos, e desacoplados dos métodos internos.  
   Evidência: filtros e ordenação usam `dispatchEvent(new Event(...))`; os testes de ajuste de página chamam `loadPage(1)` diretamente, e o teste de erro comum chama `selectTab('PAID')` diretamente.
