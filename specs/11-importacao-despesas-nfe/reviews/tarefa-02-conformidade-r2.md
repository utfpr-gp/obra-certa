REPROVADO

# Parecer de Conformidade — Tarefa 2 (rodada 2)

**Veredito:** APONTAMENTOS

**Teste não rodado.** O shell devolveu `permission.rejected` para `.\mvnw.cmd -B "-Dtest=NfeXmlParserTest" ...`. Não tenho resultado de execução. A análise abaixo é só de leitura do diff e do código.

## AJ1, AJ2, AJ3 e conformidade com os critérios

| Critério / apontamento | Situação | Onde |
| --- | --- | --- |
| AJ1: DOCTYPE classificado pela estrutura, entidade externa nunca resolvida | **atendido** | `NfeXmlParser.java:85-86` (`doc.getDoctype()`); configuração sem resolução em `:70-76`; teste `NfeXmlParserTest.java:82-91` assere `DOCTYPE` |
| AJ2: chave com exatamente 44 dígitos numéricos | **atendido** | `NfeXmlParser.java:120-121` (`matches("[0-9]{44}")`, match total); testes `NfeXmlParserTest.java:103-125` (43 dígitos, 45 dígitos, letra) |
| AJ3: cada ramo de recusa com teste de comportamento | **não atendido** (ver apontamentos 1 e 2) | ver tabela de ramos abaixo |
| CA1: fornecedor (razão social e CNPJ), data, chave, todos os itens com descrição, quantidade, unidade, unitário e total | **atendido** | `NfeXmlParser.java:36-62`; teste `NfeXmlParserTest.java:25-50` |
| CA2: XML corrompido ou não-NF-e recusado com motivo | **atendido**, com ressalva no DTD externo (apontamento 3) | `NfeXmlParser.java:89-92, 100, 105, 109`; testes `:52-64` |
| Decisão do autor: lê somente chave, `ide/dhEmi`, `emit/CNPJ`, `emit/xNome`, `det` nItem/xProd/uCom/qCom/vUnCom/vProd | **atendido** | `NfeXmlParser.java:36-62`, `:113-118`; nenhum outro campo lido |
| Decisão do autor: `NfeInvalidXmlException` e chave sem DV | **atendido** | `exception/NfeInvalidXmlException.java`; `NfeXmlParser.java:120` sem cálculo de DV |

**Ramos de recusa do `NfeXmlParser` (AJ3):**

| Ramo | Linha | Teste de comportamento |
| --- | --- | --- |
| SAXException → corrompido | `:89-90` | sim, `recusaXmlCorrompidoComMotivo` |
| IOException → corrompido | `:91-92` | **não** |
| DOCTYPE | `:85-86` | sim, dois testes |
| Raiz sem namespace NFe | `:100` | sim, `recusaRaizSemNamespaceDaNfe` |
| `default` do switch (namespace NFe, raiz que não é nfeProc/NFe) | `:105` | **não** |
| `nfeProc` sem `NFe` | `:109` | sim, `recusaNfeProcSemElementoNFe` |
| `NFe` sem `infNFe` | `:109` | **não** |
| Id sem prefixo `NFe` | `:117` | sim, `recusaInfNfeSemId` |
| Chave fora de 44 dígitos | `:121` | sim, três testes |
| `filho()` ausente (emit, ide, prod, xProd etc.) | `:133` | **não** (só `items.isEmpty` é testado, `:118`/`recusaNfeSemItens`) |
| `items.isEmpty()` | `:53` | sim, `recusaNfeSemItens` |
| NumberFormatException / DateTimeParseException | `:68` | sim, nItem, qCom, vUnCom, vProd e dhEmi |

## Apontamentos

1. **AJ3 não está resolvido: ramos de recusa sem teste de comportamento** — `NfeXmlParser.java:91-92, 105, 109, 133`
   Critério violado: AJ3 da rodada 1 ("cada ramo de recusa do parser deve ter teste de comportamento") e plano Tarefa 2 ("os demais devem falhar com a mensagem de motivo").
   Evidência: não há teste para o IOException (`:91-92`), para o `default` do switch (`:105`), para `NFe` sem `infNFe` (`:109`) nem para `filho()` ausente (`:133`). Para `filho()`, nenhum teste remove `emit`, `ide`, `prod` ou `xProd`.

2. **Teste do DTD externo não prova o motivo** — `NfeXmlParserTest.java:93-99`
   Critério violado: AJ3 e CA2 ("exibe alerta explicando o motivo da falha").
   Evidência: `dtdExternoEhRecusadoSemAcessoExterno` só assere `isInstanceOf(NfeInvalidXmlException.class)`. Um retorno "corrompido" também passaria. É asserção fraca.

3. **Recusa de DTD externo pode sair como "corrompido"** — `NfeXmlParser.java:70-76, 85-86, 89-90`
   Critério violado: contrato da decisão do autor (XXE/DOCTYPE falha "com a mensagem de motivo") e CA2 (o motivo tem que ser o real).
   Evidência: pela leitura do código, com `load-external-dtd=false` o Xerces não carrega o DTD externo e o `DocumentType` fica no DOM, então `:85-86` devolve `MSG_DOCTYPE`. Pelo mesmo raciocínio, o SAXException (`:89-90`) não deveria disparar nesse caminho. Nada disso foi executado, e o teste do apontamento 2 não fixa a mensagem. Logo, "corrompido" para DTD externo não está descartado, e se acontecer viola o contrato: CA2 é cumprido no sentido de haver recusa com alerta, mas a razão exibida seria falsa para um arquivo bem formado. Correção pedida: fazer o teste do apontamento 2 assertar `hasMessageContaining("DOCTYPE")`, rodar o teste e registrar o resultado.

## Sugestões (não bloqueiam)

- `plan.md` (Backend, linha sobre `NfePreviewResponseDTO`) exige `supplier.document` com 14 dígitos. O parser grava `emit/CNPJ` sem validar tamanho nem formato (`NfeXmlParser.java:57`). Vale validar aqui ou registrar a decisão.
- O ramo `IOException` (`:91-92`) é praticamente inalcançável com `ByteArrayInputStream`. Se o autor quiser mantê-lo, um teste com `byte[]` sabidamente inválido ajuda; se não, o `catch` pode ser removido com justificativa.
