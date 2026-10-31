---
issue: 7
status: rascunho
---

# US05 — Visualização e Filtros de Despesas

## O problema

O proprietário consegue cadastrar e consultar individualmente uma despesa, mas a página Contas a Pagar oferece apenas o acesso ao cadastro. Não consegue encontrar seus lançamentos em uma lista, comparar valores pagos e pendentes ou restringir a consulta por datas, categorias e fornecedor. Precisa conhecer o endereço individual de cada despesa para consultar seus dados.

## A história

**Como** proprietário com uma obra selecionada, **eu quero** visualizar a listagem paginada de despesas com filtros por período de compra, período de vencimento, múltiplas categorias e fornecedor, acompanhando totalizadores de valores pagos, pendentes e totais, **para que** eu possa gerenciar com clareza o fluxo financeiro da obra.

Fonte: [PRD — US05](../../docs/prd.md), [Issue #7](https://github.com/utfpr-gp/obra-certa/issues/7). A Issue foi conferida no navegador autenticado e sua descrição aponta somente para a história do PRD. O autor solicitou expressamente a US05 completa na página `/contas` durante o desenvolvimento da US04.

## Critérios de aceite

- [ ] **CA1 — Listagem paginada e totais:** Dada uma obra ativa do proprietário autenticado, quando ele acessa `/contas`, então a tela apresenta no máximo 15 despesas ativas por página, incluindo pagas e pendentes, com descrição, categoria, fornecedor, data da compra, vencimento quando houver, valor e situação do pagamento. Apresenta controles de página e três cards: Total Pago, Total a Pagar (Pendente) e Total Geral. Os totais correspondem a todo o conjunto filtrado da obra, não apenas à página visível, e Total Geral é a soma dos outros dois. A primeira consulta usa compras mais recentes primeiro. Valores são apresentados em reais e datas no formato brasileiro.
- [ ] **CA2 — Filtros de compra e vencimento:** Dada a listagem, quando o proprietário aplica um intervalo de compra e/ou vencimento, então lista e totais consideram apenas despesas cujas datas estão nos intervalos informados, incluindo seus limites. Cada limite pode ser informado isoladamente. Quando os dois períodos são usados, ambos precisam ser atendidos. Uma despesa sem vencimento não atende a um filtro de vencimento. Aplicar filtros inicia novamente na primeira página.
- [ ] **CA3 — Categorias e fornecedor:** Dada a listagem, quando o proprietário seleciona uma ou mais categorias e/ou um fornecedor, então lista e totais são restringidos a essas escolhas. Várias categorias representam alternativas entre si; fornecedor, categorias e períodos são combinados entre si. Nenhuma categoria selecionada significa todas. Os fornecedores seguem o contrato atual da US03, sem antecipar o catálogo global da US15. Filtros não concedem acesso a despesas ou fornecedores particulares de outro usuário.
- [ ] **CA4 — Ordenação e paginação dos resultados:** Dada uma consulta válida, quando o proprietário escolhe compras mais recentes, compras mais antigas, maior valor ou menor valor, então a ordenação é aplicada no servidor e a tela atualiza os resultados sem nova ação de aplicar. Ordenar inicia na primeira página, conserva os filtros aplicados e não altera os totais do conjunto. Navegar entre páginas conserva filtros e ordenação; empates têm desempate estável para evitar repetição ou omissão de itens entre páginas. A data usada pela ordenação é a data da compra.
- [ ] **CA5 — Obra sem despesas:** Dada uma obra ativa sem despesas ativas, quando a consulta termina, então a tela orienta cadastrar a primeira despesa, mantém acesso ao cadastro e apresenta os três totais em R$ 0,00, sem oferecer navegação para páginas inexistentes.
- [ ] **CA6 — Filtros sem resultados e limpeza:** Dada uma obra com despesas, quando uma combinação de filtros não encontra registros, então a tela informa que nenhum registro foi encontrado e apresenta os três totais zerados. Oferece Limpar filtros, que remove períodos, categorias e fornecedor, volta à primeira página e consulta novamente a obra ativa, conservando a ordenação escolhida. O botão também pode ser usado quando houver resultados filtrados.
- [ ] **CA7 — Entradas inválidas:** Dado um período de compra ou vencimento com data inicial posterior à final, quando o proprietário tenta aplicar os filtros, então o navegador destaca o período inválido e não envia a consulta. A API também rejeita datas inválidas, intervalos invertidos, página negativa e ordenação não reconhecida com 400, sem executar consulta financeira de outra obra. Igualdade entre início e fim é válida.
- [ ] **CA8 — Isolamento por proprietário e obra:** Dado um identificador de obra inexistente, excluída ou pertencente a outro usuário, quando a API recebe a consulta, então retorna 404 sem revelar despesas, contagens ou totais. A autorização é feita no servidor, inclusive para uma obra sem despesas. Sem obra selecionada, a tela orienta a seleção e não envia consulta de listagem nem exibe valores de uma obra anterior.
- [ ] **CA9 — Exclusão lógica:** Dadas despesas excluídas logicamente, quando lista, contagem de páginas ou totais são calculados, então esses registros são totalmente desconsiderados. Ao retornar a `/contas` após uma exclusão confirmada pela US04, a consulta atualizada não apresenta nem soma a despesa excluída. Exclusão não altera tetos planejados.
- [ ] **CA10 — Navegação e contexto:** Dada uma linha da listagem, quando o proprietário abre seus detalhes, então acessa a consulta individual existente da mesma despesa. Cadastrar conta continua levando a `/contas/nova`. Ao trocar de obra, a tela limpa filtros, reinicia a primeira página e consulta a nova obra; uma atualização de metadados da mesma obra não descarta a consulta. Respostas atrasadas de páginas, filtros ou obras anteriores não substituem o resultado atual, inclusive na sequência A → B → A. Fechar a página não grava alterações; não é exigida persistência dos filtros após sair da tela.
- [ ] **CA11 — Carregamento, falhas e sessão:** Dada uma consulta em andamento, então a tela informa carregamento sem apresentar lista e totais de parâmetros diferentes como se pertencessem à mesma consulta. Falha de rede ou servidor informa que os dados não puderam ser atualizados, sem apresentar zero como resultado confirmado, conserva os filtros enquanto a tela e a obra forem as mesmas e permite tentar novamente por ação do usuário. Não há repetição automática. Se a sessão expirar, a API retorna 401 e o tratamento existente encerra a sessão e leva ao login; após autenticar, o usuário volta manualmente à página, sem restauração ou reenvio automático da consulta.

## Fora de escopo

- Implementação das ações de edição, exclusão e comprovantes da US04. A listagem oferece acesso à consulta individual existente; as Tarefas 5 a 7 da US04 permanecem pendentes e não são dadas como concluídas pela US05.
- Filtro adicional por situação de pagamento, busca por texto, alteração de quantidade de itens por página, seleção em lote, exportação e relatórios.
- Gestão, validação ou compartilhamento global de fornecedores da US15; os fornecedores seguem o isolamento atual da US03.
- Painel de alertas e ação de quitação rápida da US08.
- Persistência dos filtros após sair da tela ou fazer login novamente, atualização em tempo real e funcionamento offline.
- Novas tabelas, fila, agendamento ou recuperação automática de arquivos.

## Abandono no meio

- **Fechar a tela:** apenas abandona uma consulta; não grava dados nem exige restaurar filtros ao voltar (CA10).
- **Trocar a obra:** limpa os parâmetros da obra anterior, consulta a nova e ignora respostas atrasadas, inclusive A → B → A (CA8 e CA10).
- **Mudar parâmetros durante carregamento:** somente a resposta da consulta mais recente pode atualizar lista e totais; não misturar resultados de parâmetros diferentes (CA4, CA10 e CA11).
- **Erro de conexão ou servidor:** manter filtros no contexto atual, informar indisponibilidade e oferecer nova tentativa manual, sem inventar totais zerados nem repetir a consulta automaticamente (CA11).
- **Sessão expirada:** aplicar o encerramento de sessão e o redirecionamento existentes; retorno à listagem é manual após autenticação (CA11).
- **Despesas excluídas enquanto fora da página:** o retorno e a nova consulta desconsideram os registros excluídos; não manter cópia financeira local como fonte dos totais (CA9).

## Assume que

| Premissa | Issue que fecha |
| --- | --- |

Não há substitutos novos: dados de despesas, categorias, fornecedores, pagamentos e obra ativa já existem. Não usar dados fixos para simular a consulta em produção.

## Depende de

- US03 / Issue #5 — cadastro, categorias, fornecedores, pagamentos e consulta individual de despesas.
- US14 / Issue #27 — autenticação, posse e seleção de obra.
- US04 / Issue #6 — edição e exclusão. As Tarefas 1 a 4 estão concluídas; a exclusão das Tarefas 5 a 7 continua pendente. O filtro de `deleted_at` pode ser provado com registros de teste desde o início; a integração completa de retorno após exclusão exige concluir a respectiva tarefa da US04.

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
