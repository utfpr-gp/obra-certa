# Parecer de Conformidade — Tarefa 9

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Falhas de rede, timeout e 5xx no carregamento mostram AlertBanner com aviso de conexão e permitem nova tentativa (CA10) | atendido | `apps/web/src/app/features/budgets-page/budgets-page.component.ts:257-282`; `budgets-page.component.spec.ts:753-764` |
| Falhas no salvamento preservam categoria e valor digitado, mantêm o formulário aberto e reabilitam o envio (CA10) | atendido | `apps/web/src/app/features/budgets-page/components/budget-form-modal/budget-form-modal.component.ts:121-131`; `budgets-page.component.spec.ts:767-789` |
| Falhas no zeramento mantêm a confirmação aberta, mostram aviso visível e permitem retry (CA10) | atendido | `budgets-page.component.ts:163-185`; `budgets-page.component.html:230-240`; `budgets-page.component.spec.ts:792-812` |
| Painel não muda de forma otimista após falha de gravação (CA10) | atendido | `budgets-page.component.spec.ts:781,800`; recarga ocorre no caminho de sucesso existente |
| Nova tentativa remove o aviso anterior e permite concluir salvamento ou zeramento (CA10) | atendido | `budgets-page.component.ts:172`; `budgets-page.component.spec.ts:782-789,805-812`; comportamento existente de limpeza do erro no formulário |
| 401 durante leitura, salvamento e zeramento percorre interceptor e Auth reais, remove token e obra ativa e solicita navegação para `/login` (CA10) | atendido | `budgets-page.component.spec.ts:817-850`; `apps/web/src/app/core/interceptors/auth-interceptor.ts:24-26`; `apps/web/src/app/core/services/auth.ts:37-40` |
| Login continua acessível em `/` e passa a funcionar também em `/login`, conforme complemento autorizado | atendido | `apps/web/src/app/app.routes.ts:9-17`; `app.routes.spec.ts:8-16`; autorização registrada em `specs/09-gestao-orcamento/plan.md:220` |
| Logout remove token e obra ativa e navega para `/login` | atendido | `auth.ts:37-40`; `auth.spec.ts:39-57` |
| Os três métodos de BudgetService propagam status e payload de erro sem transformação | atendido | `apps/web/src/app/core/services/budget.service.spec.ts:59-80` |
| Tratamento específico de 409 e proteções de contexto da Tarefa 8 permanecem preservados | atendido | `budget-form-modal.component.ts:117-131`; `budgets-page.component.ts:174-185`; suíte completa executada |
| Não introduz duração arbitrária de timeout nem presume ausência de gravação quando a resposta se perde | atendido | Timeout representado como erro de transporte nos testes; nenhuma política nova de duração ou persistência foi adicionada ao diff |
| Nenhuma migration ou alteração backend; categoria inexistente no zeramento permanece na Tarefa 10 | atendido / fora desta tarefa | Diff completo contra `5227642b358d9e1cafdc928fd187bebea3146541`; Tarefa 10 do plano |
| Testes frontend executados nesta revisão | atendido: **180 testes passaram** | Em `apps/web`: `npx.cmd ng test --watch=false --browsers=ChromeHeadless`; execução ampliada após bloqueio de inicialização do Chrome |

## Apontamentos
