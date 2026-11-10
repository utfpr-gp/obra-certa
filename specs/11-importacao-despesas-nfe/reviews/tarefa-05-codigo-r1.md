REPROVADO

# Parecer de Código — Tarefa 5

**Escopo avaliado:** `git diff --cached 7c9c4ce -- apps/api` (7 arquivos) e leitura dos consumidores do estado novo.
**Régua:** `docs/architecture.md` §5.2, §5.2.1, §6 (contratos US03/US04), §7.4 e §9; `utf-rules.md` §4 e §4.1.

## Apontamentos (bloqueiam)

1. **O XML gravado como comprovante não é consumível pelos caminhos de comprovante que já existem — o diff cria o estado sem fechar a integração.**
   - `NfeImportService.java:170-172` grava `receipt_state='UPLOADED'` + `receipt_content_type='application/xml'`; a `V11__allow_xml_nfe_receipt.sql:8` autoriza exatamente esse valor.
   - `ExpenseReceiptService.java:27` mantém `EXTENSIONS` só com JPEG/PNG/PDF; `:90` monta `"comprovante-"+id+"."+EXTENSIONS.get(contentType)` → para `application/xml` o sufixo vira literalmente `.null` (a API devolve `comprovante-<uuid>.null` via `ExpenseReceiptController.java:28`).
   - O cliente Angular ignora o nome do servidor e recalcula a extensão em `apps/web/src/app/features/expenses/expense-detail.component.ts:314`: `pdf → pdf`, `png → png`, **qualquer outro tipo → `jpg`**. Para a despesa importada, "Consultar comprovante" salva o XML da NF-e como **`comprovante.jpg`**.
   - O mesmo bloco de comprovante continua dizendo "Substituir comprovante (JPEG, PNG e PDF…)" (`expense-detail.component.ts:91`), e `ExpenseReceiptService.java:79` rejeita XML — ou seja, a tela oferece uma ação que devolve 400 para a despesa cujo comprovante é XML.
   - Regra violada: `architecture.md:512` (§6, contrato da US03) — `GET /api/expenses/{id}/receipt` deve devolver arquivo com **nome seguro**; e `specs/11-importacao-despesas-nfe/spec.md:21/37` promete o XML como comprovante consultável da primeira linha.
   - Prejuízo concreto: toda NF-e importada passa a ter um comprovante que baixa com nome/extensão incorretos (`.jpg` na tela, `.null` na API) e um botão de substituição que não aceita o próprio tipo gravado. Não é estilo: é comportamento errado no caminho já exposto ao usuário, e persiste depois da Tarefa 8 (a tela de despesa não está na lista de arquivos dela).
   - Se o autor entender que a correção pertence a outra tarefa/Issue de manutenção, é decisão de triagem — mas o estado já fica gravado a partir deste diff.

## Verificação do foco pedido

### Fronteira transacional — correta
- `confirm` deixou de ser `@Transactional` (`NfeImportService.java:93`); o bloco de gravação abre transação própria via `TransactionTemplate` em `REQUIRES_NEW` (`:76-77`, `:137`).
- `keyGuard.ensureNotRegistered` é chamado **dentro** de `persist` (`:152`), que roda dentro dessa transação. `NfeKeyGuard.java:19` usa `@Transactional` **sem propagation explícita**, portanto `REQUIRED`: ele **entra** na transação já aberta pelo template, não cria transação separada.
- Consequência efetiva: a trava `SELECT … FOR UPDATE` de `ProjectRepository.java:20-22` é adquirida na mesma conexão/sessão da gravação e só é liberada no commit/rollback do bloco — cobre fornecedor, linhas e pagamento. O cenário bloqueante que você descreveu (guarda em `REQUIRES_NEW` liberando a trava antes) **não ocorre**. O `REQUIRES_NEW` está no template, que é o dono da transação; a guarda é `REQUIRED`.
- Observação de desenho: como o upload é anterior à transação (decisão 8), o segundo import concorrente sobe o objeto, bloqueia na trava, e ao ver a chave já gravada recebe 409 e apaga o próprio objeto. O comportamento de concorrência continua coerente.

