---
issue: 9
status: rascunho
---

# US07 — Definição e Acompanhamento de Orçamento por Categoria

## O problema

Hoje o proprietário não consegue planejar quanto pretende gastar em cada categoria de uma obra. A rota `/orcamentos` existe apenas como placeholder e não há endpoint de orçamento; sem teto por categoria, o gasto real não tem com o que ser comparado, o estouro só é percebido depois do fato e despesas lançadas em categorias sem planejamento passam sem auditoria. Isso quebra a previsibilidade financeira justamente quando a obra mais precisa dela.

## A história

**Como** proprietário com uma obra selecionada, **eu quero** definir o orçamento previsto por categoria, acompanhar o consumo individual e global com alertas visuais e zerar tetos quando necessário, **para que** eu mantenha a previsibilidade financeira e audite despesas não orçadas.

## Critérios de aceite

- [ ] **CA1 — Definição/atualização de orçamento por categoria:** Dado que o proprietário está autenticado e tem uma obra ativa, quando informa um valor positivo (até duas casas decimais) para uma categoria pré-definida e salva, então o sistema cria o teto quando não existe registro ativo daquela categoria na obra, ou atualiza o registro existente quando já existe (RN08), mantendo **um único orçamento ativo por par obra/categoria**, e devolve o valor planejado, o gasto acumulado e o percentual recalculados.
- [ ] **CA2 — Acompanhamento visual de progresso e alertas de consumo:** Dado que a obra possui orçamentos cadastrados, quando o painel de orçamentos é carregado, então o sistema exibe:
  - Para cada categoria com teto ou com despesa ativa, barra de progresso com o percentual consumido (`gasto ÷ teto × 100`);
  - No topo, total planejado, total gasto, saldo disponível (`planejado − gasto`, podendo ser negativo) e percentual global (`total gasto ÷ total planejado × 100`);
  - Destaque **verde** abaixo de 90%, **amarelo** de 90% a 99,99% e **vermelho** a partir de 100%, decidido pela razão exata, não pelo percentual já arredondado;
  - Quando o total planejado é R$ 0,00, o percentual global aparece como `—` e nenhum cálculo divide por zero.
- [ ] **CA3 — Alerta de despesas em categoria sem teto:** Dado que existem despesas ativas em uma categoria cujo orçamento está zerado ou nunca foi definido, quando o painel é exibido, então a linha da categoria mostra o alerta de auditoria “Há despesas nesta categoria sem orçamento definido. Defina um teto ou reclassifique a despesa.”, com a ação **“Definir teto” habilitada** (abre o formulário já naquela categoria) e a ação **“Reclassificar despesa” visível, porém desabilitada**, com tooltip “Disponível após a implementação da tela de despesas (US04/US05)”.
- [ ] **CA4 — Zeramento de orçamento com confirmação e cancelamento:** Dado um orçamento ativo, quando o proprietário aciona “Zerar” e confirma no diálogo, então o sistema grava R$ 0,00 no registro existente (sem apagá-lo), recalcula total planejado, saldo, percentual global e estado da categoria, e passa a exibir o alerta de despesas sem teto caso haja gasto atrelado. Quando cancela, fecha pelo X ou tecla `Escape`, nenhuma requisição é enviada e o valor orçado permanece inalterado.
- [ ] **CA5 — Bloqueio de redução abaixo do total já gasto (RN02):** Dado que a categoria possui despesas ativas somando R$ X, quando o proprietário tenta salvar um valor positivo menor que X, então a API responde **409** sem persistir e a tela mantém o formulário aberto exibindo “O orçamento não pode ser menor do que o total de despesas já realizadas nesta categoria: R$ X”, acompanhada do atalho **“Ver despesas desta categoria” visível e desabilitado**, com tooltip “Disponível após a implementação da tela de despesas (US05)”. Valor exatamente igual a X é aceito (saldo zero).
- [ ] **CA6 — Rejeição de valor inválido no formulário:** Dado o formulário de criação/edição, quando o valor está vazio, é zero, negativo ou tem mais de duas casas decimais, então a tela bloqueia o envio com o aviso “Informe um valor positivo com até duas casas decimais.” e a API, se chamada diretamente, responde **400** sem gravar. Zerar só é possível pela ação explícita de zeramento (CA4).
- [ ] **CA7 — Isolamento por usuário (Anti-IDOR / RN01):** Dado obra ou orçamento pertencente a outro proprietário, quando qualquer leitura (`GET /api/budgets?projectId=...`) ou escrita (`PUT /api/budgets/{projectId}/categories/{categoryId}` e `POST .../zero`) é solicitada, então a API responde **404 “Projeto não encontrado”** (ou “Categoria não encontrada” para categoria inexistente), sem revelar a existência do recurso, e nenhum total de outra obra aparece na tela.
- [ ] **CA8 — Estados vazios:** Dado que a obra ativa não possui nenhum orçamento e nenhuma despesa ativa, quando o proprietário acessa `/orcamentos`, então vê estado orientativo com os totais zerados, o texto “Defina o primeiro orçamento para começar a acompanhar categorias, gastos e saldo.” e o CTA “Definir primeiro orçamento”, que abre o formulário. Se **não houver obra ativa**, a página não chama a API de orçamentos e exibe orientação para selecionar ou cadastrar uma obra, com link para a Home.
- [ ] **CA9 — Abandono: cancelamento, troca de obra e duplo envio:** Dado um formulário de criação/edição ou diálogo de zeramento aberto, quando o proprietário cancela, fecha pelo X, tecla `Escape`, troca a obra ativa na Navbar ou clica mais de uma vez em salvar, então:
  - Cancelar/fechar não persiste nada e mantém a lista intacta;
  - Trocar a obra ativa fecha o diálogo e recarrega o painel da nova obra, sem gravar na obra anterior;
  - O botão de envio fica desabilitado durante a requisição, impedindo orçamento duplicado ou zeramento repetido com efeito colateral.
