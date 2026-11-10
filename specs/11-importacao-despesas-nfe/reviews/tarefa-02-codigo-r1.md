REPROVADO

# Parecer de Código — Tarefa 2 (NfeXmlParser)

**Veredito:** APONTAMENTOS

**Limitação desta revisão:** o shell foi negado (`permission.rejected`), então não rodei `git diff --cached 146166f -- apps/api` nem o `.\mvnw.cmd ... -Dtest=NfeXmlParserTest`. Revisei os arquivos do diff lendo o disco (working tree), que deve coincidir com o índice, mas não consegui confirmar isso. Os testes não foram executados: não há registro de resultado.

## Apontamentos (bloqueiam)

1. **Recusa de DOCTYPE classificada pelo texto da mensagem do SAX.** — `apps/api/src/main/java/com/obracerta/service/NfeXmlParser.java:85-87`
   Regra violada: `architecture.md` §5.2.3, erros com motivo estruturado. A decisão de motivo depende de `e.getMessage().contains("DOCTYPE")`, string interna do Xerces que o JDK pode reescrever, traduzir ou alterar sem aviso.
   Prejuízo concreto: a recusa de segurança continua acontecendo (o `disallow-doctype-decl` lança antes de qualquer resolução), mas, numa troca de versão do JDK, um XML com DOCTYPE sai com a mensagem "corrompido". O motivo se perde e o teste `NfeXmlParserTest.java:63-67` quebra sem regressão de segurança. A alternativa robusta é classificar pela estrutura, não pela mensagem: permitir o parse com `ACCESS_EXTERNAL_*` vazios e `external-general-entities` falso, e após o parse fazer `if (doc.getDoctype() != null) throw new NfeInvalidXmlException(MSG_DOCTYPE)`. Nesse caso o DOCTYPE vira um dado verificável, não uma mensagem.

2. **Chave de acesso não validada como 44 dígitos.** — `NfeXmlParser.java:112-118`
   Regra violada: `architecture.md` §2 (consulta por "chave de 44 dígitos") e §3 (`expenses.nfe_key varchar(44)`).
   Prejuízo concreto: um `Id="NFe..."` com tamanho diferente de 44 ou com caracteres não numéricos passa como `accessKey` no preview. Na próxima tarefa, a gravação estoura a coluna `varchar(44)` ou contamina a consulta por chave duplicada (`NfeKeyGuard`). O parser é a fronteira onde a regra deve ser garantida.

3. **Caminhos de recusa sem teste de comportamento.** — `NfeXmlParserTest.java` (só 4 casos); `NfeXmlParser.java:43-49`, `:51-53`, `:66-67`, `:97-108`, `:115`
   Regra violada: `utf-rules.md` §4 (TDD na camada onde o comportamento vive) e `architecture.md` §9.2 (testes de serviço unitários).
   Prejuízo concreto: os ramos `NumberFormatException` (`nItem`, `qCom`, `vUnCom`, `vProd` inválidos), `DateTimeParseException` (`dhEmi` inválido), lista de itens vazia, `Id` ausente, raiz sem namespace e `nfeProc` sem `NFe` não têm nenhum teste. Qualquer um deles pode virar `catch` vazio ou mensagem trocada sem que a suíte perceba, e a recusa de XML inválido é justamente o escopo da tarefa.

## Sugestões (não bloqueiam)

- **Causa perdida na recusa:** `NfeXmlParser.java:88` descarta o `SAXException` original. Um construtor `NfeInvalidXmlException(String, Throwable)` preservaria a causa para log, sem mudar a resposta ao cliente.
- **Erro de I/O classificado como corrompido:** `NfeXmlParser.java:89-90` mapeia `IOException` de `ByteArrayInputStream` (que não ocorre na prática) para "corrompido". Trocar por `IllegalStateException`, como já é feito para `ParserConfigurationException`, deixa a falha de infraestrutura visível.
- **Configuração redundante:** `setExpandEntityReferences(false)` (`:75`) é redundante com o `disallow-doctype-decl` (`:77`). Manter o conjunto mínimo e documentar, em comentário, que a proteção XXE depende do `disallow`.
- **Asserção de mensagem:** os testes usam `hasMessageContaining` com fragmentos de texto (`:52`, `:59`, `:66`). Se o motivo virar um código ou enum, os testes passam a comparar o motivo, sem depender do texto livre.

## Observações fora do escopo deste diff

- `GlobalExceptionHandler` não mapeia `NfeInvalidXmlException` nem `NfeAlreadyRegisteredException`. Quando o parser for exposto por endpoint, o XML inválido sairá como 500 genérico, contra a regra de 400 de `architecture.md` §5.2.3. Candidato a item da próxima tarefa, antes do controller.
- Confirmado o que o diff faz de certo: a configuração bloqueia DTD externo e entidade externa (`:77-81`), `FEATURE_SECURE_PROCESSING` está ligado, `ParserConfigurationException` vira `IllegalStateException` (não é engolido), `DTO` é record, e o nome e o texto das mensagens seguem o padrão PT-BR do projeto. Não encontrei duplicação de regra NF-e fora de `NfeKeyGuard`, que cuida de outra responsabilidade.
