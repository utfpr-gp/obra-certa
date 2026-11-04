# Plano — Issue #11

## Decisões técnicas

### Backend (`apps/api`)

- `POST /api/projects/{projectId}/nfe/preview` recebe multipart com a parte `file` (XML). Retorna 200 com `NfePreviewResponseDTO`: `projectId`, `accessKey`, `issueDate`, `supplier` (`name`, `document` com 14 dígitos), `items` (`itemNumber`, `description`, `quantity`, `unit`, `unitPrice`, `totalPrice`) e `total`. Erros no formato `ApiErrorResponse`: XML corrompido ou documento que não é NF-e → 400; obra inexistente, excluída ou alheia → 404; chave já ativa na obra → 409 com a mensagem "A nota fiscal já foi registrada". Preview não grava nada.
- `POST /api/projects/{projectId}/nfe/imports` recebe multipart com três partes: `file` (o mesmo XML), `items` (JSON `[{itemNumber, categoryId}]`) e `payment` (JSON `{paid: boolean}`, padrão `true`). O servidor reprocessa o XML: não confia nos itens que o cliente manda, só na escolha de categoria por `itemNumber`. Retorna 201 com a lista de `ExpenseResponseDTO`. Itens sem categoria, `categoryId` inexistente ou fora da lista do XML → 400. Chave duplicada → 409. Mesmos erros de obra do preview.
- Pagamento: `paid = true` grava `pending_payments` com status `PAID` e `paid_at` igual à data de emissão. `paid = false` grava `PENDING` com `due_date` igual à data de emissão (satisfaz RN05). Ambos só na primeira linha (`nItem = 1`).
- Mapeamento de cada item para `expenses`: `project_id`, `category_id` escolhida, `supplier_id` da nota, `type = MATERIAL` (obrigatório e fixo para NF-e), `description` = `xProd`, `quantity` = `qCom`, `unit` = `uCom`, `unit_price` = `vUnCom`, `total_price` = `vProd`, `purchase_date` = data de emissão, `nfe_key` = chave do XML, `budget_id` resolvido como em `ExpenseService.create`.
- Parser de XML, no pacote `integration/` por ser o adaptador do formato NF-e: DOM com namespace habilitado; entidades e DTD externos nunca resolvidos; DOCTYPE recusado após o parse pela estrutura do documento (`getDoctype()`), sem depender do texto de exceção. A remoção de `disallow-doctype-decl` é decisão registrada na rodada 2 da Tarefa 2: o risco de expansão de entidades internas é coberto por teste de entidades aninhadas. Chave lida do atributo `Id` de `infNFe` sem o prefixo `NFe`. Razão social de `emit/xNome`, CNPJ de `emit/CNPJ`. Itens de `det` com `nItem`. Data de `ide/dhEmi`. Raiz que não seja `nfeProc` ou `NFe` → 400.
- Trava de chave (`NfeKeyGuard`): antes de gravar, a transação trava a linha do projeto (`SELECT ... FOR UPDATE` em `projects`) e confere se existe linha ativa (`deleted_at IS NULL`) com a mesma `nfe_key` na obra. Se existir, lança exceção de domínio que a API converte em 409. Não há índice único em `expenses`: a regra vive na aplicação, sob bloqueio da obra.
- Fornecedor: busca por CNPJ entre os fornecedores do próprio usuário (`suppliers.user_id`). Se existir, atualiza `name` com a razão social da nota; se não, cria. Mesma transação das linhas.
- Comprovante: o XML é gravado no storage (`ReceiptStorage`) antes da transação do banco. A primeira linha recebe `receipt_state = UPLOADED`, `receipt_key`, tipo e tamanho (V9). Se a transação do banco falhar, o objeto enviado é apagado. Se o upload falhar, nada é gravado.
- Atomicidade e concorrência: uma transação grava todas as linhas, o fornecedor e o pagamento, depois de passar pela trava de chave. Duas importações simultâneas da mesma nota se serializam no bloqueio da obra: a segunda vê a primeira já gravada e recebe 409, sem nada parcial.
- Controladores magros: `NfeImportController`; regras em `NfeImportService`; leitura do XML em `NfeXmlParser`; trava em `NfeKeyGuard`. Autorização reaproveita `UserContextHelper` e os repositórios que já filtram proprietário, obra e exclusões.

