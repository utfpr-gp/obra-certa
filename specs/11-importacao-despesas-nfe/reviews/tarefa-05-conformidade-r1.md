APROVADO

# Parecer de Conformidade — Tarefa 5

> **Limites desta revisão:** o shell deste agente foi bloqueado (`permission.rejected` em todas as tentativas) e subagentes aninhados não estão disponíveis. Portanto **não rodei `git diff --cached 7c9c4ce` nem o comando Maven de testes**. A análise abaixo é feita sobre os arquivos da árvore de trabalho (que devem corresponder ao conteúdo em stage) e sobre os testes lidos estaticamente. Testes não executados — ver "Ressalvas".

## Critérios verificados

| Critério / decisão | Situação | Onde |
| --- | --- | --- |
| CA5 — pagamento único só na primeira linha, coerente com o checkbox | atendido | `NfeImportService.java:169-189`; `NfeImportControllerPaymentTest.java:96-156` |
| CA5 — `paid=false` grava `PENDING` com `due_date` = emissão | atendido | `NfeImportService.java:181-188`; teste `:129-147` |
| CA5 — `paid=true` grava `PAID`, `due_date` nulo, `paid_at = emissão 00:00Z` | atendido | `NfeImportService.java:174-180`; teste `:108-112` |
| CA5 — comprovante `UPLOADED` só na primeira; demais `NONE` e metadados nulos | atendido | `NfeImportService.java:168-173`; `NfeImportControllerPaymentTest.java:103-126`; `NfeImportControllerConfirmTest.java:112-126` |
| CA5 — XML enviado ao storage com a **mesma chave** gravada | atendido | `NfeImportService.java:128-134`; `NfeImportControllerPaymentTest.java:122-125`; `NfeImportControllerConfirmTest.java:128-132` |
| CA5 — linhas 2..N com o mesmo `paid` da nota e sem `PendingPayment` | atendido | `NfeImportService.java:161-190`; `NfeImportControllerPaymentTest.java:114-120, 143-146` (2 linhas, 1 pagamento) |
| Decisão 1 — V11 aceita `application/xml` e `text/xml`, demais limites iguais | atendido | `V11__allow_xml_nfe_receipt.sql:3-10` (idêntico à V9 + 2 tipos); normalização em `NfeImportService.java:205-209` |
| Decisão 2 — linhas 2..N recebem o mesmo `paid`, sem pagamento | atendido | `NfeImportService.java:168` |
| Decisão 3 — `due_date` nulo em PAID e emissão em PENDING | atendido | `NfeImportService.java:174-188` |
| Decisão 4 — `paid_at = issueDate.atStartOfDay(ZoneOffset.UTC).toInstant()` | atendido | `NfeImportService.java:179`; teste `:112` |
| Decisão 5 — parte `payment` opcional, ausente/nulo = `true` | atendido | `NfeImportController.java:32-34`; `NfeImportService.java:201-203`; teste `:150-156` |
| Decisão 6 — falha do `put` = 503 com a mensagem de indisponibilidade | atendido | `NfeImportService.java:130-134, 48`; handler `GlobalExceptionHandler.java:36-42`; testes `NfeImportControllerPaymentTest.java:159-173` e `NfeImportServiceAtomicityTest.java:95-111` |
| Decisão 7 — testes obsoletos da Tarefa 4 reescritos | atendido | nomes antigos ausentes (`grep` sem ocorrências); substituídos por `confirm201GravaUmaLinhaPorItemComCategoriaEscolhida` (`:86-133`) e `confirm201PagamentoUnicoNaPrimeiraLinhaPorPadrao` (`:135-153`) |
| Decisão 8 — ordem posse → parse → validação → upload → bloco transacional → delete compensatório (inclusive 409) | atendido | `NfeImportService.java:95-146` |
| CA8 — falha do upload não grava nada | atendido | teste `NfeImportServiceAtomicityTest.java:95-111` (0 linhas, 0 pagamentos, 0 fornecedores, `delete` nunca chamado) |
| CA8 — falha do banco depois do upload: rollback e delete da **mesma** chave | atendido (com ressalva, ver Sugestão 1) | `NfeImportService.java:136-146`; teste `NfeImportServiceAtomicityTest.java:114-128` (`deletedKeys == putKeys[0]`) |
| Trava de chave continua dentro do bloco transacional | atendido | `NfeImportService.java:149-152` (chamada dentro de `persist`, chamado pelo `TransactionTemplate` em `:137-138`) |
| Validação/categoria antes do upload (400 sem tocar o storage) | atendido | testes `NfeImportControllerConfirmTest.java:156-198` com `verifyNoInteractions(storage)` |
| 404 de posse antes de tudo | atendido | `NfeImportService.java:95-97`; teste `NfeImportControllerConfirmTest.java:201-212` |
| Não invadiu Tarefa 6 (razão social/estouro) | atendido | `ExpenseReferenceResolver.java:25-30` continua sem atualizar `name`; nenhuma lógica de teto em `NfeImportService` |
| Não invadiu Tarefa 7 (concorrência) | atendido | nenhuma mudança na trava; apenas reuso de `keyGuard.ensureNotRegistered` |
| Preview não mudou | atendido | `NfeImportService.java:82-89` inalterado; `NfeImportControllerPreviewTest.java:39-121` continua provando leitura pura e `verifyNoInteractions(storage)` |

