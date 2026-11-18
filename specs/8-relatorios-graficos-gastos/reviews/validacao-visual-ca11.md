# Validação visual do PDF — CA11 (US06, Issue #8)

Commits validados: `8aafd28`, `f3ece2e` e `76f518f`, sobre `df41c48`, na branch `feature/8-relatorios-graficos-gastos`.

## Correções feitas nesta etapa

- Cabeçalho "Detalhamento por categoria" repetido no painel de totais do PDF visual. Removido. Commit `8aafd28`.
- Espaço vazio acima da linha de totais, causado pela linha de colunas oculta. Commit `f3ece2e`.
- Desalinhamento dos valores da linha de totais, causado pela medição de larguras de outra tabela. Substituído por uma linha de totais dentro da mesma tabela do detalhamento, com continuação de cabeçalho quando não cabe na página. Commit `76f518f`.

Testes do frontend após a última correção: 442 de 442, build com código de saída 0.

## Casos validados

| Caso | Forma de validação | Resultado |
| --- | --- | --- |
| Obra de teste "Teste", todo o histórico, todas as categorias, desktop | PDF gerado pelo autor na aplicação e inspecionado pelo agente (`relatorio-teste-2026-11-09 (3).pdf`) | Aprovado |
| Obra vazia (CA4): zeros e exportação permitida | Validação manual do autor | Aprovado pelo autor |
| Filtro de período e categoria (CA12): cabeçalho com o recorte aplicado | Validação manual do autor | Aprovado pelo autor |
| PDF gerado em 360px, composição desktop (CA11) | Validação manual do autor | Aprovado pelo autor |

## Verificações feitas pelo agente sobre os PDFs enviados pelo autor

- Cabeçalho com obra, data de geração, pago (R$ 7.093,50) e a pagar (R$ 20,00).
- Totais: orçado R$ 14.000,00 e realizado R$ 7.113,50, igual a pago mais a pagar.
- Saldo restante de R$ 6.886,50.
- Categorias: Acabamento e Pintura R$ 520,00, Fundação e Estrutura R$ 5.435,50 e Hidráulica R$ 1.158,00. Somam R$ 7.113,50, com participações de 7,3%, 76,4% e 16,3%.
- Fundação e Estrutura excede o previsto em R$ 2.435,50, com consumo de 181,2%.
- Linha "Total global da obra" dentro da tabela, com valores alinhados às colunas.
- Sem apêndice textual e sem cabeçalho de página.

## Limitação

Os três casos marcados como "validação manual do autor" não foram gerados nem inspecionados pelo agente. O registro reproduz a confirmação do autor. O agente não gerou os PDFs: inspecionou as versões `(1)`, `(2)` e `(3)` enviadas pelo autor, a última após as correções de `76f518f`.