### Migração de schema

- Nenhuma. A trava de chave é feita pela aplicação, sob bloqueio da obra (ver Decisões de backend). `nfe_key`, `receipt_*`, `pending_payments` e `suppliers.user_id` já existem.
- Observação: `docs/architecture.md` (seção de persistência, item "Índice Único Parcial para Chave de NF-e na Obra") descreve um índice que esta decisão não cria. A atualização do documento entra no Passo 4 (documentação) da história.

### Frontend (`apps/web`)

- Entrada "Importar NF-e" na listagem de Contas e despesas da obra (`features/expenses/`). Diálogo de importação em `features/expenses/nfe-import/`, com três estados: escolha do arquivo, conferência (itens com seleção de categoria, pagamento e confirmação) e resultado.
- `core/services/nfe-import.service.ts` com `preview()` e `import()`, contratos em `core/models/nfe-import.model.ts`. Componentes não acessam `HttpClient`.
- Estado de conferência e envio em signals no próprio diálogo. Troca de obra fecha o diálogo e descarta respostas antigas (mesma regra de versão de contexto usada na US08). Confirmação bloqueia novos envios até terminar.
- Timeout HTTP de 30 segundos nas duas operações, sem retry automático. 401 segue para o interceptor existente.
- Valores monetários e datas exibidos com os formatadores pt-BR existentes.

## Tarefas

- [x] **Tarefa 1 — Bloquear reimportação de chave com trava por obra**
  - Cobre: CA3 (chave já registrada na obra bloqueia a gravação, sem linha nova) e CA11 (a chave continua bloqueada enquanto restar uma linha ativa).
  - Teste primeiro: integração PostgreSQL do `NfeKeyGuard`. Com uma linha ativa de chave X na obra, a guarda recusa X; a mesma chave em outra obra é aceita; despesas sem chave não contam; depois de excluir todas as linhas da nota, X é aceita; excluir só uma linha pelo `ExpenseService.delete` mantém X bloqueada. Falha antes de `NfeKeyGuard` existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/service/NfeKeyGuard.java`; `apps/api/src/main/java/com/obracerta/exception/NfeAlreadyRegisteredException.java`; `apps/api/src/main/java/com/obracerta/repository/ProjectRepository.java` (consulta com bloqueio pessimista da obra); `apps/api/src/test/java/com/obracerta/service/NfeKeyGuardTest.java`; `apps/api/src/test/java/com/obracerta/service/ExpenseServiceDeleteNfeTest.java` (já existe em RED, deve ser reescrito para o novo contrato); remover `apps/api/src/test/java/com/obracerta/repository/ExpenseNfeKeyIndexTest.java` (RED do índice descartado).

- [x] **Tarefa 2 — Ler XML de NF-e e recusar o que não é NF-e**
  - Estado: base implementada e escalada na rodada 2 (pareceres em `reviews/tarefa-02-*-r2.md`). O fechamento acontece pela Tarefa 2A.
  - Cobre: CA1 (extração de chave, fornecedor, data e itens) e CA2 (XML corrompido ou de outro documento).
  - Teste primeiro: JUnit do `NfeXmlParser` com um XML de NF-e válido de exemplo com dois itens, um XML truncado, um XML de outro documento fiscal e um XML com DOCTYPE de entidade externa. O primeiro deve extrair todos os campos; os demais devem falhar com a mensagem de motivo. Falha antes do parser existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/service/NfeXmlParser.java`; `apps/api/src/main/java/com/obracerta/model/dto/nfe/NfePreviewResponseDTO.java`; `apps/api/src/test/resources/nfe/nfe-valida.xml`, `nfe-corrompida.xml`, `nfe-outro-documento.xml`, `nfe-xxe.xml`; `apps/api/src/test/java/com/obracerta/service/NfeXmlParserTest.java`.