## Apontamentos bloqueantes

Nenhum.

## Sugestões (não bloqueantes)

1. **O teste de falha do banco falha na primeira linha, então não exercita "linhas parciais"** — `apps/api/src/test/java/com/obracerta/controller/NfeImportServiceAtomicityTest.java:116-120`. O gatilho dispara para qualquer `INSERT` do projeto; a primeira gravação já falha, e não há linha anterior para o rollback desfazer. CA8 fala em "nem deixa linhas parciais": um gatilho condicionado ao **segundo** item (ex.: `NEW.description = 'Areia média lavada'`) provaria o rollback de uma linha já inserida.
2. **Asserção fraca no mesmo teste** — `NfeImportServiceAtomicityTest.java:122`: `isInstanceOf(Exception.class)` aceitaria qualquer falha (inclusive 400/404 mascarado). O restante do teste (`putKeys` com 1 elemento, `deletedKeys` igual à chave) compensa em parte, mas vale afirmar a exceção de causa (`DataAccessException`/mensagem do gatilho).
3. **O conteúdo enviado ao storage não é verificado** — `NfeImportControllerPaymentTest.java:87-92` captura apenas chave, tamanho e tipo. Chave/tipo/tamanho coincidirem não provam que os bytes são o XML da nota; capturar o `InputStream` e comparar com o arquivo fecharia "XML efetivamente enviado".
4. **Arquivo fora do caminho previsto no plano** — o plano lista `apps/api/src/test/java/com/obracerta/service/NfeImportServiceAtomicityTest.java`; o arquivo está em `.../controller/` (`NfeImportServiceAtomicityTest.java:1`). Não afeta o critério, mas diverge dos "arquivos previstos".

## Ressalvas

- **Diff não lido:** sem shell, não consegui rodar `git diff --cached 7c9c4ce -- apps/api`; portanto não posso confirmar que nenhum arquivo fora dos 7 listados foi tocado, nem que o preview está byte a byte inalterado — apenas que sua lógica e seus testes continuam com o mesmo contrato.
- **Testes não executados:** o comando `.\\mvnw.cmd -B "-Dtest=...NfeImportControllerPaymentTest,NfeImportServiceAtomicityTest,NfeImportControllerConfirmTest,NfeImportControllerPreviewTest,NfeKeyGuardTest,ExpenseServiceTest" ... test` **não rodou** (shell bloqueado). O parecer assume que a suíte está verde; se algum teste falhar na execução real, ele deve ser reaberto.

## Execução do orquestrador

Rodei a suíte citada a partir de `apps/api` com PostgreSQL local (`obracerta_test`): 42 testes, 0 falhas, 0 erros, `BUILD SUCCESS` (`NfeImportControllerConfirmTest` 7, `NfeImportControllerPaymentTest` 4, `NfeImportControllerPreviewTest` 8, `NfeImportServiceAtomicityTest` 3, `ExpenseServiceTest` 12, `NfeKeyGuardTest` 8).