### Compensação — correta
- `storage.delete` só roda no `catch` em volta de `transactions.execute` (`:139-146`), portanto só depois de a transação falhar (rollback já ocorrido).
- A chave apagada é a mesma enviada (`key` de `:129`, usada em `:131` e `:141`); o teste prova `deletedKeys.containsExactly(putKeys.get(0))` (`NfeImportServiceAtomicityTest.java:125-127`).
- Falha do delete é capturada (`:141-144`) e o erro original é repropagado (`:145`); não há `catch` vazio nem sucesso falso.
- 409: a exceção nasce em `:152`, derruba a transação, cai no `catch`, apaga e sobe. `NfeImportControllerConfirmTest.java:215-234` afirma 409 + corpo e `verify(storage).delete(uploadedKey.getValue())`; `expenseCount` inalterado — sem metadado remanescente.

### Ordem — correta
- Posse (`:95-97`) → leitura do arquivo (`:98`) → parse (`:99`) → validações de item/categoria (`:101-125`) → upload (`:130-134`) → transação (`:136`). Os 400 de `:110`, `:114` e `:124` acontecem antes do upload, e os testes provam `verifyNoInteractions(storage)` (ConfirmTest `:167`, `:182`, `:197`, `:211`).

### Montagem — correta
- `firstItemNumber` (`:196-199`): usa 1 quando existe; senão a menor ordem. Aplicado em `:169`.
- `paid` do checkbox em todas as linhas (`:127`, `:168`).
- `PendingPayment` só na primeira linha (`:169-189`): `PAID` → `dueDate=null` e `paidAt=emissão 00:00 UTC` (`:174-180`); `PENDING` → `dueDate=emissão` e `paidAt=null` (`:181-188`). `receipt_*` só na primeira (`:170-173`); demais ficam `NONE`/nulos (`:168`).
- Demais campos (descrição, quantidade, unidade, valores, compra, chave, fornecedor, orçamento) preservados do fluxo anterior.

### Migration V11 — correta
- Próxima versão após `V10__add_payment_status_and_paid_at.sql`, nome e caminho corretos.
- `DROP` + `ADD` preserva todos os limites da V9 (`V9:7-12`): ausência de metadados em `NONE/PENDING`, completude em `UPLOADED`, `size > 0`, `size <= 10485760`; só acrescenta `application/xml`/`text/xml` (`V11:5-9`). Não há edição de migration já aplicada.

### DTO/controller — correto
- `payment` é opcional (`NfeImportRequestDTO.java:5,11-12`) e o default `true` fica no service (`:201-203`), não no controller.
- O controller só resolve a parte multipart opcional (`NfeImportController.java:32-35`); nenhuma regra de negócio, nenhum repository injetado.

### Testes — atendem ao pedido, com uma fragilidade
- Nenhum dos três é `@Transactional` (`NfeImportServiceAtomicityTest.java:47-49`, `NfeImportControllerPaymentTest.java:47-49`, `NfeImportControllerConfirmTest.java:46-48`).
- Atomicidade: trigger real em `expenses` (`:115-120`), depois do upload, prova rollback de linhas/pagamento/fornecedor (`:144-148`) e delete da mesma chave (`:125-127`).
- Pagamento: `PAID`/`paid_at=2026-10-15T00:00:00Z`/`due_date` nulo e `PENDING`/`due_date=2026-10-15`/`paid_at` nulo (`PaymentTest:108-112`, `:137-141`), com `paid` igual nas duas linhas.
- 400/409/503 afirmam status, `path` e `message` (`ConfirmTest:161-164`, `:224-226`; `PaymentTest:164-167`).

### Desvio de RED declarado
- Impacto baixo: o teste de falha do banco **não é vazio** — ele afirma `putKeys` com 1 item, `deletedKeys` idêntico e zero linhas/pagamentos/fornecedores; remover a compensação ou o rollback derruba o teste. O que ele **não** prova é a origem da exceção: `assertThatThrownBy(...).isInstanceOf(Exception.class)` (`:122`) passa com qualquer erro, inclusive um defeito do próprio arranjo. Os outros testes novos dão RED legítimo para o contrato novo (antes não havia `payment` nem `storage`; as asserções de `PAID`/`paid_at` e de `put`/`delete` falhariam).
- Não exige nova rodada só por isso, mas o desvio precisa ficar registrado no arquivo de decisões da tarefa e a asserção deve ser endurecida. Sem uma execução verde em ambiente limpo, não há como afirmar que o conjunto fecha.

