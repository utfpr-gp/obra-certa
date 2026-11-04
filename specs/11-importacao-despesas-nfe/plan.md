# Plano — Issue #11

## Decisões técnicas

### Backend (`apps/api`)

- `POST /api/projects/{projectId}/nfe/preview` recebe multipart com a parte `file` (XML). Retorna 200 com `NfePreviewResponseDTO`: `projectId`, `accessKey`, `issueDate`, `supplier` (`name`, `document` com 14 dígitos), `items` (`itemNumber`, `description`, `quantity`, `unit`, `unitPrice`, `totalPrice`) e `total`. Erros no formato `ApiErrorResponse`: XML corrompido ou documento que não é NF-e → 400; obra inexistente, excluída ou alheia → 404; chave já ativa na obra → 409 com a mensagem "A nota fiscal já foi registrada". Preview não grava nada.
- `POST /api/projects/{projectId}/nfe/imports` recebe multipart com três partes: `file` (o mesmo XML), `items` (JSON `[{itemNumber, categoryId}]`) e `payment` (JSON `{mode: CASH | INSTALLMENT, dueDate}`; `dueDate` só em `INSTALLMENT`). O servidor reprocessa o XML: não confia nos itens que o cliente manda, só na escolha de categoria por `itemNumber`. Retorna 201 com a lista de `ExpenseResponseDTO`. Itens sem categoria, `categoryId` inexistente ou fora da lista do XML → 400. Chave duplicada → 409. Mesmos erros de obra do preview.
- Pagamento: `CASH` grava `pending_payments` com status `PAID` e `paid_at` igual à data de emissão. `INSTALLMENT` grava `PENDING` com `due_date`, validando `dueDate >= issueDate` (RN05) → 400 se violar. Ambos só na primeira linha (`nItem = 1`).
- Mapeamento de cada item para `expenses`: `project_id`, `category_id` escolhida, `supplier_id` da nota, `type = MATERIAL` (obrigatório e fixo para NF-e), `description` = `xProd`, `quantity` = `qCom`, `unit` = `uCom`, `unit_price` = `vUnCom`, `total_price` = `vProd`, `purchase_date` = data de emissão, `nfe_key` = chave do XML, `budget_id` resolvido como em `ExpenseService.create`.
- Parser de XML: DOM com namespace habilitado e entidades externas (DOCTYPE/XXE) desabilitadas. Chave lida do atributo `Id` de `infNFe` sem o prefixo `NFe`. Razão social de `emit/xNome`, CNPJ de `emit/CNPJ`. Itens de `det` com `nItem`. Data de `ide/dhEmi`. Raiz que não seja `nfeProc` ou `NFe` → 400.
- Fornecedor: busca por CNPJ entre os fornecedores do próprio usuário (`suppliers.user_id`). Se existir, atualiza `name` com a razão social da nota; se não, cria. Mesma transação das linhas.
- Comprovante: o XML é gravado no storage (`ReceiptStorage`) antes da transação do banco. A primeira linha recebe `receipt_state = UPLOADED`, `receipt_key`, tipo e tamanho (V9). Se a transação do banco falhar, o objeto enviado é apagado. Se o upload falhar, nada é gravado.
- Atomicidade e concorrência: uma transação grava todas as linhas, o fornecedor e o pagamento. A trava de chave é o índice único parcial da migration V11, então duas importações simultâneas da mesma nota fazem uma falhar com 409 e nada parcial fica gravado.
- Controladores magros: `NfeImportController`; regras em `NfeImportService`; leitura do XML em `NfeXmlParser`. Autorização reaproveita `UserContextHelper` e os repositórios que já filtram proprietário, obra e exclusões.

### Migração de schema

- `V11__unique_active_nfe_key_per_project.sql`: índice único parcial `idx_expenses_project_nfe_active` em `expenses (project_id, nfe_key)` com `WHERE deleted_at IS NULL AND nfe_key IS NOT NULL`. Conforme `docs/architecture.md`, seção de índices. Não editar V1–V10.
- Nenhuma outra mudança de schema: `nfe_key`, `receipt_*`, `pending_payments` e `suppliers.user_id` já existem.

### Frontend (`apps/web`)

- Entrada "Importar NF-e" na listagem de Contas e despesas da obra (`features/expenses/`). Diálogo de importação em `features/expenses/nfe-import/`, com três estados: escolha do arquivo, conferência (itens com seleção de categoria, pagamento e confirmação) e resultado.
- `core/services/nfe-import.service.ts` com `preview()` e `import()`, contratos em `core/models/nfe-import.model.ts`. Componentes não acessam `HttpClient`.
- Estado de conferência e envio em signals no próprio diálogo. Troca de obra fecha o diálogo e descarta respostas antigas (mesma regra de versão de contexto usada na US08). Confirmação bloqueia novos envios até terminar.
- Timeout HTTP de 30 segundos nas duas operações, sem retry automático. 401 segue para o interceptor existente.
- Valores monetários e datas exibidos com os formatadores pt-BR existentes.

## Tarefas

- [ ] **Tarefa 1 — Garantir uma só importação por chave na obra**
  - Cobre: CA3 (camada de dados) e CA11 (a chave continua bloqueada enquanto restar uma linha ativa).
  - Teste primeiro: integração PostgreSQL. Duas linhas ativas com a mesma chave na mesma obra violam o índice; a mesma chave em outra obra é aceita; linhas sem chave são aceitas; depois de excluir todas as linhas da nota, a chave volta a ser aceita; excluir só uma linha mantém a chave bloqueada. Falha antes do índice existir.
  - Migration: `V11__unique_active_nfe_key_per_project.sql`
  - Arquivos previstos: `apps/api/src/main/resources/db/migration/V11__unique_active_nfe_key_per_project.sql`; `apps/api/src/test/java/com/obracerta/repository/ExpenseNfeKeyIndexTest.java`; `apps/api/src/test/java/com/obracerta/service/ExpenseServiceDeleteNfeTest.java`.

