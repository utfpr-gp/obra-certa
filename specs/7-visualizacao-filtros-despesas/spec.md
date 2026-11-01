---
issue: 7
status: rascunho
---

# US05 — Visualização e Filtros de Despesas

## O problema

A página `/contas` permite cadastrar uma despesa, mas não consulta os registros existentes. O proprietário não consegue acompanhar pagamentos pendentes, vencidos e quitados nem acessar as ações da consulta individual a partir de uma listagem. O componente atual apresenta somente o acesso ao cadastro e a API de despesas possui consulta individual, sem consulta paginada por obra.

## A história

**Como** proprietário com uma obra selecionada, **eu quero** visualizar a listagem paginada de despesas com filtros por período de compra, período de vencimento, múltiplas categorias e fornecedor, acompanhando totalizadores de valores pagos, pendentes e totais, **para que** eu possa gerenciar com clareza o fluxo financeiro da obra.

Fonte: `docs/prd.md`, US05. O autor solicitou a listagem em `/contas` com separação entre Todas, Pendentes, Vencidas e Pagas. O arquivo `ContasAPagar-Desktop.png` é referência visual; valores, registros e textos demonstrativos não são dados nem requisitos adicionais da aplicação. Os filtros são mantidos porque estão previstos no PRD.

## Tarefas preliminares para validação

Esta decomposição detalha o recorte antes da aprovação da especificação. O plano executável será criado somente após a aprovação, preservando estas decisões ou registrando as alterações solicitadas pelo autor.

### Tarefa 1 — Consultar despesas paginadas da obra

- **Cobre:** CA1 e CA8.
- **Entrega:** criar o contrato de consulta paginada da API e a apresentação da listagem em `/contas`, limitada a 15 registros por página, com descrição, categoria, fornecedor, data de compra, vencimento, valor, situação e acesso à consulta individual. A consulta deve filtrar obra própria e ativa, despesas ativas e incluir despesas pagas sem registro de pagamento pendente.
- **Teste primeiro:** JUnit de integração para posse da obra, exclusão lógica, paginação e inclusão de despesas pagas à vista; `.spec.ts` Angular para renderização dos registros, paginação, link de consulta individual e acesso a “Cadastrar conta”.
- **Camadas:** DTOs, repository, service, mapper e controller em `apps/api`; modelo, service HTTP, componente de listagem e rota em `apps/web`.
- **Migration:** nenhuma; usar o schema existente.

### Tarefa 2 — Classificar a situação nas quatro abas

- **Cobre:** CA2.
- **Entrega:** implementar as abas Todas, Pendentes, Vencidas e Pagas. A API define uma única data de referência para classificar vencimentos; Pendentes inclui vencidas, Vencidas exclui quitadas e vencimentos do dia, e as abas sempre permanecem disponíveis.
- **Teste primeiro:** JUnit para cada recorte, vencimento nulo, vencimento igual à data de referência e despesas excluídas; `.spec.ts` para troca de aba, retorno à primeira página e manutenção das abas em resultados vazios.
- **Camadas:** enum/parâmetro de consulta, predicados do repository, regra no service e resposta da API; estado de aba e filtros do componente Angular.
- **Migration:** nenhuma.

### Tarefa 3 — Calcular e apresentar totalizadores

- **Cobre:** CA3.
- **Entrega:** retornar na consulta os totais de pago, a pagar e geral do conjunto filtrado, independentemente da página atual, e exibi-los com formatação monetária brasileira. Trocar somente de página não deve recalcular valores diferentes.
- **Teste primeiro:** JUnit para agregação com múltiplas páginas, valores pagos e pendentes e combinação com a aba; `.spec.ts` para cards, soma de Total Geral e estabilidade ao paginar.
- **Camadas:** projeção/agregação no repository ou service, DTO de resumo e componente/cards no Angular.
- **Migration:** nenhuma.

### Tarefa 4 — Aplicar filtros combinados e validar intervalos

- **Cobre:** CA4 e CA7.
- **Entrega:** permitir filtros inclusivos de compra, vencimento, múltiplas categorias e fornecedor autorizado, combinando-os com a aba atual. Filtro de vencimento exclui registros sem vencimento. Intervalos invertidos e parâmetros desconhecidos devem ser recusados pela tela antes do HTTP e também pela API.
- **Teste primeiro:** JUnit para cada filtro isolado, combinações, fornecedor de outro usuário, datas inválidas e parâmetros inválidos; `.spec.ts` para aplicação, limpeza, mensagens de validação, retorno à primeira página e preservação da aba.
- **Camadas:** parâmetros tipados, validação, queries de repository e service de fornecedores na API; formulário de filtros, modelo de consulta e service HTTP no Angular.
- **Migration:** nenhuma.

