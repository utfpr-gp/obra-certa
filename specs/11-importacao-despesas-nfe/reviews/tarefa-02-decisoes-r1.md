# Decisões — Tarefa 2, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Recusa de DOCTYPE classificada pelo texto da mensagem do SAX (`NfeXmlParser.java:85-87`) | código | aceito | O motivo deve vir da estrutura do documento depois do parse (`getDoctype() != null`), e não de texto interno da biblioteca. |
| 2 | Chave de acesso não validada como 44 dígitos (`NfeXmlParser.java:112-118`) | código | aceito | A coluna `nfe_key` é `varchar(44)`; o parser é a fronteira onde o formato deve ser garantido. Validação do DV continua fora de escopo. |
| 3 | Ramos de recusa sem teste de comportamento (`NfeXmlParserTest.java` e `NfeXmlParser.java:43-49`, `:51-53`, `:66-67`, `:97-108`, `:115`) | código | aceito | Recusa de XML inválido é o escopo da tarefa; cada ramo precisa de teste. |
| — | Conformidade: execução dos testes não rodada pelo revisor | conformidade | resolvido | O autor rodou `NfeXmlParserTest`: 4/4, `BUILD SUCCESS`. |

Sugestões do revisor de código (preservar a causa do `SAXException`, tratar `IOException` como infraestrutura, remover configuração redundante, comparar motivo por código e não por texto, classificar `Id` sem prefixo `NFe` como "não é NF-e") não entraram na triagem e ficam registradas no parecer.
