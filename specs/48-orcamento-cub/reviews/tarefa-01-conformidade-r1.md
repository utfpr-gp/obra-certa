# Parecer de Conformidade — Tarefa 1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Abertura pelo modal, seleção e estimativa demonstrativa | Atendido no escopo visual | `budget-form-modal.component.html:93`, `sinapi-form.component.html:1`, `budget-form-modal.component.spec.ts:166` |
| CA2 — Percentuais iniciais e edição da parcela demonstrativa | Atendido no escopo visual | `sinapi-form.component.ts:12`, `budget-form-modal.component.spec.ts:199` |
| CA3 e CA4 — Preservação e gravação dos tetos | Fora desta tarefa | `plan.md:44` |
| CA5 — Estado sem acabamento disponível na demonstração | Atendido no escopo visual | `sinapi-form.component.html:52`, `budget-form-modal.component.spec.ts:204` |
| CA6 — Descarte do estado ao fechar a demonstração | Atendido no escopo visual | `budget-form-modal.component.ts:182`, `budget-form-modal.component.spec.ts:210` |
| CA7 — Oito projetos agrupados, disponibilidade e invalidação da prévia | Atendido no escopo visual | `sinapi-form.component.ts:34`, `sinapi-form.component.ts:99`, `budget-form-modal.component.spec.ts:180` |
| CA8 — Consulta real e descarte dos dados do provedor | Fora desta tarefa | `plan.md:50` |
| Tarefa 1 — Conferência visual em viewport móvel e desktop | Não atendido | `plan.md:28` |

A execução da suíte de Orçamentos pelo orquestrador em Chrome Headless registrou 69 testes aprovados.

## Apontamentos

1. **A conferência visual em móvel e desktop permanece pendente** — `plan.md:28`  
   Critério violado: a Tarefa 1 prevê conferir os estados inicial, carregando, sem acabamento e com prévia em viewport móvel e desktop.  
   Evidência: `budget-form-modal.component.spec.ts:166` exercita os estados por meio do DOM em uma única configuração de viewport. Segundo o relato da implementação, a instância autenticada apresentava uma versão anterior do formulário, e a compilação atual em outra origem redirecionou para login. Assim, a validação dos dois tamanhos permanece sem evidência. O apontamento é de verificação pendente.
