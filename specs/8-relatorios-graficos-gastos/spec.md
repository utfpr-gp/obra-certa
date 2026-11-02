---
issue: 8
status: aprovado
---

# US06 — Relatórios e Gráficos de Gastos

## O problema

O proprietário precisa entender a distribuição dos gastos e comparar as despesas com os limites da obra. Antes da integração financeira, precisa validar a apresentação da tela usando dados fictícios e a referência visual Relatorios-Desktop.png fornecida pelo autor.

## A história

**Como** proprietário com uma obra selecionada, **eu quero** visualizar gráficos comparativos entre orçamento previsto e despesas acumuladas e exportar um relatório consolidado em PDF do histórico da obra, **para que** possa analisar o equilíbrio financeiro e identificar sobras ou estouros orçamentários.

## Critérios de aceite

- [ ] **CA1 — Distribuição:** dadas despesas ativas, ao abrir relatórios, exibir gráfico de rosca com valores absolutos, percentuais e legenda de todas as categorias com despesas.
- [ ] **CA2 — Comparativo:** dadas categorias orçadas, exibir barras de previsto e realizado na mesma escala, com saldo positivo em verde e excedente em vermelho; omitir categorias sem orçamento.
- [ ] **CA3 — PDF:** ao exportar, gerar sincronamente `relatorio-{nome-da-obra}-{data}.pdf`, com identificação da obra, total orçado, realizado discriminando pago e a pagar, balanço por categoria e data de geração.
- [ ] **CA4 — Sem movimentação:** dada obra sem despesas, exibir orçamentos e despesas zeradas e permitir exportação.
- [ ] **CA5 — Posse:** ao consultar dados ou PDF de obra alheia, responder que a obra não foi localizada.
- [ ] **CA6 — Exclusão lógica:** ignorar despesas excluídas nos gráficos e no PDF.
- [ ] **CA7 — Primeira etapa visual:** apresentar frontend com dados fictícios, inspirado na referência enviada: título, filtros, quatro indicadores, rosca, barras horizontais, resumo e detalhamento por categoria. Reutilizar o layout e os tokens existentes. No celular, organizar o conteúdo em coluna e converter o detalhamento em cartões. Identificar o cenário como demonstrativo.
- [ ] **CA8 — Consistência do demonstrativo:** totais, saldos, percentuais e destaques derivam de uma única massa fictícia, com pelo menos uma categoria excedida; arredondar somente na apresentação. Os números da imagem são ilustrativos e não devem produzir totais contraditórios.
- [ ] **CA9 — Controles do protótipo:** período permanece em todo o histórico; seleção de categoria atualiza as visualizações de forma consistente. O botão de PDF informa que a exportação será disponibilizada na integração, sem simular download concluído.
- [ ] **CA10 — Abandono do protótipo:** sair da tela ou recarregar não grava dados financeiros nem dispara exportação; retornar restaura o cenário demonstrativo inicial.

## Fora de escopo

- Na primeira tarefa visual: chamadas de relatórios à API, persistência, geração real de PDF e implementação das proteções de backend dos CA5 e CA6. Esses comportamentos continuam obrigatórios para a conclusão da US06.
- Filtros por datas individuais e alterações nas demais funcionalidades.
- Reprodução dos avisos técnicos e aproximações numéricas da imagem como regras de negócio.

## Abandono no meio

O protótipo mantém somente estado local de apresentação. Navegar para outra tela ou recarregar descarta a seleção temporária e não modifica a obra. O comportamento de interrupção da exportação real será definido antes da implementação da integração.

## Assume que

| Premissa | Issue que fecha |
| --- | --- |
| A primeira tarefa usa dados fictícios locais; o código deve sinalizar a substituição pendente com `TODO #8`. A integração posterior substitui essa massa antes da conclusão da história. | #8 |

## Depende de

- US14: seleção de obra ativa.
- US03: despesas.
- US07: orçamentos por categoria.

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
| 1 | O PDF final contém somente o consolidado por categoria ou também a lista individual de despesas? Não afeta a primeira tarefa visual. | Autor |
| 2 | Em falha ou interrupção da exportação real, oferecer nova tentativa manual sem geração automática ao retornar? | Autor |
