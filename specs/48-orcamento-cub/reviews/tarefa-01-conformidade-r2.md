# Parecer de Conformidade — Tarefa 1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério | Situação | Onde |
| --- | --- | --- |
| CA1 e CA7 — Abas, seleção de projeto e acabamento, prévia demonstrativa | Atendido no escopo visual | `budget-form-modal.component.html:27`, `sinapi-form.component.html:5`, `budget-form-modal.component.spec.ts:169` |
| CA2 — Tabela inicial de rateio na prévia | Não atendido | `budgets-page.component.html:227`, `sinapi-form.component.ts:87` |
| CA5 e CA6 — Estado sem acabamento e descarte ao fechar | Atendido no escopo visual | `budget-form-modal.component.spec.ts:224`, `budget-form-modal.component.spec.ts:236` |
| Bordas dos campos e conferência em celular e desktop | Atendido | `sinapi-form.component.css:18`, `plan.md:28`, validação em `localhost:4200` a 390 × 844 e 1280 × 800 |
| CA3, CA4 e CA8 — Tetos existentes, gravação e tratamento dos dados do provedor | Fora desta tarefa | `plan.md:44`, `plan.md:50` |

Os 69 testes de Orçamentos passaram na execução do orquestrador. A repetição no sandbox compilou, mas terminou com `EPERM` na infraestrutura de testes. A conferência visual exercitou os quatro estados nos dois tamanhos.

## Apontamentos

1. **A prévia usa apenas as categorias elegíveis ao orçamento manual** — `budgets-page.component.html:227`  
   Critério violado: o CA2 da `spec.md:19` exige que a prévia carregue a tabela inicial de percentuais do PRD. O plano prevê reutilizar as categorias da página.  
   Evidência: a página passa `modalCategories()`, que filtra as categorias com teto ativo no modo **Adicionar orçamento** (`budgets-page.component.ts:67`). A aba SINAPI reaproveita esse subconjunto para montar a prévia (`budget-form-modal.component.html:48`, `sinapi-form.component.ts:87`). Em `localhost:4200`, a estimativa de R$ 180.000 exibiu seis categorias cujas parcelas iniciais somavam 42%. As três categorias omitidas correspondiam aos outros 58% do rateio. O teste do modal injeta diretamente um subconjunto de categorias e deixa esse cenário da página sem cobertura.