- [x] **Tarefa 2A — Ajustes do parser de NF-e após a revisão da Tarefa 2**
  - Cobre: CA1 e CA2 (sem critério novo). Atende os apontamentos aceitos na rodada 2 da Tarefa 2: mover o parser para o pacote de integração, provar o motivo de cada ramo de recusa, provar o motivo do DTD externo, e cobrir a remoção de `disallow-doctype-decl` com teste de entidades aninhadas.
  - Teste primeiro: (1) testes de recusa para o `IOException` do parse, o `default` do switch de raiz, `NFe` sem `infNFe` e `filho()` ausente (`emit`, `ide`, `prod`, `xProd`), cada um verificando a palavra-chave da mensagem; (2) o teste de DTD externo passa a verificar `hasMessageContaining("DOCTYPE")`; (3) teste de entidades aninhadas (XML com DOCTYPE cujas entidades se expandem em cascata) que deve ser recusado com a mensagem de DOCTYPE. Se o limite de expansão do JDK interromper antes do `getDoctype()`, o teste não é afrouxado para aceitar outra mensagem: volta ao autor. Falha antes dos ajustes nos itens (2) e (3) quando a mensagem ainda não é provada.
  - Migration: nenhuma.
  - Arquivos previstos: mover `apps/api/src/main/java/com/obracerta/service/NfeXmlParser.java` para `apps/api/src/main/java/com/obracerta/integration/NfeXmlParser.java`; mover `apps/api/src/test/java/com/obracerta/service/NfeXmlParserTest.java` para `apps/api/src/test/java/com/obracerta/integration/NfeXmlParserTest.java`; nova fixture `apps/api/src/test/resources/nfe/nfe-entidades-aninhadas.xml`.
  - Dependências: Tarefa 2 (base escalada). Não altera o contrato de `NfePreviewResponseDTO` nem a lista de dados lidos.
  - Desvios registrados na execução: (a) o ramo `IOException` não é alcançável com `ByteArrayInputStream` (sondagem com UTF-8 inválido, UTF-16 declarado e BOM inconsistente: todos viram `SAXParseException`); o `catch` foi mantido e não há teste para ele. (b) Os testes (2) e (3) não falharam no RED, porque a mensagem de DOCTYPE já existia; são de caracterização. (c) O teste de entidades aninhadas prova a recusa por DOCTYPE, não o limite de expansão do JDK, que não é acionado pela fixture e não é testado nesta tarefa.

- [ ] **Tarefa 3 — Pré-visualizar a nota na obra do proprietário**
  - Cobre: CA1 e CA2 na API, e CA3 como alerta antecipado de chave já registrada no preview; CA9 na leitura (404 para obra alheia ou excluída, sem gravar).
  - Teste primeiro: teste de controlador para 200 com o payload de CA1, 400 para XML de CA2, 409 quando a chave já existe na obra, 404 para obra alheia e excluída, 401 sem token. Falha antes do controlador existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/controller/NfeImportController.java`; `apps/api/src/main/java/com/obracerta/service/NfeImportService.java`; `apps/api/src/test/java/com/obracerta/controller/NfeImportControllerPreviewTest.java`.

- [ ] **Tarefa 4 — Gravar uma linha por item com categoria escolhida**
  - Cobre: CA4 (itens sem categoria impedem a gravação) e a parte de CA5 que cria uma linha por item com categoria, `nfe_key`, data de emissão e fornecedor.
  - Teste primeiro: teste de integração para a confirmação com todas as categorias: N linhas com `type = MATERIAL`, `nfe_key`, `purchase_date`, `budget_id` e fornecedor corretos. Teste para item sem categoria, `categoryId` de outra lista e item fora do XML → 400 sem nenhuma linha. Falha antes do endpoint existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/controller/NfeImportController.java`; `apps/api/src/main/java/com/obracerta/service/NfeImportService.java`; `apps/api/src/main/java/com/obracerta/model/dto/nfe/NfeImportRequestDTO.java`; `apps/api/src/test/java/com/obracerta/controller/NfeImportControllerConfirmTest.java`.

