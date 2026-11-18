# Decisões — Tarefa 2, rodada 2

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Ramos de recusa sem teste: IOException, default do switch, `NFe` sem `infNFe`, `filho()` ausente (`NfeXmlParser.java:91-92, 105, 109, 133`) | conformidade | aceito | Cada ramo de recusa precisa de teste de comportamento. |
| 2 | Teste do DTD externo só confere o tipo, não a mensagem (`NfeXmlParserTest.java:92-100`) | conformidade e código | aceito | Teste de recusa precisa provar o motivo. |
| 3 | Remoção de `disallow-doctype-decl` sem decisão registrada: entidades internas são expandidas antes da recusa (`NfeXmlParser.java:74-87`) | código | aceito | Problema confirmado. Solução escolhida pelo autor: (b) manter a remoção de `disallow-doctype-decl`, registrar a decisão e cobrir com teste de entidades aninhadas. |
| 4 | Parser fora do pacote declarado: está em `service/`, a arquitetura prevê `integration/` (`NfeXmlParser.java:1`, `architecture.md` §1, linha 67) | código | aceito | O parser é o adaptador do formato NF-e, externo ao sistema. A arquitetura o coloca em `integration/`, junto de `ReceiptStorage`. |

Aceito na rodada 2: a tarefa para e escala para o autor. Não existe rodada 3.
