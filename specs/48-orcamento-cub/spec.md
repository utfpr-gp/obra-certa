---
issue: 48
status: rascunho
---

# US15 — Orçamento por Categoria a partir do SINAPI

## O problema

Hoje, o proprietário informa manualmente um teto por categoria. Quando só dispõe de uma referência de custo por metro quadrado, precisa calcular a estimativa da obra, dividir o valor entre as categorias e cadastrar cada teto.

## A história

**Como** proprietário, **quero** usar o custo médio por m² do SINAPI para estimar o custo da minha obra e distribuir esse valor entre as categorias, **para** salvar os tetos de gastos a partir de uma referência mensal.

## Critérios de aceite

- [ ] **CA1 — Consultar o SINAPI.** Ao escolher **Usar SINAPI** em **Orçamentos → Adicionar orçamento**, o proprietário informa área positiva e seleciona UF, mês de referência, projeto de referência e padrão de acabamento. A prévia exibe a fonte, o custo por m² da combinação retornado pelo SIDRA/IBGE (tabela 647, variável 51) e a estimativa em reais, calculada pela multiplicação do custo por m² pela área informada.
- [ ] **CA2 — Conferir o rateio.** A prévia carrega a mesma tabela inicial de percentuais da US15 no PRD para os oito projetos e todos os acabamentos disponíveis. O proprietário pode ajustá-los e conferir o valor de cada parcela. A confirmação exige percentuais não negativos com soma igual a 100%. As parcelas em centavos somam exatamente a estimativa exibida.
- [ ] **CA3 — Preservar tetos existentes.** A prévia identifica cada categoria com teto existente e exibe seu valor atual, inclusive quando é zero. Ao confirmar, o sistema cria tetos somente para categorias da obra selecionada com parcela positiva e sem teto ativo. As parcelas excluídas da gravação ficam sem redistribuição automática.
- [ ] **CA4 — Gravar em conjunto.** A gravação verifica novamente quais categorias já têm teto e preserva também os tetos criados após a prévia. Uma falha na gravação de qualquer teto novo impede a aplicação de todo o lote. Repetir uma confirmação concluída preserva os tetos já criados. A obra deve pertencer ao proprietário autenticado.
- [ ] **CA5 — Tratar falha na consulta.** Se o SIDRA falhar ou o custo por m² solicitado estiver indisponível, o sistema informa a situação e impede a confirmação até obter um valor válido para a seleção atual.
- [ ] **CA6 — Cancelar antes da confirmação.** Fechar o formulário antes de confirmar descarta a prévia e os ajustes locais. As alterações no orçamento começam somente quando o proprietário confirma.
- [ ] **CA7 — Exibir projetos e acabamentos.** O seletor de projeto oferece as oito opções da seção **Projetos de referência** da US15 no PRD, agrupadas em **Casa popular** e **Casa residencial**. Para a UF, o mês e o projeto selecionados, o sistema oferece apenas acabamentos com custo por m² numérico e positivo. Ao mudar a seleção, invalida a prévia anterior e só habilita a confirmação após obter um valor para a combinação atual. Se nenhum acabamento estiver disponível, aplica-se o CA5.
- [ ] **CA8 — Consultar sob demanda.** O Obra Certa usa o índice e os dados da consulta temporariamente para gerar a prévia e calcular os tetos. Ao encerrar o fluxo, descarta o índice, os parâmetros, a resposta da fonte e a memória do cálculo. Esses dados ficam fora do banco, do cache persistente e dos logs. Após a confirmação, somente os tetos resultantes são persistidos no orçamento da obra.

## Fora de escopo

- Orçamento detalhado por insumos, composições ou serviços.
- Seleção de regime de desoneração.
- Edição de tetos existentes pelo fluxo SINAPI e redistribuição automática das parcelas excluídas.

## Abandono no meio

O proprietário pode fechar o formulário enquanto consulta o índice ou ajusta o rateio. Até a confirmação, a interação só produz uma prévia. Uma consulta sem resposta precisa terminar em estado de erro com possibilidade de repetir a consulta. Se a conexão cair após a confirmação, a gravação pode ter sido concluída. Uma nova tentativa preserva os tetos existentes, e o orçamento da obra informa quais valores foram salvos.

## Assume que

| Premissa | Issue que fecha |
| --- | --- |

## Depende de

- US07 para tetos por categoria e US14 para seleção e autorização da obra.
- Disponibilidade da API pública do SIDRA/IBGE para as UFs e os meses oferecidos.

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