- [ ] **CA10 — Abandono: falha de rede e sessão expirada:** Dado que a conexão falha, sofre timeout ou a sessão expira durante uma leitura, salvamento ou zeramento, quando a resposta não chega ou retorna erro de rede/5xx, então a tela mantém os valores digitados, exibe aviso de falha de conexão e permite nova tentativa; quando a resposta é **401**, o `authInterceptor` encerra a sessão e redireciona para `/login`, sem gravação parcial no servidor.

## Fora de escopo

- Cadastro, edição, listagem, filtros e reclassificação de despesas (US03/US04/US05). Os atalhos para despesas permanecem desabilitados nesta história.
- Relatórios, gráficos comparativos e exportação em PDF (US06).
- Busca por categoria, filtro por estado e ordenação configurável mostrados no protótipo: não são exigidos pelos critérios de aceite e ficam para uma história de refinamento da tela.
- Histórico/versionamento das alterações de teto (o sistema guarda apenas `updated_at`).
- Rateio de despesas entre categorias, múltiplas moedas e impostos.
- Definição inline de orçamento no formulário da obra (US14).
- Compartilhamento da obra entre proprietários distintos.

## Abandono no meio

- **Fechar o formulário de orçamento:** o modal de criação/edição não descarta os valores por clique acidental no backdrop; só cancelar, o X ou `Escape` fecham a tela. Ao fechar, nenhuma chamada é feita e o painel continua com os dados anteriores.
- **Fechar o diálogo de zeramento:** o `ConfirmModal` compartilhado ignora o clique no backdrop e `Escape` equivale a cancelar; o teto permanece exatamente como estava.
- **Troca da obra ativa:** a Navbar pode mudar a obra a qualquer momento. O salvamento carrega o `projectId` de quando o formulário abriu, então trocar de obra fecha o diálogo antes que um valor seja gravado na obra errada.
- **Duplo clique / submissão repetida:** o botão de envio é desabilitado enquanto a requisição está em voo. O `PUT` é um upsert idempotente por obra/categoria e o zeramento grava R$ 0,00 mesmo se repetido.
- **Queda de rede ou timeout:** o formulário permanece preenchido com uma faixa de erro e o botão reabilitado para nova tentativa. Nada é atualizado de forma otimista no painel: o estado exibido só muda depois da resposta do servidor.
- **Sessão expirada:** qualquer 401 durante a leitura ou o salvamento é tratado pelo `authInterceptor` existente, que encerra a sessão e leva ao login; ao voltar, a página recarrega o painel do zero.
- **Aba fechada durante o preenchimento:** se a aba fechar antes do envio, nada foi gravado; se fechar depois do envio, o servidor mantém o último valor confirmado e a próxima carga reflete esse estado.

## Assume que

| Premissa | Issue que fecha |
| --- | --- |
| A única fonte de despesas desta história é o seeder `DevDemoDataSeeder`, restrito ao perfil `dev` e desligado por padrão, porque ainda não existe cadastro nem listagem de despesas no produto. | `US03` / `US05` (Issues do backlog de despesas) |
| Os atalhos “Ver despesas desta categoria” e “Reclassificar despesa” ficam visíveis, porém desabilitados. | `US04` / `US05` |

## Depende de

- `US14` (Issue #27) — obra ativa, seletor global e vínculo `budgets.project_id` / `expenses.project_id`. Presente na branch base `feature/27-gestao-projetos`.
- As 9 categorias pré-definidas são entregues por esta própria história (migration + `GET /api/expense-categories`), portanto não são dependência externa.

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
