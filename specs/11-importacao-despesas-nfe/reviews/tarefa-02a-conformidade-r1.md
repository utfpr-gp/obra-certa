REPROVADO

# Parecer de Conformidade — Tarefa 2A

**Veredito:** APONTAMENTOS (reprovado pela linha acima só por falta de execução dos testes)

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — extração de chave, fornecedor, data e itens | atendido por leitura; **não executado** | `NfeXmlParser.java:35-66`; `NfeXmlParserTest.java:24-49` |
| CA2 — XML corrompido ou não-NF-e recusado com motivo | atendido por leitura; **não executado** | `NfeXmlParser.java:98-112, 130-136`; `NfeXmlParserTest.java:51-63, 190-273` |
| Plano 2A (1) — recusa para o `default` do switch | atendido por leitura; **não executado** | `NfeXmlParser.java:105`; teste em `NfeXmlParserTest.java:214-224` (raiz `outroDoc` com namespace correto, então chega ao `default`) |
| Plano 2A (1) — recusa para `NFe` sem `infNFe` | atendido por leitura; **não executado** | `NfeXmlParser.java:107-110`; teste em `NfeXmlParserTest.java:226-236` |
| Plano 2A (1) — recusa para `filho()` ausente (`emit`, `ide`, `prod`, `xProd`) | atendido por leitura; **não executado** | `NfeXmlParser.java:130-134`; testes em `NfeXmlParserTest.java:238-273` (cada um remove o fragmento com `semFragmento`, que afirma que o fragmento existe antes de remover) |
| Plano 2A (1) — recusa para `IOException` | **não atendido como escrito**; desvio da decisão do autor | `NfeXmlParser.java:91-92`; nenhum teste no diff |
| Plano 2A (2) — DTD externo verifica `DOCTYPE` | atendido por leitura; **não executado** | `NfeXmlParserTest.java:92-101`; `NfeXmlParser.java:85-87` |
| Plano 2A (3) — entidades aninhadas recusadas com `DOCTYPE` | atendido por leitura; **não executado** | `NfeXmlParserTest.java:103-108`; fixture `nfe-entidades-aninhadas.xml` |
| Plano 2A — classe mudou só na linha `package` | atendido | diff: `NfeXmlParser.java` com uma linha alterada (linha 1) |
| Plano 2A — nenhum campo extra lido | atendido | `NfeXmlParser.java:37-50, 63-64` lê só `Id`, `emit/CNPJ`, `emit/xNome`, `ide/dhEmi`, `det@nItem`, `prod/xProd|uCom|qCom|vUnCom|vProd`. `filho(emit)` e `filho(ide)` só checam existência |
| Plano 2A — pacote `integration/` e fixture nova | atendido | diff com rename 99% e 76%; `nfe-entidades-aninhadas.xml` criado em `src/test/resources/nfe/` |

## Apontamentos
1. **Testes não executados.** A chamada de shell para `.\mvnw.cmd -B "-Dtest=NfeXmlParserTest" "-Dspring.profiles.active=test" test` retornou `permission.rejected: shell`. Sem execução, nenhum critério acima conta como comprovado (método, passo 3). Para destravar, o autor roda o comando em `apps/api` e anexa a saída. Se ficar verde e nada mais mudar, o veredito passa a APROVADO.
   Critério violado: método do revisor, passo 3 ("Teste que não roda não conta como critério atendido").

2. **Teste de `IOException` ausente.** O plano (Tarefa 2A, item 1) pede um teste de recusa para o `IOException` do parse, e o diff não tem nenhum. A decisão do autor diz "não alcançável com `ByteArrayInputStream`, catch mantido e relatado", mas esse é um desvio do plano, e o `plan.md` não registra a decisão. Basta registrar o desvio no `plan.md`, ou escrever um teste com bytes UTF-8 inválidos, se o JDK lançar `IOException` nesse caso.
   Critério violado: plano 2A, item (1).
   Evidência: `NfeXmlParser.java:91-92` tem o `catch`, e a busca por `IOException` em `src/test` só encontra imports e assinaturas de `throws`.

## Ponto de atenção: RED e TDD
Para os itens (2) e (3), o teste não podia falhar antes, porque a mensagem `DOCTYPE` já vinha de `NfeXmlParser.java:85-87` desde a Tarefa 2. Nenhuma linha de produção mudou além do pacote. Nesse caso, os testes são de caracterização de comportamento já existente, e isso não viola TDD, desde que o código de produção não tenha sido mexido para fazê-los passar. Mesmo assim, o plano dizia "falha antes dos ajustes nos itens (2) e (3)", e essa premissa estava errada. Vale registrar no `plan.md` que a falha esperada não ocorreu e por quê.

## Sugestões
- Renomear `recusaEntidadesAninhadasComDoctypeMesmoComExpansaoEmCascata` (`NfeXmlParserTest.java:104`). Como `setExpandEntityReferences(false)` está ligado (`NfeXmlParser.java:76`), não há expansão em cascata: o teste passa pelo `getDoctype()`, e não pelo limite do JDK. O nome exagera o que o teste exercita.
- A fixture de entidades aninhadas (`nfe-entidades-aninhadas.xml`) cobre o caso do plano, mas o teste não prova que a expansão não aconteceria sem o `DOCTYPE`. Isso não é exigido pelo plano, então não bloqueia.