- [ ] **Tarefa 5 — Gravar pagamento único e XML na primeira linha**
  - Cobre: CA5 na parte de pagamento (à vista ou a prazo, só na primeira linha) e de comprovante (XML na primeira linha), e CA8 (falha em qualquer etapa não deixa nada gravado).
  - Teste primeiro: integração com storage falso. `paid = true` → `PAID` com `paid_at` na emissão; `paid = false` → `PENDING` com `due_date` na emissão. XML gravado como `UPLOADED` só na primeira linha. Falha do banco depois do upload → nada gravado e o objeto apagado. Falha do upload → nada gravado. Falha antes da lógica existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/service/NfeImportService.java`; `apps/api/src/test/java/com/obracerta/service/NfeImportServiceAtomicityTest.java`; `apps/api/src/test/java/com/obracerta/controller/NfeImportControllerPaymentTest.java`.

- [ ] **Tarefa 6 — Vincular fornecedor pelo CNPJ e refletir estouro no orçamento**
  - Cobre: CA6 (fornecedor existente atualizado pela razão social da nota; novo fornecedor criado quando o CNPJ não existe) e CA7 (estouro gravado e sinalizado no painel de orçamento).
  - Teste primeiro: integração para CNPJ existente com razão social diferente (atualiza, não duplica); CNPJ novo (cria); importação que ultrapassa o teto → 201 e `BudgetOverviewDTO` mostrando a categoria como estourada. Falha antes da lógica de fornecedor existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/service/NfeImportService.java`; `apps/api/src/test/java/com/obracerta/service/NfeImportSupplierTest.java`; `apps/api/src/test/java/com/obracerta/controller/NfeImportBudgetTest.java`.

- [ ] **Tarefa 7 — Impedir gravação duplicada em envios simultâneos**
  - Cobre: CA10 na camada de servidor (a segunda importação da mesma nota não grava nada) e CA8 em concorrência.
  - Teste primeiro: integração com PostgreSQL disparando duas confirmações concorrentes da mesma nota. Esperado: uma responde 201 e outra 409, com exatamente N linhas no banco. Falha antes da trava de obra existir, quando as duas gravações podem passar pela checagem de leitura ao mesmo tempo.
  - Migration: nenhuma (usa a trava da Tarefa 1).
  - Arquivos previstos: `apps/api/src/test/java/com/obracerta/controller/NfeImportConcurrencyTest.java`; ajuste em `apps/api/src/main/java/com/obracerta/service/NfeImportService.java` somente se o teste expuser corrida.

- [ ] **Tarefa 8 — Enviar XML e ver a conferência na tela**
  - Cobre: CA1 e CA2 na interface, e CA9 na tela (troca de obra com o diálogo aberto descarta a resposta antiga e fecha o diálogo).
  - Teste primeiro: specs do serviço HTTP e do diálogo para envio de arquivo, exibição de fornecedor, data, chave e itens, alerta de XML inválido com opção de cadastro manual, alerta de chave já registrada, timeout de 30 segundos, 401 propagado ao interceptor e resposta antiga após troca de obra. Falha antes do diálogo existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/core/services/nfe-import.service.ts`; `apps/web/src/app/core/services/nfe-import.service.spec.ts`; `apps/web/src/app/core/models/nfe-import.model.ts`; `apps/web/src/app/features/expenses/nfe-import/nfe-import-dialog.component.{ts,html,css,spec.ts}`; entrada no componente de listagem de despesas.

- [ ] **Tarefa 9 — Escolher categoria por item, pagamento e confirmar na tela**
  - Cobre: CA4 e CA5 na interface, e CA10 na tela (clique repetido não envia de novo; o envio fica bloqueado até terminar). Fechar o diálogo antes de confirmar não grava nada.
  - Teste primeiro: specs do diálogo para bloquear confirmação com item sem categoria (indicando quais), checkbox "paga" marcado por padrão, e desmarcado gravando pendente com vencimento igual à emissão, envio único com clique repetido, bloqueio de fechamento durante o envio, fechar antes de confirmar sem chamada HTTP, e falha 409 mostrada sem sucesso aparente. Falha antes da conferência existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/features/expenses/nfe-import/nfe-import-dialog.component.{ts,html,spec.ts}`; `apps/web/src/app/core/services/nfe-import.service.ts`.

## Critérios sem tarefa

-