### Tarefa 5 — Ordenar antes de paginar

- **Cobre:** CA5.
- **Entrega:** oferecer ordenação por compra mais recente/mais antiga e valor maior/menor, com desempate estável. A ordenação inicial será compra mais recente; alterar a ordenação volta à primeira página sem remover filtros ou aba.
- **Teste primeiro:** JUnit para ordem, desempates e interação entre ordenação e paginação; `.spec.ts` para seleção da ordenação e preservação do contexto.
- **Camadas:** parâmetro de ordenação validado, `Sort`/consulta no repository e controles do componente.
- **Migration:** nenhuma.

### Tarefa 6 — Tratar estados vazios, carregamento e responsividade

- **Cobre:** CA6 e CA11.
- **Entrega:** distinguir obra sem despesas, resultado vazio por aba/filtro, carregamento e erro. Exibir orientação para cadastrar a primeira conta, totais zerados e ação de limpar filtros quando aplicável. Adaptar abas, cards, filtros, tabela/lista e ações para desktop e mobile sem dados demonstrativos.
- **Teste primeiro:** `.spec.ts` para cada estado, ausência de resultados sem erro, totais zerados, loading, identificação da aba, limpeza e acessibilidade das ações em viewport reduzido.
- **Camadas:** templates, signals de estado, componentes compartilhados e tokens existentes em `apps/web`; nenhuma nova regra persistida na API.
- **Migration:** nenhuma.

### Tarefa 7 — Preservar contexto, falhas e navegação

- **Cobre:** CA9 e CA10.
- **Entrega:** invalidar respostas antigas ao trocar obra, aba, filtros ou página, inclusive no ciclo A → B → A. Sem obra ativa, não consultar. Em falhas, limpar resultados antigos, preservar contexto e oferecer nova tentativa manual. Manter o interceptor de 401 e recarregar a listagem ao retornar do cadastro ou da consulta individual.
- **Teste primeiro:** `.spec.ts` com requests controlados para respostas atrasadas de sucesso/erro, troca de contexto, retry, ausência de obra, retorno de navegação e 401; teste de integração da API para confirmar que a consulta é somente leitura.
- **Camadas:** integração com `ActiveProjectService`, controle de geração/identidade das consultas, signals, rotas e service HTTP no Angular; controller/service de leitura na API.
- **Migration:** nenhuma.

## Critérios de aceite

