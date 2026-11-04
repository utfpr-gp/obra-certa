# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO (condicionado à execução do `NfeXmlParserTest`, que não rodei)

**Primeira linha:** APROVADO. A conformidade foi verificada por leitura do diff e dos critérios. Os testes não foram executados: o shell foi negado (`permission.rejected: shell`). Nenhum critério foi dado como comprovado por execução.

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — extração de chave, fornecedor (razão social e CNPJ), data de emissão e todos os itens (descrição, qtd, unidade, vUnit, vTotal) | atendido (camada de parser; a tela é da Tarefa 8) | `NfeXmlParser.java` `parse` (itens em `for (det …)`); `NfeXmlParserTest.java` teste `extraiChaveFornecedorDataEItensDeUmaNfeValida`; `nfe-valida.xml` com 2 itens |
| CA2 — XML corrompido recusado com motivo | atendido (motivo na exceção; alerta e cadastro manual são da UI) | `NfeXmlParser.java` `lerDocumento` (`MSG_CORROMPIDO`); `NfeXmlParserTest.java` teste `recusaXmlCorrompidoComMotivo`; `nfe-corrompida.xml` (corta em `<uCom>SC`) |
| CA2 — documento que não é NF-e recusado com motivo | atendido | `NfeXmlParser.java` `localizarInfNFe` (`MSG_NAO_NFE`); `NfeXmlParserTest.java` teste `recusaXmlDeOutroDocumentoFiscalComMotivo`; `nfe-outro-documento.xml` (raiz `cteProc`/`CTe`) |
| CA2 — DOCTYPE de entidade externa recusado com motivo | atendido | `NfeXmlParser.java` `lerDocumento` (`disallow-doctype-decl` e `MSG_DOCTYPE`); `NfeXmlParserTest.java` teste `recusaXmlComDoctypeComMotivo`; `nfe-xxe.xml` |
| Decisão do autor: parser lê somente chave, ide/dhEmi, emit/CNPJ, emit/xNome e det/nItem, prod/xProd, uCom, qCom, vUnCom, vProd | atendido | `NfeXmlParser.java` `parse`, `chave`, `texto(…)` chamadas. Os únicos elementos lidos são os listados (`infNFe/@Id`, `emit`, `ide`, `det/@nItem`, `prod`). Nenhum outro campo é gravado no DTO |
| Desvio autorizado: `NfeInvalidXmlException` | atendido | `NfeInvalidXmlException.java` (classe nova, `RuntimeException`) |
| Chave sem validação de DV | atendido (não há validação) | `NfeXmlParser.java` `chave` |
| Plano, Tarefa 2: "Migration: nenhuma" | atendido | nenhum arquivo de migration no diff |

## Respostas às três atenções específicas

**(a) `total` no DTO é campo extraído ou derivado?** É derivado. `NfeXmlParser.java` em `parse` soma `vProd` de todos os itens (`reduce(BigDecimal.ZERO, BigDecimal::add)`) e não lê nenhum elemento `total` do XML. Não viola "somente os campos listados", porque nada é extraído fora da lista. O plano (`plan.md`, Decisões de backend) já prevê o campo `total` no payload. Veja a sugestão 1.

**(b) O parser extrai algo fora da lista?** Não. Os elementos lidos são exatamente os da decisão do autor. Não há leitura de `nNF`, `cUF`, `vNF`, impostos, transportadora ou pagamento, mesmo que existam nas fixtures.

**(c) A fixture válida e a classificação das recusas batem com os critérios?** Sim.
- `nfe-valida.xml` tem dois `det` com todos os campos. O teste confere chave, data (2026-10-15 a partir de `2026-10-15T10:30:00-03:00`), CNPJ, razão social, itens, totais e o total derivado (625,00).
- `nfe-corrompida.xml` é truncada, e o `SAXException` cai no ramo "corrompido".
- `nfe-outro-documento.xml` tem namespace `cte`, então o teste de namespace recusa como "não é NF-e" antes de procurar `infNFe`.
- `nfe-xxe.xml` tem DOCTYPE. A feature `disallow-doctype-decl` lança `SAXException` com a palavra "DOCTYPE", e o parser devolve `MSG_DOCTYPE`. O teste confere a mensagem, e a fixture é um teste real de XXE porque o `&xxe;` aparece em `xProd`.

## Apontamentos

**Bloqueantes:** nenhum critério de aceite desta tarefa está não atendido na leitura do código.

**Pendência de verificação (não é apontamento de código):**
1. Os testes não rodaram. O shell foi negado. Comando que deve ser executado a partir de `apps/api`:
   `.\mvnw.cmd -B "-Dtest=NfeXmlParserTest" "-Dspring.profiles.active=test" test`
   Este teste é JUnit puro, sem contexto Spring, então não depende do banco `obracerta_test`. Só vale como critério atendido depois que passar.

## Sugestões (não bloqueiam)

1. **`total` no DTO.** O valor é derivado da soma de `vProd`, e a spec não o pede para a conferência (CA1 pede o valor de cada item). O campo está no plano, então fica como está. Vale documentar no código ou no contrato que é derivado, para que ninguém o confunda com um campo do XML.
2. **Detecção de DOCTYPE por texto.** `lerDocumento` decide a mensagem por `e.getMessage().contains("DOCTYPE")`. Funciona com o Xerces atual, mas depende do texto da exceção. Uma checagem explícita antes do parse (ou comparar com a feature) tornaria isso robusto.
3. **`chave()` com `Id` sem prefixo `NFe`** devolve "corrompido". Não é errado, mas "não é NF-e" pode ser a classificação mais precisa, já que um `Id` sem o prefixo indica outro documento.
4. **`nfeProc` sem filho `NFe`** cai em "não é NF-e" (`localizarInfNFe`). Está coerente com o plano, só registrando.
