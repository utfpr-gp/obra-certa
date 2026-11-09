# Proposta — PDF visual da página de Relatórios

Estado: aprovada pelo autor. Incorporada à spec e ao plano como tarefa 6 após o fechamento da tarefa 4.

## Pedido e decisão do autor

Gerar o PDF aproveitando a página de Relatórios, com apresentação visual dos dados. O autor confirmou: “Página visual + lista de despesas”.

## Resultado esperado

Um único download, com a página visual nas primeiras páginas e o detalhamento individual nas seguintes. A parte visual inclui título da obra, quatro indicadores, rosca e legenda, barras comparativas, resumo e tabela por categoria. Não incluir sidebar, menu do usuário, botão de exportação, mensagens transitórias ou controles interativos.

Preservar o histórico completo da obra, conforme o contrato existente. A versão para exportação usa todas as categorias, mesmo se houver filtro local selecionado; a seleção e o layout de navegação do usuário não são alterados. A apresentação exportada usa composição desktop também quando acionada pelo celular.

Identificação, data, total orçado, realizado, pago, a pagar e balanço continuam obrigatórios. Informações de quitação que não aparecem na página visual devem constar no cabeçalho do detalhamento. As despesas individuais continuam em texto selecionável; os gráficos e cartões podem ser imagens com resolução adequada para leitura.

Paginar entre seções e linhas sempre que possível, sem cortar conteúdo, sobrepor elementos ou reduzir todo o relatório a uma imagem ilegível em uma única folha. Exportar também obra sem despesas. Manter nome seguro com obra/data, bloqueio de cliques duplicados, descarte ao trocar de obra/sair e apenas erro em falha, sem tentativa automática.

## Estratégia técnica proposta

- Reutilizar a apresentação Angular existente para a composição visual, compartilhando o template necessário entre tela e versão para exportação; não duplicar fórmulas financeiras nem criar uma segunda interpretação dos dados.
- Avaliar a captura de seções do DOM com `html-to-image` e montagem do arquivo com `pdf-lib`, com carregamento sob demanda. Validar compatibilidade com SVG, estilos existentes, fontes e paginação antes de fixar as versões e antes do RED. Não usar serviços externos de conversão.
- Reutilizar a geração autorizada com PDFBox para o apêndice de despesas. Acrescentar ao contrato interno a possibilidade de obter apenas o detalhamento, evitando repetir o consolidado textual após a página visual. O endpoint atual conserva seu comportamento padrão.
- Manter identificação, data, nome e despesas provenientes da API autorizada. As partes visual e detalhada devem corresponder à mesma obra e ao mesmo contexto de exportação; divergência, falha ou abandono interrompe o download.
- Captura e composição precisam respeitar o contexto depois de cada etapa assíncrona, inclusive importação das bibliotecas. O encerramento da requisição HTTP sozinho não basta para descartar a geração local.
- Preservar os limites de build existentes. As novas bibliotecas e a composição são carregadas apenas para exportar, sem inserir o código completo no bundle inicial.
- Nenhuma migration prevista.

Referências oficiais consultadas: [html-to-image](https://github.com/bubkoo/html-to-image), [pdf-lib](https://pdf-lib.js.org/).

## Alteração proposta na spec

Acrescentar **CA11 — PDF visual**: ao exportar, produzir um único PDF com a composição visual da página de Relatórios — indicadores, rosca, barras, resumo e detalhamento por categoria — seguida da lista individual de despesas ativas. Reutilizar a apresentação e dados autorizados, preservar todas as informações do CA3 e a paginação legível, sem elementos de navegação ou controles interativos. Manter CA4, CA5, CA6 e as regras de erro e abandono da exportação.

Não alterar o campo de aprovação da spec. O novo critério só integra a execução após o aceite explícito desta proposta.

## Tarefa proposta para o plano

- [ ] **Tarefa 6 — Gerar PDF visual a partir da página de Relatórios**
  - Cobre: CA11 e preservação de CA3, CA4, CA5 e CA6; mantém erro simples, prevenção de duplicidade e descarte da exportação abandonada.
  - Pré-condição: fechamento da tarefa 4 com aceite explícito do commit e aprovação desta proposta. Validar e fixar as bibliotecas de captura/composição antes do RED.
  - Teste primeiro: JUnit para apêndice autorizado sem repetição do consolidado, informações obrigatórias de quitação/data/nome, obra vazia, 404 e exclusão lógica; Jasmine para reutilização da apresentação, exportação global sem alterar seleção, captura dos gráficos, montagem de arquivo único, paginação e nome, falhas nas etapas locais/remotas e descarte por troca de obra/saída, inclusive A → B → A. Preservar as regressões existentes da exportação.
  - Implementação: compartilhar a apresentação da página, gerar as páginas visuais e anexar o detalhamento autorizado ao mesmo PDF, com resolução legível e carregamento sob demanda. Manter download direto pelo botão existente e o estado da tela após concluir ou falhar. Não abrir diálogo de impressão nem acrescentar seletor de formatos.
  - Validação visual: renderizar e inspecionar o PDF final inteiro, comparando gráficos, cores e valores com a página; verificar massa com várias categorias/despesas e obra vazia, acionando a exportação em desktop e em 360px.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/package.json` e lockfile; página de relatórios, apresentação compartilhada e testes; serviço local de captura/composição e testes; serviço HTTP de relatórios e testes; controlador/serviços de relatórios PDF e testes Java correspondentes. Ajustar somente os estilos necessários à exportação, sem alterar os limites de build.

## Encaminhamento

A tarefa 4 completou duas rodadas e recebeu dois pareceres finais de aprovação. Esta proposta registra uma mudança de apresentação solicitada pelo autor após essa revisão, com critério próprio; não é uma terceira rodada de correção da tarefa 4. Os pareceres existentes permanecem preservados. Após o aceite do autor, a tarefa 4 foi fechada no commit `6dcc15d` e a tarefa 6 foi iniciada.