## Sugestões (não bloqueiam)

1. **Compensação silenciosa:** `NfeImportService.java:142-144` ignora a falha do `delete` sem log. O erro principal é preservado (correto), mas o objeto órfão fica invisível para diagnóstico; um `log.warn` com a chave resolve.
2. **`receipt_size` vem de `file.getSize()` (`:137`, `:173`), não de `xml.length`.** Hoje coincidem; se um dia o multipart entregar tamanho divergente do conteúdo lido, o metadado passa a mentir sobre o objeto gravado.
3. **Chave do objeto usa o `projectId` do path (`:129`) em vez de `project.getId()`** já autorizado — use o id da entidade para o prefixo não divergir da identidade gravada.
4. **Cobertura faltando em ramos introduzidos:** fallback de `firstItemNumber` (nota sem `nItem=1`), normalização de `xmlContentType` (`text/xml`, nulo, tipo não-XML, `:205-209`) e falha do `storage.delete` na compensação.
5. **`assertThatThrownBy(...).isInstanceOf(Exception.class)` (`AtomicityTest:122`)** é frouxo; asserte a mensagem do trigger ou o status/corpo do erro, para o teste falhar pelo motivo certo.
6. **Cenário de falha de upload duplicado** entre `NfeImportControllerPaymentTest:158-173` e `NfeImportServiceAtomicityTest:94-111`. Um dos dois basta; o outro acrescenta tempo de suíte sem cobertura nova.
7. **Pacote do teste divergente do plano:** `plan.md` (lista de arquivos da tarefa) aponta `apps/api/src/test/java/com/obracerta/service/NfeImportServiceAtomicityTest.java`; o arquivo está em `.../controller/`. Alinhe nome/pacote (o teste dirige HTTP, então `controller` até se justifica — mas o plano precisa refletir).
8. **Controller monta o DTO efetivo (`:34`).** É composição de transporte, aceitável, mas o `payment != null ? payment : request.payment()` é uma decisão que poderia viver no service; se ficar, vale um comentário do porquê de duas origens para o mesmo dado.
9. **Import não usado:** `containsString` em `NfeImportControllerConfirmTest.java:40`.

## Observações fora do escopo deste diff

- **Não rodei os testes.** O harness bloqueou o shell para `mvnw` (`Permission denied: shell`), inclusive `.\mvnw.cmd -v`; não há `apps/api/target/surefire-reports` para usar como evidência secundária. O parecer é estático.
- **Falha do banco retorna 500 não estruturado.** Não existe `@ExceptionHandler` genérico em `GlobalExceptionHandler`; a `RuntimeException` propagada pela transação sai como erro padrão do Spring, não como `ApiErrorResponse` (§5.2.3). Comportamento anterior ao diff (o `@Transactional` antigo também deixava propagar), mas o teste de atomicidade agora depende dele.
- **Documentação:** `architecture.md:128` continua dizendo "schema versionado desta entrega (V1–V9)" e não há seção de persistência da importação descrevendo a V11 nem a divergência deliberada "só a primeira linha tem `PendingPayment`" (§3/US03 diz "despesa a prazo gera pagamento pendente na mesma transação"). As duas coisas são decisões do plano (`plan.md:88` e `:87`), mas o documento normativo ficou para trás.
- **`POST /imports` sem `Location`** (`NfeImportController.java:27-28`) — já registrado na revisão da 4A; segue candidato a manutenção.

## Execução do orquestrador

Rodei a suíte citada a partir de `apps/api` com PostgreSQL local (`obracerta_test`): 42 testes, 0 falhas, 0 erros, `BUILD SUCCESS` (`NfeImportControllerConfirmTest` 7, `NfeImportControllerPaymentTest` 4, `NfeImportControllerPreviewTest` 8, `NfeImportServiceAtomicityTest` 3, `ExpenseServiceTest` 12, `NfeKeyGuardTest` 8).
