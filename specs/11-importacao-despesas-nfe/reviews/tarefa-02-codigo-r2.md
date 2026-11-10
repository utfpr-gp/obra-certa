REPROVADO

# Parecer de Código — Tarefa 2 (rodada 2)

**Veredito:** APONTAMENTOS

**Limitação desta rodada:** o shell foi negado (`permission.rejected`), então não rodei `git diff --cached 146166f -- apps/api` nem `.\mvnw.cmd ... -Dtest=NfeXmlParserTest test`. A revisão foi feita lendo os arquivos do disco (`NfeXmlParser.java`, `NfeXmlParserTest.java`, `NfeInvalidXmlException.java`, `NfeKeyGuard.java`). Não confirmei que o conteúdo do disco é idêntico ao staged. **Testes não rodados.**

## Apontamentos aceitos da rodada 1

- **AJ1 (DOCTYPE pela estrutura): resolvido.** `NfeXmlParser.java:85` usa `doc.getDoctype()`, sem texto do SAX. Entidade externa não é resolvida: `external-general-entities` e `external-parameter-entities` estão desligados (linhas 78–79). O teste `entidadeExternaComDoctypeEhRecusadaSemSerResolvida` (`NfeXmlParserTest.java:82-90`) cobre o caso. Ele prova indiretamente a não resolução: se a entidade fosse lida, o `FileNotFoundException` cairia no `catch IOException` e a mensagem seria "corrompido", não "DOCTYPE".
- **AJ2 (chave de 44 dígitos): resolvido.** `NfeXmlParser.java:120` valida `[0-9]{44}`. Testes de 43, 45 e letra em `NfeXmlParserTest.java:102-124`, todos com `hasMessageContaining("44 dígitos")`. Não há duplicação: `NfeKeyGuard` só checa unicidade, e o único outro `44` no código é a coluna em `Expense.java:83`.
- **AJ3 (ramos de recusa): quase resolvido.** Há testes para nItem, qCom, vUnCom, vProd, dhEmi, lista vazia, Id ausente, raiz sem namespace e nfeProc sem NFe (linhas 126–204), todos com mensagem. O único que não prova a mensagem é o do DTD externo (ver B2).

## Apontamentos bloqueantes

1. **Parser fora do pacote declarado.** `NfeXmlParser.java:1` está em `com.obracerta.service`. A arquitetura declara `integration/ # Cliente de integração e parser de NF-e (XML / API)` (`docs/architecture.md`, §1, linha 67), e esse pacote já existe com `integration/ReceiptStorage.java` e `S3ReceiptStorage.java`. Prejuízo: quem procurar o parser em `integration/` não o encontra, e o futuro cliente de consulta SEFAZ (Fase 2, `architecture.md` linha 121) ficará separado do parser que ele usa. Ou se move a classe, ou se registra a decisão e se corrige o mapa na arquitetura.

2. **Teste do DTD externo não prova a mensagem.** `NfeXmlParserTest.java:92-100` só faz `isInstanceOf(NfeInvalidXmlException.class)`. Regra: teste de comportamento de recusa tem que provar o motivo (AJ3 e a regra de testes do despacho). Prejuízo: se o caminho regredir e a recusa vier como "corrompido" ou o parser tentar carregar o DTD, o teste continua verde. Esse é justamente o caso que mais precisa de prova, porque é o que abriria acesso externo. Falta `.hasMessageContaining("DOCTYPE")`.

3. **Remoção de `disallow-doctype-decl` sem decisão registrada.** `NfeXmlParser.java:74-87`. Antes, o DOCTYPE era recusado no início do parse. Agora `builder.parse` (linha 84) processa o subset interno inteiro, com declaração e expansão de entidades, e só depois `doc.getDoctype()` (linha 85) recusa. Não houve XXE: os quatro atributos de acesso externo (linhas 78–82) e o `FEATURE_SECURE_PROCESSING` (linha 77) continuam, e `entidadeExterna...` quebra se o flag de entidade externa for removido. O prejuízo concreto é a defesa em profundidade: um payload de entidades aninhadas (billion laughs) é expandido antes da recusa, limitado apenas pelo limite de expansão do JDK, que vem do FSP. Nenhum teste cobre a expansão nem a remoção desse limite. Pede uma das duas: reativar `disallow-doctype-decl` como primeira linha, com a mensagem de DOCTYPE tratada sem depender de texto do SAX, ou registrar a decisão e o motivo (na spec ou em comentário) e acrescentar um teste de entidades aninhadas que prove a recusa.

## Sugestões (não bloqueiam)

- `NfeXmlParser.java:8`: `import java.time.LocalDate;` não é usado no arquivo. Código morto que o compilador só avisa.
- `NfeXmlParser.java:89-92`: `catch SAXException` e `catch IOException` têm o mesmo corpo. Um multi-catch `SAXException | IOException` resolve.
- `NfeXmlParserTest.java:82`: o teste de entidade externa prova a não resolução só indiretamente. Um comentário explicando por que `DOCTYPE` (e não "corrompido") é a prova deixa isso explícito para quem ler depois.

## Observações fora do escopo deste diff

- Nenhuma identificada.