- [ ] **Tarefa 2 — Ler XML de NF-e e recusar o que não é NF-e**
  - Cobre: CA1 (extração de chave, fornecedor, data e itens) e CA2 (XML corrompido ou de outro documento).
  - Teste primeiro: JUnit do `NfeXmlParser` com um XML de NF-e válido de exemplo com dois itens, um XML truncado, um XML de outro documento fiscal e um XML com DOCTYPE de entidade externa. O primeiro deve extrair todos os campos; os demais devem falhar com a mensagem de motivo. Falha antes do parser existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/service/NfeXmlParser.java`; `apps/api/src/main/java/com/obracerta/model/dto/nfe/NfePreviewResponseDTO.java`; `apps/api/src/test/resources/nfe/nfe-valida.xml`, `nfe-corrompida.xml`, `nfe-outro-documento.xml`, `nfe-xxe.xml`; `apps/api/src/test/java/com/obracerta/service/NfeXmlParserTest.java`.

- [ ] **Tarefa 3 — Pré-visualizar a nota na obra do proprietário**
  - Cobre: CA1 e CA2 na API, e CA3 como alerta antecipado de chave já registrada no preview; CA10 na leitura (404 para obra alheia ou excluída, sem gravar).
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
  - Teste primeiro: integração com storage falso. Pagamento `CASH` → `PAID` com `paid_at` na emissão; `INSTALLMENT` → `PENDING` com vencimento; vencimento anterior à emissão → 400 sem gravar (RN05). XML gravado como `UPLOADED` só na primeira linha. Falha do banco depois do upload → nada gravado e o objeto apagado. Falha do upload → nada gravado. Falha antes da lógica existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/service/NfeImportService.java`; `apps/api/src/test/java/com/obracerta/service/NfeImportServiceAtomicityTest.java`; `apps/api/src/test/java/com/obracerta/controller/NfeImportControllerPaymentTest.java`.

- [ ] **Tarefa 6 — Vincular fornecedor pelo CNPJ e refletir estouro no orçamento**
  - Cobre: CA6 (fornecedor existente atualizado pela razão social da nota; novo fornecedor criado quando o CNPJ não existe) e CA7 (estouro gravado e sinalizado no painel de orçamento).
  - Teste primeiro: integração para CNPJ existente com razão social diferente (atualiza, não duplica); CNPJ novo (cria); importação que ultrapassa o teto → 201 e `BudgetOverviewDTO` mostrando a categoria como estourada. Falha antes da lógica de fornecedor existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/service/NfeImportService.java`; `apps/api/src/test/java/com/obracerta/service/NfeImportSupplierTest.java`; `apps/api/src/test/java/com/obracerta/controller/NfeImportBudgetTest.java`.

- [ ] **Tarefa 7 — Impedir gravação duplicada em envios simultâneos**
  - Cobre: CA10 na camada de servidor (a segunda importação da mesma nota não grava nada) e CA8 em concorrência.
  - Teste primeiro: integração com PostgreSQL disparando duas confirmações concorrentes da mesma nota. Esperado: uma responde 201 e outra 409, com exatamente N linhas no banco. Falha antes da trava existir, se a verificação de duplicidade for só de leitura.
  - Migration: nenhuma (usa o índice da Tarefa 1).
  - Arquivos previstos: `apps/api/src/test/java/com/obracerta/controller/NfeImportConcurrencyTest.java`; ajuste em `apps/api/src/main/java/com/obracerta/service/NfeImportService.java` somente se o teste expuser corrida.

- [ ] **Tarefa 8 — Enviar XML e ver a conferência na tela**
  - Cobre: CA1 e CA2 na interface, e CA9 na tela (troca de obra com o diálogo aberto descarta a resposta antiga e fecha o diálogo).
  - Teste primeiro: specs do serviço HTTP e do diálogo para envio de arquivo, exibição de fornecedor, data, chave e itens, alerta de XML inválido com opção de cadastro manual, alerta de chave já registrada, timeout de 30 segundos, 401 propagado ao interceptor e resposta antiga após troca de obra. Falha antes do diálogo existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/core/services/nfe-import.service.ts`; `apps/web/src/app/core/services/nfe-import.service.spec.ts`; `apps/web/src/app/core/models/nfe-import.model.ts`; `apps/web/src/app/features/expenses/nfe-import/nfe-import-dialog.component.{ts,html,css,spec.ts}`; entrada no componente de listagem de despesas.

- [ ] **Tarefa 9 — Escolher categoria por item, pagamento e confirmar na tela**
  - Cobre: CA4 e CA5 na interface, e CA10 na tela (clique repetido não envia de novo; o envio fica bloqueado até terminar). Fechar o diálogo antes de confirmar não grava nada.
  - Teste primeiro: specs do diálogo para bloquear confirmação com item sem categoria (indicando quais), escolha de pagamento à vista ou a prazo com vencimento validado, envio único com clique repetido, bloqueio de fechamento durante o envio, fechar antes de confirmar sem chamada HTTP, e falha 409 mostrada sem sucesso aparente. Falha antes da conferência existir.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/features/expenses/nfe-import/nfe-import-dialog.component.{ts,html,spec.ts}`; `apps/web/src/app/core/services/nfe-import.service.ts`.

## Critérios sem tarefa

-
