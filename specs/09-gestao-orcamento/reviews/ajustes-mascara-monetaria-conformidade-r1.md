# Parecer de Conformidade — Máscara monetária da US07

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec ou pedido do autor) | Situação | Onde |
| --- | --- | --- |
| Digitar `1`, `123` e `123456` apresenta, respectivamente, `R$ 0,01`, `R$ 1,23` e `R$ 1.234,56` | atendido | `budget-form-modal.component.ts:98-120`; `budget-form-modal.component.spec.ts:96-111` |
| Formatação ocorre durante a digitação, com teclado numérico apropriado | atendido | `budget-form-modal.component.html:54-58`; `budget-form-modal.component.spec.ts:114-127` |
| Controle e DTO permanecem numéricos em reais: `123456` envia `1234.56` | atendido | `budget-form-modal.component.ts:118`; testes parametrizados em `budget-form-modal.component.spec.ts:96-111` |
| Edição de orçamento existente preserva a quantia: `1000` aparece como `R$ 1.000,00` | atendido | `budget-form-modal.component.ts:98-100`; `budget-form-modal.component.spec.ts:89`; `budgets-page.component.spec.ts:530` |
| Colagem de BRL, exclusão e substituição do conteúdo são tratadas | atendido | `budget-form-modal.component.spec.ts:114-143` |
| Campo apagado mantém valor nulo obrigatório; zero continua impedindo envio (CA6) | atendido | `budget-form-modal.component.spec.ts:129-155`; validadores existentes preservados |
| Conflito 409 preserva texto formatado e quantia enviada (CA5) | atendido | `budget-form-modal.component.spec.ts:287-297` |
| Falha de conexão preserva valor e permite reenviar a mesma quantia (CA10) | atendido | `budgets-page.component.spec.ts:849-861` |
| Helpers e expectativas da página foram adaptados sem reduzir os valores esperados na API | atendido | `budgets-page.component.spec.ts:144,530,766,849-861` |
| Não introduz biblioteca, alteração backend ou mudanças nos ajustes anteriores de navbar e estados | atendido | Diff delimitado aos quatro arquivos informados no despacho |
| Suíte completa da implementação | executada pelo orquestrador: **189 testes passaram** | Resultado GREEN informado no despacho e contexto; não atribuído a esta revisão |
| Testes tentados nesta revisão | compilação concluída; execução bloqueada pela inicialização do Chrome no ambiente restrito | Em `apps/web`: `npx.cmd ng test --watch=false --browsers=ChromeHeadless --progress=false --include=src/app/features/budgets-page/components/budget-form-modal/budget-form-modal.component.spec.ts`. O bloqueio foi comunicado ao orquestrador; nenhuma execução ampliada ficou pendente neste agente |

## Apontamentos
