# Proposta — Filtro de período nos relatórios

Estado: aprovada pelo autor em 03/11/2026, incluindo a edição da spec (CA11, CA12, Fora de escopo e Decisão 5) e a exportação refletindo período e categoria.

## Pedido e decisões do autor

O campo de período hoje é fixo: um input `readonly` com "Todo o histórico" e a nota "Visão acumulada • sem recorte por datas individuais" (`reports-page.component.html:13,18`). O autor pediu dois campos — **Período de** e **Período até** — que iniciam vazios (sem filtro), com **Filtrar** e **Limpar**.

Decisões registradas:

1. **Filtro real no servidor.** O relatório chega agregado por categoria, então não há como recortar datas no navegador: `GET /api/projects/{id}/reports` passa a aceitar `from` e `to` (datas ISO, opcionais; ausente = sem limite).
2. **PDF acompanha a tela.** A exportação passa a refletir o período **e a categoria** aplicados; sem filtro, continua todo o histórico e todas as categorias. Isso substitui a decisão anterior de exportar sempre tudo (Decisão 4/CA11).
3. **Intervalo inválido bloqueia.** Data inicial posterior à final mostra uma mensagem única e **não** dispara consulta; os dados exibidos permanecem os últimos aplicados.
4. O ajuste nasce como **tarefa 8** na Issue #8, com alteração da spec (hoje "filtros por datas individuais" está no Fora de escopo).

## Regra do recorte

- **Orçamento previsto não é recortado** — orçamento não tem data; o previsto por categoria e o total planejado continuam integrais.
- **Realizado é recortado** por `purchaseDate` entre `from` e `to`, com limites **inclusivos**.
- Caem sob o recorte: distribuição (rosca e legenda), comparativo previsto × realizado, resumo, detalhamento por categoria, totais pago e a pagar, e o "sem despesas" do período.
- Despesas excluídas logicamente continuam fora, e a posse da obra continua validada antes de qualquer consulta (404 para obra alheia).
- Categoria: na tela o filtro continua local (resposta única, filtro imediato); na exportação o servidor filtra pela categoria enviada, para que **pago e a pagar** e os totais do PDF sejam os da categoria, não os globais.

## Contrato

- `GET /api/projects/{id}/reports?from=AAAA-MM-DD&to=AAAA-MM-DD` — parâmetros opcionais; `from` > `to` responde `400` com a mensagem de período inválido (defesa do servidor; a tela bloqueia antes).
- `GET /api/projects/{id}/reports/export?from=&to=&category=` — mesmos parâmetros; devolve o snapshot já recortado, com nome e data de geração como hoje.

## Tela

- Filtros: `Período de` e `Período até` (`type="date"`), vazios por padrão; **Filtrar** aplica e recarrega; **Limpar** zera os campos e volta ao histórico completo.
- Digitado ≠ aplicado: só o clique em **Filtrar** altera os dados exibidos; trocar de obra zera o período.
- Mensagem de erro de intervalo aparece junto aos filtros, sem apagar o que está na tela e sem consultar.
- Cabeçalho da composição exportada passa a dizer o período aplicado ("Todo o histórico" ou "dd/mm/aaaa a dd/mm/aaaa") e a categoria ("Todas as categorias" ou o nome), no lugar do texto fixo atual.

## Alteração proposta na spec

- **CA11 (ajuste):** onde hoje está "Exportar todo o histórico e todas as categorias", passa a valer "Exportar o período e a categoria aplicados na tela; sem filtro, todo o histórico e todas as categorias."
- **CA12 — Período (novo):** dadas data inicial e final opcionais, aplicar o recorte ao realizado, à distribuição, ao comparativo, ao resumo e ao detalhamento, mantendo o orçamento previsto integral; data inicial posterior à final bloqueia a consulta com uma mensagem e não altera os dados exibidos; Limpar restaura o histórico completo; trocar de obra restaura o período vazio.
- **Fora de escopo:** remover "filtros por datas individuais"; permanece "alterações nas demais funcionalidades".
- **Decisão 5 (nova):** o PDF acompanha o período e a categoria aplicados na tela; sem filtro, todo o histórico e todas as categorias. Substitui a parte da Decisão 4 que fixava "somente todo o histórico/todas as categorias" na exportação.

## Encaminhamento

- Tarefa 8 no `plan.md` da Issue #8, depois da tarefa 7.
- Nenhuma migration.
- Tutor explica antes; autor aceita; implementador roda com TDD; dois revisores.
- A validação visual pendente da tarefa 7 pode ser absorvida pela validação da tarefa 8 (PDF com e sem período).
