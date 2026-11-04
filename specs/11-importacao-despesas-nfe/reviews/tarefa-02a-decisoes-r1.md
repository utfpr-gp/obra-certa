# Decisões — Tarefa 2A, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Falta teste para o ramo `IOException` (`NfeXmlParser.java:91-92`), exigido pelo plano | conformidade | aceito como desvio registrado | Ramo não alcançável com `ByteArrayInputStream` (sondagem: UTF-8 inválido, UTF-16 declarado e BOM inconsistente viram `SAXParseException`). O `catch` foi mantido e o desvio está registrado em `plan.md`, na Tarefa 2A. |
| 2 | Teste de entidades aninhadas tem nome que promete limite de expansão do JDK, que a fixture não aciona (`NfeXmlParserTest.java:104`) | código | aceito | Renomeado para `recusaEntidadesAninhadasComDoctype`. O limite de expansão do JDK continua sem teste e está registrado como desvio (c). Decisão tomada pelo autor para a rodada 2. |
| — | Testes não executados pelos revisores (shell negado) | conformidade e código | resolvido | O autor rodou `NfeXmlParserTest`: 26/26, `BUILD SUCCESS`, na rodada 1 e na rodada 2. |
| — | RED não ocorreu para os itens (2) e (3) do plano | conformidade | registrado | Testes de caracterização: a mensagem de DOCTYPE já existia. Registrado como desvio (b) em `plan.md`. |

Sugestões (duplicação de template nos testes, constantes inline, helper com asserção genérica, configuração de `disallow-doctype-decl` como decisão do autor) não entraram na triagem.
