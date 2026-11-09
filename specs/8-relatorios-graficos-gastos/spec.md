---
issue: 8
status: aprovada
---

# US06 — Relatórios e Gráficos de Gastos

## O problema

O proprietário precisa entender a distribuição dos gastos e comparar as despesas com os limites da obra. Antes da integração financeira, precisa validar a apresentação da tela usando dados fictícios e a referência visual Relatorios-Desktop.png fornecida pelo autor.

## A história

**Como** proprietário com uma obra selecionada, **eu quero** visualizar gráficos comparativos entre orçamento previsto e despesas acumuladas e exportar um relatório consolidado em PDF do histórico da obra, **para que** possa analisar o equilíbrio financeiro e identificar sobras ou estouros orçamentários.

## Critérios de aceite

- [ ] **CA1 — Distribuição:** dadas despesas ativas, ao abrir relatórios, exibir gráfico de rosca com valores absolutos, percentuais e legenda de todas as categorias com despesas.
- [ ] **CA2 — Comparativo:** dadas categorias orçadas, exibir barras de previsto e realizado na mesma escala, com saldo positivo em verde e excedente em vermelho; omitir categorias sem orçamento.
- [ ] **CA3 — PDF:** ao exportar, gerar sincronamente um único `relatorio-{nome-da-obra}-{data}.pdf` com identificação da obra, data de geração, total orçado, realizado discriminando pago e a pagar e balanço por categoria, apresentados na composição visual da página. Em falha, apresentar somente uma mensagem de erro, sem nova tentativa automática nem ação específica de tentar novamente.
- [ ] **CA4 — Sem movimentação:** dada obra sem despesas, exibir orçamentos e despesas zeradas e permitir exportação.
- [ ] **CA5 — Posse:** ao consultar dados ou PDF de obra alheia, responder que a obra não foi localizada.
- [ ] **CA6 — Exclusão lógica:** ignorar despesas excluídas nos gráficos e no PDF.
- [ ] **CA7 — Primeira etapa visual:** apresentar frontend com dados fictícios, inspirado na referência enviada: título, filtros, quatro indicadores, rosca, barras horizontais, resumo e detalhamento por categoria. Reutilizar o layout e os tokens existentes. No celular, organizar o conteúdo em coluna e converter o detalhamento em cartões. Identificar o cenário como demonstrativo.
- [ ] **CA8 — Consistência do demonstrativo:** totais, saldos, percentuais e destaques derivam de uma única massa fictícia, com pelo menos uma categoria excedida; arredondar somente na apresentação. Os números da imagem são ilustrativos e não devem produzir totais contraditórios.
- [ ] **CA9 — Controles do protótipo:** período permanece em todo o histórico; seleção de categoria atualiza as visualizações de forma consistente. O botão de PDF informa que a exportação será disponibilizada na integração, sem simular download concluído.
- [ ] **CA10 — Abandono do protótipo:** sair da tela ou recarregar não grava dados financeiros nem dispara exportação; retornar restaura o cenário demonstrativo inicial.
- [ ] **CA11 — PDF visual:** ao exportar, produzir um único PDF com a composição visual da página de Relatórios — indicadores, rosca, barras, resumo e detalhamento por categoria —, sem página textual de apêndice e sem cabeçalho de página. Reutilizar a apresentação e dados autorizados, preservar a paginação legível e os dados obrigatórios do CA3 no cabeçalho da composição, sem elementos de navegação ou controles interativos. Manter CA4, CA5, CA6 e as regras de erro e abandono da exportação. Exportar o período e a categoria aplicados na tela; sem filtro, todo o histórico e todas as categorias, com composição desktop mesmo quando acionado pelo celular, sem alterar a seleção de categoria da tela.
- [ ] **CA12 — Período:** dadas data inicial e final opcionais, aplicar o recorte ao realizado, à distribuição, ao comparativo, ao resumo e ao detalhamento, mantendo o orçamento previsto integral; data inicial posterior à final bloqueia a consulta com uma única mensagem e não altera os dados exibidos; limpar o filtro restaura o histórico completo; trocar de obra restaura o período vazio.

## Fora de escopo

- Na primeira tarefa visual: chamadas de relatórios à API, persistência, geração real de PDF e implementação das proteções de backend dos CA5 e CA6. Esses comportamentos continuam obrigatórios para a conclusão da US06.
- Alterações nas demais funcionalidades.
- Reprodução dos avisos técnicos e aproximações numéricas da imagem como regras de negócio.

## Abandono no meio

O protótipo mantém somente estado local de apresentação. Navegar para outra tela ou recarregar descarta a seleção temporária e não modifica a obra. Na exportação real, sair da página ou trocar de obra descarta a resposta pendente, sem baixar o arquivo no novo contexto. Retornar não dispara exportação automática. Em falha, apresentar somente uma mensagem de erro; não oferecer ação específica de tentar novamente.

## Assume que

| Premissa | Issue que fecha |
| --- | --- |
| A primeira tarefa usa dados fictícios locais; o código deve sinalizar a substituição pendente com `TODO #8`. A integração posterior substitui essa massa antes da conclusão da história. | #8 |

## Depende de

- US14: seleção de obra ativa.
- US03: despesas.
- US07: orçamentos por categoria.

## Decisões do autor sobre o PDF

| # | Decisão | Quem respondeu |
| --- | --- | --- |
| 1 | Um único PDF contém o consolidado por categoria e a lista individual de despesas ativas. | Autor |
| 2 | Em falha, apresentar apenas um erro, sem nova tentativa automática ou ação específica de tentar novamente. | Autor |
| 3 | Aproveitar a página visual de Relatórios nas primeiras páginas do PDF e manter a lista individual de despesas nas seguintes, conforme proposta aprovada para a tarefa 6. | Autor |
| 4 | O PDF visual exportado pela tela contém somente a composição visual, sem página textual de apêndice e sem cabeçalho de página; data de geração, pago e a pagar passam ao cabeçalho da composição. A Decisão 1 passa a valer somente para o contrato legado `GET /reports/pdf`, que não muda. Substitui a Decisão 3. | Autor |
| 5 | O PDF acompanha o período e a categoria aplicados na tela; sem filtro, exporta todo o histórico e todas as categorias. | Autor |
