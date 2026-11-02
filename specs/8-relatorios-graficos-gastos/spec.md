---
issue: 8
status: aprovada
---

# US06 — Relatórios e Gráficos de Gastos

## O problema

O proprietário precisa entender a distribuição dos gastos e comparar as despesas com os limites da obra. Antes da integração financeira, precisa validar toda a interface da US06 usando dados fictícios e a referência visual Relatorios-Desktop.png fornecida pelo autor. A ampliação solicitada em 02/11/2026 inclui os estados e casos de borda das tarefas 2–4 na tarefa 1. O autor autorizou esta revisão e as três propostas apresentadas com a instrução “Realize os ajustes”.

## A história

**Como** proprietário com uma obra selecionada, **eu quero** visualizar gráficos comparativos entre orçamento previsto e despesas acumuladas e exportar um relatório consolidado em PDF do histórico da obra, **para que** possa analisar o equilíbrio financeiro e identificar sobras ou estouros orçamentários.

Decisões aprovadas para a interface e a integração: PDF consolidado por categoria, sem lista individual de despesas; em falha ou interrupção, nova tentativa manual, sem geração ou download automático ao retornar ou trocar de obra; filtro de categoria restringe somente a tela, enquanto a prévia e a exportação usam todo o histórico da obra, com aviso explícito.

## Critérios de aceite

- [ ] **CA1 — Distribuição:** dadas despesas ativas, ao abrir relatórios, exibir gráfico de rosca com valores absolutos, percentuais e legenda de todas as categorias com despesas.
- [ ] **CA2 — Comparativo:** dadas categorias orçadas, exibir barras de previsto e realizado na mesma escala, com saldo positivo em verde e excedente em vermelho; omitir categorias sem orçamento.
- [ ] **CA3 — PDF:** ao exportar, gerar sincronamente `relatorio-{nome-da-obra}-{data}.pdf`, com identificação da obra, total orçado, realizado discriminando pago e a pagar, balanço por categoria e data de geração.
- [ ] **CA4 — Sem movimentação:** dada obra sem despesas, preservar os valores orçados existentes, apresentar realizado zero e permitir exportação.
- [ ] **CA5 — Posse:** ao consultar dados ou PDF de obra alheia, responder que a obra não foi localizada.
- [ ] **CA6 — Exclusão lógica:** ignorar despesas excluídas nos gráficos e no PDF.
- [ ] **CA7 — Primeira etapa visual completa:** apresentar frontend com dados fictícios, inspirado na referência enviada: título, filtros, quatro indicadores, rosca, barras horizontais, resumo e detalhamento por categoria. Reutilizar o layout e os tokens existentes. No celular, organizar o conteúdo em coluna e converter o detalhamento em cartões. Identificar o cenário como demonstrativo. Disponibilizar um seletor claramente identificado de cenários de demonstração para verificar todos os estados dos CA11–CA15; ele será removido na integração. Nenhum cenário simulado altera autenticação ou dados reais.
- [ ] **CA8 — Consistência do demonstrativo:** totais, saldos, percentuais e destaques derivam de uma única massa fictícia, com pelo menos uma categoria excedida; arredondar somente na apresentação. Os números da imagem são ilustrativos e não devem produzir totais contraditórios.
- [ ] **CA9 — Controles do protótipo:** período permanece em todo o histórico; seleção de categoria atualiza as visualizações da tela de forma consistente. O botão de PDF abre prévia demonstrativa do documento, sem download nem mensagem de sucesso real. Identificar a seleção como recorte da tela e avisar que a prévia/exportação consolida toda a obra independentemente do filtro.
- [ ] **CA10 — Abandono do protótipo:** sair da tela, recarregar ou trocar o cenário descarta avisos, prévia e operações simuladas, sem gravação financeira ou download; retornar restaura o cenário demonstrativo inicial. Troca da obra ativa limpa a apresentação anterior e volta ao cenário inicial identificado como fictício, sem sugerir que os valores pertencem à obra selecionada.
- [ ] **CA11 — Estados de consulta:** permitir visualizar carregamento, erro com “Tentar novamente”, ausência de obra com orientação para usar o seletor existente e obra não localizada. Nesses estados, não apresentar números anteriores como atuais nem permitir exportar. A nova tentativa é simulada e explicitamente demonstrativa. Prever a transição de troca de obra sem exibir resultados anteriores.
- [ ] **CA12 — Cenários financeiros completos:** demonstrar obra com orçamentos sem despesas, obra totalmente vazia, despesas sem qualquer orçamento e cenário misto com categoria sem teto, categoria abaixo do teto, exatamente no limite e excedida. A rosca inclui somente categorias com gastos; o comparativo inclui somente categorias orçadas. Exibir “Sem orçamento” e consumo “—” quando não há teto, sem classificar como excedido; igualdade aparece como “No limite”, sem excedente. Saldo positivo é verde e excedente é vermelho. Estados sem gastos usam mensagem de ausência de despesas, sem rosca fictícia ou maior gasto inventado; ausência de orçamento usa mensagem própria no comparativo. Todos os valores e percentuais são finitos; participação sem gastos é “—”, inclusive no total, e escalas sem dados não geram divisões por zero. A exportação continua disponível para obra válida vazia.
- [ ] **CA13 — Layout do documento:** demonstrar uma prévia responsiva do PDF, com título, identificação da obra demonstrativa, geração/data/hora, nome previsto do arquivo, total orçado, total realizado, pago, a pagar e tabela de saldo/estado por categoria. Pago mais a pagar corresponde ao realizado. Oferecer fechamento acessível, devolver foco ao acionador e organizar o conteúdo legivelmente em 360px. A prévia é identificada como demonstrativa e não gera arquivo real.
- [ ] **CA14 — Estados de exportação:** demonstrar geração em andamento com texto de status e acionador desabilitado, falha com mensagem e nova tentativa manual, e retorno ao estado inicial ao sair ou trocar de contexto. Não aceitar cliques duplicados nem anunciar download concluído. Interrupção nunca gera novo pedido ou download automático ao retornar ou trocar de obra.
- [ ] **CA15 — Cobertura de dados na demonstração:** usar registros fictícios que permitam verificar a retirada de uma despesa excluída dos totais, gráficos e prévia, sem expor opção para incluí-la nos cálculos. O cenário de obra não localizada apenas demonstra a mensagem: a autorização e a exclusão lógica reais continuam sendo verificadas no backend nas tarefas seguintes.

## Fora de escopo

- Na primeira tarefa visual: chamadas de relatórios à API, persistência, geração real de PDF e implementação das proteções de backend dos CA5 e CA6. A tarefa 1 entrega a apresentação e os comportamentos simulados desses casos; as garantias de produção continuam obrigatórias nas tarefas 2–4.
- Filtros por datas individuais e alterações nas demais funcionalidades.
- Reprodução dos avisos técnicos e aproximações numéricas da imagem como regras de negócio.

## Abandono no meio

O protótipo mantém somente estado local de apresentação. Navegar para outra tela, recarregar ou trocar de contexto descarta filtros temporários, prévia e operações simuladas e não modifica a obra. A interface de interrupção e nova tentativa manual é demonstrada na tarefa 1 e preservada na integração: não gerar novo pedido ou download automático ao retornar.

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
