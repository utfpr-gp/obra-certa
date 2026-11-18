# Auditoria Final — Issue #8, rodada 5

**Veredito: NÃO PRONTO.** Auditei `91fe2a7` contra `origin/develop` (`71b8e21`), incluindo a remoção local da massa demonstrativa, as alterações locais no PRD e no índice e o novo registro de validação ainda sem commit.

## Critérios de aceite

| Critério | Situação | Evidência |
| --- | --- | --- |
| CA1 — Distribuição | Atendido | Agregação por categoria e rosca com valores e percentuais. `ReportServiceTest` e `reports-page.component.spec.ts`. |
| CA2 — Comparativo | Atendido | Escala compartilhada, exclusão de categorias sem orçamento e cores de saldo verificadas em `reports-page.component.spec.ts:358` e `:374`. |
| CA3 — PDF | Atendido | Um download com nome datado, totais, pago e a pagar. Erro único e sem nova tentativa automática. `reports-page.component.spec.ts:90` e `:116`, `report-visual-export.service.spec.ts:78`. |
| CA4 — Sem movimentação | Atendido | Despesas zeradas, orçamento existente preservado e exportação possível. `ReportServiceTest` e `report-visual-export.service.spec.ts:121`. |
| CA5 — Posse | Atendido | `404` para obra alheia e mensagem de obra não localizada na tela. `ReportControllerTest` e `reports-page.component.spec.ts:350`. |
| CA6 — Exclusão lógica | Atendido | Agregações e detalhamento individual excluem despesas removidas. `ExpenseRepositoryTest`. |
| CA7–CA10 — Protótipo | Atendidos na primeira etapa | `reviews/tarefa-01-conformidade-r2.md` registra o demonstrativo, a massa única, os controles e o descarte de estado. A integração substituiu o cenário fictício e encerrou a premissa do `TODO #8`. |
| CA11 — PDF visual | Parcial | Composição e abandono cobertos. A categoria exportada pode divergir da seleção visível após aplicar período. |
| CA12 — Período | Parcial | Limites inclusivos, orçamento integral, inversão, limpeza e troca de obra cobertos. A combinação de período com categoria pode ocultar a seleção aplicada. |

## Pendência que bloqueia o PR

Selecione uma categoria sem orçamento e aplique um período que exclua todas as despesas dessa categoria, mantendo despesas em outra. A API retorna categorias com orçamento ou despesas no período. A opção selecionada desaparece do `<select>`, mas `selectedCategory` conserva o ID. A tela segue filtrando por essa categoria invisível e envia o mesmo ID ao exportar. O teste atual aplica o período antes de escolher a categoria e, portanto, deixa esse fluxo sem cobertura. Constatação por leitura. [Opções da tela](C:/Users/panic/dev/obra-certa/apps/web/src/app/features/reports/reports-page.component.html:15) · [Consulta e exportação](C:/Users/panic/dev/obra-certa/apps/web/src/app/features/reports/reports-page.component.ts:57) · [Categorias retornadas](C:/Users/panic/dev/obra-certa/apps/api/src/main/java/com/obracerta/service/ReportService.java:120) · [Teste existente](C:/Users/panic/dev/obra-certa/apps/web/src/app/features/reports/reports-page.component.spec.ts:226)

## Documentação e validação

- O PRD registra implementação local, o índice aponta para as validações e a arquitetura descreve os três contratos de relatório. O novo registro de validação e as correções locais precisam integrar o commit que seguirá para a `develop`.
- Conferi os logs da execução do orquestrador no candidato. **348 testes da API** passaram em PostgreSQL 16 isolado, **443 testes web** passaram e o build web concluiu. Usei essa execução integral como evidência.
- Os três commits de layout alteram os testes. O registro posterior descreve a reprodução das falhas com os serviços anteriores e a aprovação com os serviços corrigidos. Os logs temporários dessas reproduções foram removidos pelo Angular. A ordem histórica do TDD permanece apoiada no relato da implementação.
- A validação visual distingue o PDF desktop gerado pelo autor e inspecionado pelo agente dos casos de 360 px, obra vazia e filtros confirmados pelo autor.

## Matéria-prima para o PR

- A tela agrega despesas ativas e orçamentos da obra selecionada em indicadores, gráficos e detalhamento.
- O período recorta despesas pela data da compra e conserva os tetos orçados.
- A exportação visual usa a mesma apresentação em composição desktop, com dados de um snapshot autorizado.
- O endpoint legado mantém o consolidado e a lista individual de despesas ativas.
