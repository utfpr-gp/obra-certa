# Proposta — PDF de exportação somente com a composição visual

Estado: aprovada pelo autor em 03/11/2026 — remoção da página de apêndice e do cabeçalho de página, com a redação da CA3/CA11 e a Decisão 4 confirmadas na leitura do tutor.

## Pedido e decisão do autor

O autor pediu a remoção, no PDF visual, do bloco repetido que hoje abre a página de apêndice:

```
ObraCerta | Relatório financeiro | Página 1
ObraCerta - Relatório financeiro
Obra: Teste
Identificação: 0c62b2ce-eb4a-45f6-8233-b3f04edb88df
Data de geração: 03/11/2026 (UTC)
Todo o histórico da obra
Total orçado: R$ 1.000,00
Total realizado: R$ 500,00
Pago: R$ 0,00
A pagar: R$ 500,00
Saldo: R$ 500,00
Despesas ativas - detalhamento individual
```

Decisões registradas na triagem de 03/11/2026:

1. **A página de apêndice inteira sai** do PDF de exportação — o arquivo fica somente com as páginas visuais.
2. **O cabeçalho de página** `ObraCerta | Relatório financeiro | Página N` **também sai**.
3. O ajuste **não altera a tarefa 6** (fechada no commit `c141eae`, com as duas rodadas de revisão aprovadas): nasce como **tarefa 7**, com decisão registrada na spec e ciclo próprio de implementação e revisão.

## O que muda no PDF

- O PDF de exportação passa a conter **apenas** a composição visual: indicadores, rosca, barras, resumo e detalhamento por categoria.
- Não há mais página textual de despesas individuais, nem cabeçalho/numeração de página.
- A **identificação da obra** passa a ser o nome exibido no cabeçalho da composição (o identificador interno/UUID não vai ao PDF).
- **Data de geração, pago e a pagar**, que só existiam no apêndice, passam para o cabeçalho da composição visual, para o CA3 continuar atendido sem a página removida.
- `GET /api/projects/{id}/reports/pdf` (contrato legado) **permanece como está** — a remoção é do caminho visual (`GET .../reports/export`).

## Alteração proposta na spec

**CA3 — PDF (texto novo):** ao exportar, gerar sincronamente um único `relatorio-{nome-da-obra}-{data}.pdf` com identificação da obra, data de geração, total orçado, realizado discriminando pago e a pagar e balanço por categoria, apresentados na composição visual da página. Em falha, apresentar somente uma mensagem de erro, sem nova tentativa automática nem ação específica de tentar novamente.

**CA11 — PDF visual (texto novo):** ao exportar, produzir um único PDF com a composição visual da página de Relatórios — indicadores, rosca, barras, resumo e detalhamento por categoria —, sem página textual de apêndice e sem cabeçalho de página. Reutilizar a apresentação e dados autorizados, preservar a paginação legível e os dados obrigatórios do CA3 no cabeçalho da composição, sem elementos de navegação ou controles interativos. Manter CA4, CA5, CA6 e as regras de erro e abandono da exportação. Exportar todo o histórico e todas as categorias, com composição desktop mesmo quando acionado pelo celular, sem alterar a seleção de categoria da tela.

**Decisão 4 (nova):** o PDF de exportação contém somente a composição visual; a página de apêndice textual e o cabeçalho de página são removidos, e data de geração, pago e a pagar passam ao cabeçalho da composição. Substitui a Decisão 3.

## Encaminhamento

- A tarefa 7 entra no `plan.md` da Issue #8, depois da tarefa 6.
- Nenhuma migration.
- O tutor explica a tarefa antes da implementação; o autor aceita, e só então o implementador roda.
- A validação visual pendente da tarefa 6 (inspeção do PDF em desktop e 360 px) pode ser absorvida pela validação da tarefa 7, que termina com um PDF sem apêndice.