- [ ] **CA1 — Listagem real e paginação:** Dada uma obra ativa própria selecionada, quando o proprietário acessa `/contas`, então a aplicação consulta suas despesas ativas e apresenta até 15 por página, com controles de paginação, descrição, categoria, fornecedor, data da compra, vencimento quando houver, valor e situação de pagamento. Cada registro oferece acesso à consulta individual já existente; o acesso a cadastrar conta permanece disponível. A listagem inclui despesas pagas à vista mesmo quando não possuem registro de pagamento associado.
- [ ] **CA2 — Abas de situação:** Dada a listagem, quando o usuário seleciona Todas, Pendentes, Vencidas ou Pagas, então a consulta aplica o respectivo recorte e retorna à primeira página. Todas inclui todas as despesas ativas; Pendentes inclui todas as não quitadas, inclusive vencidas; Vencidas inclui somente não quitadas com vencimento anterior à data corrente; Pagas inclui somente quitadas. Vencimento na data corrente não é atraso; sem vencimento não entra em Vencidas. A classificação usa uma única data de referência definida pela API, sem depender de um relógio diferente no navegador. As quatro abas permanecem disponíveis mesmo sem resultados.
- [ ] **CA3 — Totalizadores:** Dada uma consulta, quando seu resultado é apresentado, então os cards Total Pago, Total a Pagar e Total Geral somam o conjunto correspondente à obra, aos filtros e à aba selecionada, considerando todas as páginas desse conjunto, não apenas os registros da página atual. Total Geral é a soma de Pago e a Pagar. Os valores usam formatação monetária brasileira. Mudar somente a página não altera os totais.
- [ ] **CA4 — Filtros documentados:** Dada a listagem, quando o proprietário aplica intervalos inclusivos de data da compra e/ou vencimento, uma ou mais categorias e/ou um fornecedor, então os filtros se combinam, atualizam registros e totalizadores e retornam à primeira página, preservando a aba selecionada. Filtro de vencimento não inclui registros sem vencimento. Limpar filtros retira esses recortes e retorna à primeira página. A seleção de fornecedores respeita o cadastro atualmente autorizado ao usuário, sem implementar o catálogo global da US15.
- [ ] **CA5 — Ordenação:** Dada uma consulta, quando o proprietário escolhe data da compra mais recente/mais antiga ou valor maior/menor, então a API ordena o conjunto antes de paginar, com desempate estável. A ordenação inicial é data da compra mais recente. Alterar ordenação retorna à primeira página sem retirar filtros nem aba.
- [ ] **CA6 — Estados vazios:** Dada uma obra sem despesas ativas, quando a consulta conclui, então a tela orienta cadastrar a primeira conta e mostra os três totais zerados. Quando uma aba ou filtros não encontram registros em uma obra com despesas, mostra ausência de resultados, mantém acesso às abas e permite limpar os filtros quando aplicados. Uma resposta vazia não é apresentada como erro.
- [ ] **CA7 — Validações:** Dado um intervalo de compra ou vencimento cuja data inicial é posterior à final, quando o proprietário tenta consultar, então a tela destaca a inconsistência e não envia a consulta inválida; a API também recusa intervalos inválidos e parâmetros de consulta inválidos. A tela não apresenta dados antigos como se fossem resultados do filtro inválido.
- [ ] **CA8 — Isolamento e exclusão lógica:** Dada uma tentativa de consultar obra inexistente, excluída ou de outro proprietário, quando a API recebe a consulta, então responde 404 sem expor registros ou totais. Despesas excluídas são ignoradas em todas as páginas, abas e totalizadores. Consultar despesas não grava dados financeiros nem acessa comprovantes no armazenamento.
- [ ] **CA9 — Contexto e respostas atrasadas:** Dada uma consulta em andamento, quando a obra ativa muda, então a tela abandona os resultados e filtros da obra anterior e inicia uma consulta da nova obra em Todas e primeira página. Respostas antigas de sucesso ou erro são ignoradas, inclusive A → B → A. Consultas anteriores de filtros, abas ou páginas também não podem sobrescrever a mais recente. Atualizar somente os dados da mesma obra não abandona a seleção atual. Sem obra ativa, orienta selecionar uma obra e não envia consulta de despesas.
- [ ] **CA10 — Falhas, sessão e navegação:** Dada uma falha de rede ou servidor, quando a consulta não conclui, então a tela apresenta erro e nova tentativa manual, preservando filtros e aba do contexto atual sem apresentar números antigos como atuais. Em 401, utiliza o encerramento de sessão e redirecionamento existentes; não restaura automaticamente a intenção após login. Sair ou fechar a página não altera dados. Ao voltar do cadastro ou da consulta individual, a página consulta novamente os dados, refletindo inclusão, edição, quitação e exclusão já concluídas; não exige persistência dos filtros após sair da página.
- [ ] **CA11 — Apresentação responsiva:** Dado acesso desktop ou mobile, quando a listagem é exibida, então as quatro abas, os totais, os filtros documentados e as ações permanecem utilizáveis, com identificação de seleção e carregamento. O layout pode adaptar o protótipo aos componentes e tokens existentes sem criar dados demonstrativos nem copiar avisos próprios do cenário ilustrativo.

## Fora de escopo

- Banner de alertas de sete dias, painel da Home e ação rápida Marcar como Pago, previstos na US08. A quitação continua disponível pela edição da despesa entregue na US04.
- Busca textual livre por descrição, nome ou CNPJ: não consta dos filtros da US05 atual. Não é implementada apenas por aparecer no protótipo.
- Gestão, compartilhamento e validação de fornecedores da US15; nenhuma entrada independente de fornecedores no menu principal.
- Relatórios, exportação, gráficos, pagamentos bancários, importação de NF-e, parcelamento e novas regras financeiras.
- Novo status persistido Vencida; atraso é derivado da situação de pagamento e do vencimento.
- Recuperação persistente de filtros ou operações após login, repetição automática de mutações e infraestrutura de limpeza de arquivos.
- Duplicar formulários de edição, exclusão ou comprovantes na listagem: o acesso utiliza a consulta individual existente.

## Abandono no meio

- Trocar de obra abandona o contexto anterior; respostas tardias não atualizam a tela, inclusive ao voltar para a mesma obra (CA9).
- Trocar de aba, filtros ou página torna obsoletas as consultas anteriores (CA9).
- Perder a conexão permite repetir somente a consulta manualmente; não anuncia resultados atuais sem confirmação (CA10).
- Sessão expirada segue o login existente, sem restauração automática da consulta (CA10).
- Sair da página ou fechar a aba não grava nem altera despesas; retornar consulta o estado atual (CA10).

## Assume que

| Premissa | Issue que fecha |
| --- | --- |

Nenhum dado fixo ou endpoint simulado substitui a entrega real. Esta história inclui consulta paginada e agregação na API e sua apresentação no Angular.

## Depende de

- US14 / Issue #27 — seleção e isolamento de obras.
- US03 / Issue #5 — cadastro e consulta individual de despesas.
- US04 / Issue #6 — edição, pagamento e exclusão lógica, já implementados nesta base.

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
