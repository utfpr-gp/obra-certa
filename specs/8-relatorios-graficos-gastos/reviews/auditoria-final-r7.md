# Auditoria Final — Issue #8, rodada 7

**Veredito — PRONTO PARA PR** após registrar em commit as alterações intencionais do candidato auditado contra `71b8e21`.

## Critérios de aceite da spec

| # | Critério | Situação | Evidência |
| --- | --- | --- | --- |
| CA1 | Distribuição | Atendido | Agregação de despesas ativas, rosca e legenda com valores e percentuais. `ReportServiceTest.java:65`, `reports-page.component.spec.ts:29` |
| CA2 | Comparativo | Atendido | Escala comum, categorias sem orçamento omitidas e cores de saldo verificadas. `reports-page.component.spec.ts:432`, `:448` |
| CA3 | PDF | Atendido | Download único com nome datado, identificação, totais, pago e a pagar. Falha de exportação exibe uma mensagem. `reports-page.component.spec.ts:90`, `:116`, `report-visual-export.service.spec.ts:78` |
| CA4 | Sem movimentação | Atendido | Orçamento preservado, despesas zeradas e exportação disponível. `reports-page.component.spec.ts:465`, `report-visual-export.service.spec.ts:121` |
| CA5 | Posse | Atendido | `404` nas consultas e exportações de obra alheia. `ReportControllerTest.java:48`, `:55`, `:147` |
| CA6 | Exclusão lógica | Atendido | Agregados e detalhamento individual excluem despesas removidas. `ExpenseRepositoryTest.java:160`, `:213` |
| CA7 | Apresentação demonstrativa | Atendido na primeira etapa | Parecer da tarefa 1 registra o layout desktop e a apresentação em cartões a 360 px. `tarefa-01-conformidade-r2.md` |
| CA8 | Consistência do demonstrativo | Atendido na primeira etapa | Massa única, categoria excedida e arredondamento na apresentação. `tarefa-01-conformidade-r2.md` |
| CA9 | Controles do protótipo | Atendido na primeira etapa | Histórico fixo, filtro por categoria e aviso de integração futura do PDF. `tarefa-01-conformidade-r2.md` |
| CA10 | Abandono do protótipo | Atendido na primeira etapa | A recriação da tela descarta a seleção local e restaura o cenário inicial. `tarefa-01-conformidade-r2.md` |
| CA11 | PDF visual | Atendido | Composição desktop compartilhada, paginação, filtros aplicados e descarte por abandono. Após falha da consulta, botão e ação ficam bloqueados até uma resposta válida reconciliar a categoria. `report-visual-export.service.spec.ts:24`, `:66`, `:93`, `:103`, `reports-page.component.spec.ts:153`, `:261`, `:300` |
| CA12 | Período | Atendido | Limites inclusivos, orçamento integral, inversão bloqueada, limpeza, troca de obra e sincronização de categoria. `ReportServiceTest.java:203`, `reports-page.component.spec.ts:179`, `:212`, `:230`, `:318` |

## Pendências que bloqueiam o PR

Nenhum bloqueio de aceite. O caso da rodada 6 está coberto pelo teste de regressão. `exportableProjectId` exige um relatório válido da obra ativa e governa tanto o botão quanto a ação. A consulta bem-sucedida reconcilia a categoria antes de liberar a exportação.

## Documentação e validação

- O PRD e o índice registram a entrega local e os ajustes das tarefas 9 e 10. Ao registrar este parecer, o índice pode substituir “Aguarda nova auditoria” pelo resultado da rodada 7. A arquitetura documenta os três contratos e a reutilização do schema.
- O protótipo cumpriu a premissa do `TODO #8`. A integração substituiu a massa fictícia. O diff está restrito à US06 e à configuração do perfil de teste necessária para validar a API. O `git diff --check` sinalizou espaços finais em pareceres históricos preservados.
- Conferi as execuções completas registradas, sem repetir as suítes. **446 testes web** passaram e o build concluiu com avisos de orçamento e CommonJS. **348 testes da API** passaram em PostgreSQL 16.15 isolado com validação Flyway. A tarefa 10 registrou uma falha de asserção no RED e passou no GREEN.
- A validação visual registra a inspeção do PDF desktop pelo agente e as confirmações do autor para 360 px, obra vazia e filtros.

## Matéria-prima para o PR

- A tela autenticada agrega despesas ativas e orçamentos em indicadores, gráficos e detalhamento.
- O período recorta as despesas pela data da compra e preserva os tetos orçados.
- O PDF visual reutiliza a composição desktop com dados autorizados e filtros aplicados. A exportação exige uma consulta válida para a obra ativa.
- O endpoint legado entrega o consolidado e a lista individual de despesas ativas.
