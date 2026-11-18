APROVADO

# Parecer de Conformidade — Tarefa 3 (rodada 2)

**Veredito:** APROVADO

Não rodei os testes. A ferramenta de shell respondeu "Permission denied", então o `mvnw` não foi executado. A conferência foi feita por leitura do diff e do código.

## Critérios verificados

| Critério (da spec / plano) | Situação | Onde |
| --- | --- | --- |
| CA1 (API): preview 200 com fornecedor, data, chave e todos os itens | atendido | `NfeImportService.java:34-37`; `NfeXmlParser.java:60-66`; `NfeImportControllerPreviewTest.java:72-88` |
| CA2 (API): XML corrompido → 400 com motivo | atendido | `NfeXmlParser.java:89-92`, `:67-68`; `GlobalExceptionHandler.java` (handler `NfeInvalidXmlException` → 400); `NfeImportControllerPreviewTest.java:103-113` |
| CA2 (API): documento que não é NF-e → 400 com "não é NF-e" no HTTP | atendido | Fixture `nfe-outro-documento.xml` tem raiz `cteProc`, namespace CT-e; cai em `NfeXmlParser.java:99-101` com `MSG_NAO_NFE` ("...não é NF-e...", `:30`); asserção `NfeImportControllerPreviewTest.java:117` |
| CA3: chave ativa na obra → bloqueia, informa a nota já registrada, sem gravar | atendido | `NfeKeyGuard.java:26-28` (regra); `GlobalExceptionHandler.java` (409 com "A nota fiscal já foi registrada"); `NfeImportControllerPreviewTest.java:121-141` |
| CA9: obra alheia, inexistente ou excluída → 404 sem gravar e sem expor existência | atendido | `NfeImportService.java:28-29` (posse antes de tudo); mensagem genérica "Projeto não encontrado" (`ResourceNotFoundException.java:6`); testes `:143-175` |
| Ajuste: ordem posse-antes-do-parse, com teste | atendido | `NfeImportService.java:28-30` (`findByIdAndUserIdAndDeletedAtIsNull` antes de `parser.parse`); `preview404ParaObraAlheiaAntesDeLerOXml` (`NfeImportControllerPreviewTest.java:~158`) usa XML corrompido e espera 404, o que só passa se a posse for checada antes do parse |
| Ajuste: regra de chave em um único lugar | atendido | Regra de "já registrada" só em `NfeKeyGuard.java:26-28`. A consulta `countActiveExpensesByProjectIdAndNfeKey` tem um único chamador (a guarda). O preview não tem contagem própria. A validação de formato (44 dígitos) fica só no parser (`NfeXmlParser.java:114-123`) |
| Ajuste: preview não grava e não pega trava | atendido | `NfeImportService.preview` não é `@Transactional` e não chama `lockActiveById`. Só `NfeKeyGuard.ensureNotRegistered` (`:20-22`) usa a trava, e o preview não o chama. Testes `verifyNoInteractions(storage)` e `expenseCount` antes/depois em todos os casos |
| Desvio aceito: preview usa `ensureNotRegisteredWithoutLock`; o método com trava chama o de leitura após o bloqueio | coerente | `NfeKeyGuard.java:20-29`; mesma regra de CA3 nos dois caminhos; testes novos `NfeKeyGuardTest` (diff, linhas +105..+124) cobrem a leitura sem trava e a recusa |
| Tarefa 3 (lista de testes): 200, 400 CA2, 409, 404 alheia, 404 excluída, 401 | atendido, com ressalva no 401 | Testes presentes em `NfeImportControllerPreviewTest.java`; ver pendência do 401 abaixo |
| Pendência: 401 sem token | não reprovado, segue pendente | `preview401SemToken` afirma só o status 401 e corpo vazio (`content().string("")`). O plano pede corpo `ApiErrorResponse` ou mensagem. Continua como desvio pendente, conforme combinado |

## Apontamentos

Nenhum apontamento bloqueante.

## Sugestões (não bloqueiam)

1. O teste de "preview não pega trava" não é direto. Hoje a prova é indireta, pela ausência de `lockActiveById` no caminho. Se quiser fechar, dá para verificar em teste de integração que o preview não bloqueia outra transação que segura o `FOR UPDATE` da obra.
2. O 401 segue como desvio pendente. Quando for resolvido, alinhar o teste ao formato `ApiErrorResponse` ou à mensagem, como a nota de RED da Tarefa 3 pede.
