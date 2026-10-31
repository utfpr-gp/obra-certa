# Plano — Issue #6

## Decisões técnicas

Este plano implementa a spec aprovada da US04 em sete tarefas. A consulta individual existente é a entrada; a listagem da US05 e a evolução de fornecedores da US15 permanecem fora do escopo. Cada tarefa funcional atravessa API e tela e começa pelos testes.

Plano aprovado pelo autor em 31/10/2026, com a condição de revisar antes de iniciar cada tarefa. Essa revisão prévia confere os critérios cobertos, o código existente, os arquivos previstos, as dependências e os riscos; apresenta o que será alterado e o que os testes devem provar antes de despachar a implementação. Não substitui o tutor antes do código nem as duas revisões independentes posteriores previstas em `utf-task`. Mudanças de escopo ou dúvidas encontradas voltam ao autor antes de qualquer implementação.

Revisão de escopo determinada pelo autor: remover da Tarefa 4 todo o mecanismo de recuperação de arquivos antes previsto na Tarefa 3. Não transferir essa infraestrutura para outra tarefa. A remoção isolada da Tarefa 3 permanece como implementada; substituição e exclusão da despesa fazem uma tentativa imediata de apagar o arquivo e informam falhas, sem registrar trabalho ou garantir recuperação posterior. Tarefas 1 a 3 concluídas permanecem inalteradas.

### Backend (`apps/api`)

- `PUT /api/expenses/{id}` → `200 ExpenseResponseDTO`: atualiza a despesa ativa do usuário autenticado. `ExpenseUpdateDTO` contém descrição, data, categoria e os campos de valor direto/calculado; na Tarefa 2 recebe também situação de pagamento e vencimento. Não recebe alteração de obra, fornecedor ou comprovante. Se um cliente enviar um identificador de obra extra, ele nunca altera a obra persistida. Todos os vínculos continuam conforme a US03 atual.
- Reutilizar o cálculo com `BigDecimal` e limites da criação. Alterar categoria ajusta o vínculo opcional ao orçamento da categoria de destino; despesa sem teto continua permitida. Os gastos são agregados de despesas ativas, sem manter contadores monetários paralelos ou modificar tetos. A atualização retorna a mesma despesa e a tela consulta o orçamento após o sucesso para apresentar o alerta.
- `ExpenseResponseDTO` recebeu `paidAt` nullable na Tarefa 2. A Tarefa 4 acrescenta somente o resultado imediato `receiptDeletionFailed`, com espelho no Angular e mapeamento centralizado em `ExpenseMapper`: verdadeiro quando a troca foi salva, mas uma tentativa de apagar arquivo falhou. O campo não é persistido, não representa trabalho pendente e é falso em consultas posteriores; a aplicação não acompanha recuperação futura. A Tarefa 3 mantém seu contrato. Campos novos não removem os contratos da US03.
- `PendingPayment` mantém a relação um para um. Acrescentar `PaymentStatus` (`PENDING`, `PAID`) e `paidAt` (`Instant`, nullable). Pendente → paga atualiza a mesma linha, status e data; paga → pendente reutiliza a linha, atualiza vencimento e limpa `paidAt`, que representa a quitação atual. Não criar histórico separado de ciclos nem remover o pagamento ao quitar. Criar uma linha somente quando ainda não houver pagamento. Na criação de despesa a prazo, inicializar `PENDING`; despesa criada já paga sem compromisso prévio pode continuar sem linha de pagamento. Usar o `Clock` existente para datas e instantes.
- `DELETE /api/expenses/{id}/receipt` → `200 ExpenseResponseDTO`: autoriza a despesa, solicita a exclusão física e, após confirmação, limpa chave, MIME e tamanho, define `NONE` e persiste. Objeto já ausente é sucesso. Falha do armazenamento mantém o vínculo e retorna erro para tentativa manual, sem fila ou agendamento. Se a exclusão física concluir e apenas o banco falhar, retornar erro sem anunciar sucesso; a repetição manual reconhece o objeto ausente e conclui a retirada dos metadados. Não prometer que rollback do banco recupera o arquivo. Sem anexo confirmado, devolver o estado atual sem acessar storage nem criar trabalho.
- `PUT /api/expenses/{id}/receipt`: estender o endpoint multipart existente para substituir também um anexo `UPLOADED`. Validar antes de qualquer mudança. Usar chave privada diferente da atual, sem sobrescrever o confirmado. Confirmar o envio e persistir a nova associação; somente após o commit tentar apagar o antigo. Falha no envio ou na associação preserva o antigo. Se a associação falhar após envio, tentar apagar o novo sem vínculo uma vez; erro deve informar que a troca não foi concluída e, quando aplicável, que o arquivo novo não pôde ser apagado. Se apenas apagar o antigo falhar após commit, retornar a despesa nova com `receiptDeletionFailed=true`; não desfazer a troca nem prometer repetição posterior.
- `DELETE /api/expenses/{id}` → `200 ExpenseDeleteResponseDTO` com `id`, `deleted` e `receiptDeletionFailed`. A transação grava `deleted_at` na despesa e no pagamento existente, preservando as linhas. Depois do commit, tentar apagar o comprovante uma vez. A resposta distingue exclusão financeira concluída e falha ao apagar arquivo, sem criar pendência. Nenhum erro do armazenamento desfaz uma exclusão financeira confirmada. Repetir a chamada a uma despesa já excluída devolve `404 Despesa não encontrada`; o cliente consulta o resultado após resposta perdida, sem reenvio automático.
- Toda operação resolve primeiro despesa ativa e obra ativa pelo proprietário, usando a consulta de posse existente; não acessar armazenamento antes dessa autorização. Identificadores alheios/inexistentes/excluídos retornam 404 no formato atual. Segurança mantém autenticação obrigatória e o interceptor existente trata 401. Nenhuma rota pública nova.
- A extensão de `ReceiptStorage` inclui exclusão física por chave. `S3ReceiptStorage` usa a operação de exclusão de objeto, tratando arquivo já ausente como limpeza concluída. Não simular exclusão lógica de arquivos nem manter versões no produto.

### Exclusão imediata dos arquivos

- Não criar tabela, entidade, repositório, serviço ou processador de trabalhos de limpeza, nem agendamento, configuração de intervalo ou campo de pendência. Não adiar esse mecanismo para a Tarefa 5 ou outra tarefa desta história.
- Substituição e exclusão da despesa tentam apagar somente a chave antiga após confirmar a mudança no banco. Preservar a chave atual em uso. Separar o limite transacional da chamada ao storage sem depender de autochamada `@Transactional`; um colaborador de persistência ou `TransactionTemplate` pode delimitar o commit, sem introduzir infraestrutura de trabalhos.
- `receiptDeletionFailed` comunica apenas o resultado da tentativa feita naquela requisição, sem persistência nem busca de pendências. A tela pode informar “Novo comprovante salvo, mas não foi possível apagar o anterior” ou “Despesa excluída, mas não foi possível apagar o comprovante”. Não oferecer o arquivo antigo nem anunciar exclusão física antes da confirmação.
- Uma falha pode deixar objeto no storage sem referência acessível pela aplicação. Não prometer retomada após reinício, histórico de versões ou remoção futura. A remoção isolada mantém a repetição manual do CA4.

### Migração de schema

- Última migration conferida após a Tarefa 2: V10. Confirmar novamente antes de implementar; as versões abaixo são reservadas nesta sequência local, não autorizam editar migrations aplicadas.
- Tarefa 2: `V10__add_payment_status_and_paid_at.sql`. Acrescentar status e data de quitação, preservando a unicidade por despesa e os dados existentes. Inicializar status pela situação persistida de `expenses.paid`. Não inventar data de quitação para registros legados que não a possuem; permitir `paidAt` nulo nesse legado. Validar coerência dos novos registros na aplicação.
- Tarefa 3: nenhuma migration, tabela ou agendamento. Manter a constraint da V9 limpando os metadados juntos ao passar para NONE.
- Tarefas 4 a 7 não preveem migration. A V11 antes reservada para trabalhos de limpeza não será criada. Manter `ddl-auto=validate` em todos os perfis e não modificar migrations aplicadas.

### Frontend (`apps/web`)

- Adicionar “Editar” e “Excluir” à consulta individual existente. A edição abre um modal próprio `expense-edit-modal`, preenchido a partir de `ExpenseResponse`, com `ReactiveFormsModule`; descrição, data, categoria, modo de valor e campos monetários seguem as validações da US03. A situação financeira e o vencimento entram na Tarefa 2. Não exibir controle editável de obra ou fornecedor.
- `ExpenseService` concentra as operações HTTP; componentes não injetam `HttpClient`. Modelos de atualização e exclusão ficam em `expense-registration.model.ts`. A resposta salva atualiza a consulta e recarrega o orçamento da mesma obra; falha nessa leitura complementar não transforma uma edição confirmada em falha de gravação.
- Remoção e substituição de anexo usam a consulta individual, seleção de arquivo e progresso existentes, estendidos na respectiva tarefa. Na remoção isolada, “Sem comprovante” aparece apenas após resposta confirmada; erro mantém o estado da tela e oferece repetição manual. Na substituição, exibir o novo confirmado e um aviso se a tentativa de apagar o antigo falhou; não oferecer o antigo nem prometer limpeza posterior.
- Exclusão reutiliza `ConfirmModalComponent`, com nome/descrição da despesa e `saving` durante o envio. Após sucesso, retirar a despesa da tela e mostrar confirmação com retorno a `/contas`; não depender de listagem ainda ausente nem deixar dados antigos visíveis como ativos.
- Modal de edição e confirmação ignoram clique no backdrop. Cancelar, X e Escape antes do envio fecham sem gravação. Durante a requisição, confirmação não pode ser repetida; fechar ou trocar obra não significa cancelar uma operação já recebida pelo servidor.
- Signals locais para carregamento, envio, mensagens e rascunho. Toda callback verifica a versão de contexto do `ActiveProjectService`; uma troca A → B → A não aceita respostas do primeiro A. Atualização de metadados da mesma obra não deve descartar o rascunho sem troca real de contexto.
- Sem obra selecionada, orientar a seleção e não iniciar edição/exclusão. Em 401, manter logout e redirecionamento a `/login`, sem modal de autenticação, restauração de intenção, retorno automático ou reenvio.
- Usar `data-testid`, rótulos acessíveis e mensagens junto aos campos. Em erro de rede/5xx, manter campos enquanto contexto e modal forem os mesmos, indicar resultado não confirmado e oferecer consulta do estado antes de nova tentativa.

## Tarefas

- [x] **Tarefa 1 — Editar os dados da despesa e recalcular o consumo**
  - Cobre: CA1 e CA2; validações e isolamento do caminho de edição do CA9. CA9 completo será consolidado na Tarefa 7.
  - Teste primeiro:
    - JUnit: `ExpenseUpdateIntegrationTest` prova atualização da mesma linha, campos diretos/calculados, mudança de categoria, ajuste dos agregados anterior/destino, preservação do teto e do fornecedor, rejeição de valores inválidos e tentativa de mudar obra sem efeito. Exercitar despesa/obra alheia e excluída com 404, sem escrita; quando pendente, validar data de compra contra vencimento já existente.
    - Angular: `expense-edit.spec.ts` prova abertura preenchida, obra travada, validações, envio via serviço e atualização da consulta, além do alerta após atingir 100% do teto e da falha isolada ao recarregar orçamento. Antes da tarefa, faltam modal e endpoint de edição.
  - Migration: nenhuma.
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/model/dto/expense/ExpenseUpdateDTO.java`
    - `apps/api/src/main/java/com/obracerta/controller/ExpenseController.java`
    - `apps/api/src/main/java/com/obracerta/service/ExpenseService.java`
    - `apps/api/src/test/java/com/obracerta/controller/ExpenseUpdateIntegrationTest.java`
    - `apps/web/src/app/core/models/expense-registration.model.ts`
    - `apps/web/src/app/core/services/expense.service.ts`
    - `apps/web/src/app/features/expenses/expense-detail.component.ts`
    - `apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.{ts,html,spec.ts}`
    - `apps/web/src/app/features/expenses/expense-edit.spec.ts`

- [x] **Tarefa 2 — Alternar entre pagamento quitado e futuro**
  - Cobre: CA3; validação temporal do CA9.
  - Teste primeiro:
    - JUnit/PostgreSQL: `ExpensePaymentUpdateIntegrationTest` prova paga → pendente com criação somente se necessário, vencimento obrigatório, igualdade de datas permitida, pendente → paga com `Clock` fixo e ciclos repetidos preservando o mesmo identificador de pagamento. Reabertura limpa a quitação atual; quitação não remove a linha; falha desfaz a edição inteira. `PaymentSchemaMigrationTest` prova backfill sem inventar data de quitação e Hibernate validate.
    - Angular: `expense-edit.spec.ts` prova campos preenchidos, exigência de vencimento, alternância de situação e apresentação do resultado salvo. Antes da tarefa, o PUT não altera pagamento e faltam status/data no modelo.
  - Migration: `V10__add_payment_status_and_paid_at.sql`.
  - Arquivos previstos:
    - Migration acima em `apps/api/src/main/resources/db/migration/`.
    - `apps/api/src/main/java/com/obracerta/enums/PaymentStatus.java`
    - `apps/api/src/main/java/com/obracerta/model/entity/PendingPayment.java`
    - DTOs `ExpenseUpdateDTO` e `ExpenseResponseDTO`, `ExpenseMapper` e `ExpenseService` nos pacotes existentes.
    - `apps/api/src/test/java/com/obracerta/migration/PaymentSchemaMigrationTest.java`
    - `apps/api/src/test/java/com/obracerta/controller/ExpensePaymentUpdateIntegrationTest.java`
    - Modelos Angular, consulta individual, modal e testes de edição da Tarefa 1.

- [x] **Tarefa 3 — Remover comprovante com tentativa manual em caso de falha**
  - Cobre: CA4; proteção de acesso ao anexo do CA9.
  - Teste primeiro:
    - JUnit: `S3ReceiptStorageTest` prova chamada de exclusão física, objeto ausente como sucesso e falhas reais propagadas sem falso sucesso.
    - Integração PostgreSQL: `ExpenseReceiptRemovalIntegrationTest` prova autorização antes do storage, exclusão física antes de limpar os metadados, estado NONE somente após sucesso persistido e preservação dos dados financeiros. Falha no storage mantém o vínculo e permite repetição manual. Falha do banco após exclusão física retorna erro; nova tentativa aceita o objeto ausente e conclui a retirada do vínculo. Provar 404 sem storage para despesa alheia/inexistente/excluída ou obra excluída e ausência de chamada ao storage quando já não há anexo confirmado. Não exigir a garantia antiga de arquivo intacto após rollback do banco.
    - Angular: `expense-receipt-edit.spec.ts` prova ação de remover, envio único enquanto em andamento, “Sem comprovante” após sucesso e erro sem anúncio de remoção, mantendo possibilidade de nova tentativa manual. Despesa, pagamentos e valores permanecem. Antes da tarefa, não existe DELETE de anexo nem operação de apagar no storage.
  - Migration: nenhuma.
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/service/ExpenseReceiptService.java`
    - `apps/api/src/main/java/com/obracerta/controller/ExpenseReceiptController.java`
    - `apps/api/src/main/java/com/obracerta/integration/ReceiptStorage.java`
    - `apps/api/src/main/java/com/obracerta/integration/S3ReceiptStorage.java`
    - `apps/api/src/test/java/com/obracerta/integration/S3ReceiptStorageTest.java`
    - `apps/api/src/test/java/com/obracerta/controller/ExpenseReceiptRemovalIntegrationTest.java`
    - `apps/web/src/app/core/services/expense.service.ts`
    - `apps/web/src/app/features/expenses/expense-detail.component.ts`
    - `apps/web/src/app/features/expenses/expense-receipt-edit.spec.ts`
  - Não criar entidade, repositório, serviço, tabela, scheduler ou campo de resposta de limpeza pendente nesta tarefa. Não modificar as migrations existentes.

- [x] **Tarefa 4 — Substituir comprovante preservando o atual até a confirmação**
  - Cobre: CA5; validações de arquivo e isolamento do CA9.
  - Teste primeiro:
    - JUnit: `ExpenseReceiptReplacementIntegrationTest` prova chave nova, envio confirmado antes da associação, commit antes de apagar o antigo e uma única tentativa de exclusão. Arquivo inválido ou falha no envio conserva o atual. Falha na persistência conserva o antigo e provoca uma tentativa imediata de apagar o novo sem vínculo; se ela falhar, informar sem prometer recuperação. Falha ao apagar o antigo mantém o novo confirmado e retorna `receiptDeletionFailed=true`. Exercitar sequência de substituições sem apagar o atual. Cobrir MIME, extensão, vazio, limite de 10 MiB e 404 antes do storage. Não testar fila, persistência de trabalhos ou retomada agendada.
    - Angular: `expense-receipt-edit.spec.ts` prova seleção, progresso, consulta do novo confirmado, preservação do antigo em falha de envio e aviso de falha ao apagar o anterior, sem oferecer versão antiga nem prometer repetição automática.
  - Migration: nenhuma.
  - Arquivos previstos: `ExpenseReceiptService` e, somente se necessário para delimitar o commit, colaborador transacional de persistência; `ExpenseResponseDTO` e `ExpenseMapper`; `ExpenseReceiptReplacementIntegrationTest` e testes existentes de upload da US03; serviço e modelos Angular, consulta individual e `expense-receipt-edit.spec.ts`. Preservar os demais contratos da US03 e a remoção isolada simples da Tarefa 3. Nenhuma tabela, entidade de trabalho, repositório de limpeza, processador, scheduler, migration ou configuração de intervalo será criada.

- [x] **Tarefa 5 — Excluir logicamente a despesa mediante confirmação**
  - Cobre: CA6; cancelamento e duplo envio da exclusão do CA7; isolamento da exclusão do CA9.
  - Teste primeiro:
    - JUnit/PostgreSQL: `ExpenseDeletionIntegrationTest` prova linhas preservadas com `deleted_at`, pagamento inativado, gasto removido dos agregados, teto intacto e tentativa de remoção física posterior ao commit. Simular falha do storage com exclusão financeira concluída e `receiptDeletionFailed=true`, sem trabalho durável; falha ao gravar no banco não pode apagar o comprovante. Provar 404 em repetição e em recurso alheio/excluído, inclusive leitura/edição/download/upload após a exclusão.
    - Angular: `expense-delete.spec.ts` prova diálogo, confirmação única, cancelamento por botão/X/Escape sem requisição, backdrop inerte, retirada dos dados da consulta após sucesso e aviso de falha ao apagar o arquivo com retorno a Contas a Pagar, sem promessa de limpeza futura.
  - Migration: nenhuma.
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/model/dto/expense/ExpenseDeleteResponseDTO.java`
    - `ExpenseController`, `ExpenseService`, `ExpenseRepository`, exclusão imediata via `ReceiptStorage` e eventual `PendingPaymentRepository` no pacote `repository/`; colaborador transacional de persistência somente se necessário para garantir commit antes do storage.
    - `apps/api/src/test/java/com/obracerta/controller/ExpenseDeletionIntegrationTest.java`
    - Serviço/modelos Angular, consulta individual e `apps/web/src/app/features/expenses/expense-delete.spec.ts`.
    - Reutilizar `ConfirmModalComponent` sem modificá-lo, salvo necessidade aprovada posteriormente.

- [ ] **Tarefa 6 — Encerrar a sessão sem retomar operações automaticamente**
  - Cobre: CA8.
  - Teste primeiro:
    - `ExpenseMutationAuthenticationIntegrationTest` usa cadeia real de segurança e JWT expirado/ausente/inválido para PUT de despesa, DELETE de despesa, DELETE de comprovante e PUT multipart de substituição. Provar 401 sem escrita ou chamada ao storage; token válido deve continuar autorizado.
    - Angular: `expense-mutation-auth.spec.ts` usa o interceptor e o serviço de autenticação reais para comprovar logout, redirecionamento, ausência de modal inline e de reenvio/retorno automático após novo login. Antes desta tarefa, falta a comprovação integrada de todas as novas mutações; só alterar produção se o teste revelar lacuna dentro desse contrato.
  - Migration: nenhuma.
  - Arquivos previstos: os dois testes acima; se necessário, correção restrita aos handlers de erro das novas operações na consulta/modal e no serviço de despesas. Não mudar a política global de login nem reintroduzir recuperação de rascunho da US03.

- [ ] **Tarefa 7 — Consolidar cancelamento, troca de obra e recuperação de falhas**
  - Cobre: CA7 completo, CA9 completo e CA10.
  - Teste primeiro:
    - Angular: `expense-edit.spec.ts`, `expense-delete.spec.ts`, `expense-receipt-edit.spec.ts` e novo `expense-mutation-context.spec.ts` provam cancelar/X/Escape, backdrop inerte, duplo envio, formulário preservado em erro enquanto aberto, orientação sem obra, atualização da mesma obra, troca real e A → B → A com respostas tardias de sucesso/erro. Provar que resposta perdida não dispara reenvio automático e permite conferir o estado atual.
    - JUnit: consolidar a matriz de 404/validações das tarefas anteriores para todas as mutações, ausência de acesso ao storage antes da autorização e rollback financeiro em entradas inválidas. Cobrir limites numéricos e coerência de datas também ao editar uma despesa já pendente.
    - Falhas do storage não podem desfazer exclusão financeira concluída e devem ser informadas sem anunciar arquivo apagado. Testar tentativas imediatas sem conta real no storage. Não incluir recuperação automática.
  - Migration: nenhuma.
  - Arquivos previstos: componentes de consulta/edição, seus testes e serviços Angular existentes; suítes de integração da US04. Correções somente dos caminhos descritos nesta tarefa.

## Critérios sem tarefa

Nenhum. CA1/CA2 → Tarefa 1; CA3 → Tarefa 2; CA4 → Tarefa 3; CA5 → Tarefa 4; CA6 → Tarefa 5; CA7 → Tarefas 5 e 7; CA8 → Tarefa 6; CA9 → testes de cada operação e consolidação na Tarefa 7; CA10 → Tarefa 7.

### Verificação prevista

- Backend: `apps/api/.\mvnw.cmd test`, com perfil `test` e PostgreSQL exclusivo para testes; testes de schema mantêm Flyway e `ddl-auto=validate`. As primeiras passadas executam as classes da tarefa; no fechamento, executar a suíte completa.
- Frontend: em `apps/web`, `npx.cmd ng test --watch=false --browsers=ChromeHeadless` e `npm.cmd run build`. Durante cada tarefa, executar primeiro as specs relacionadas; ampliar para a suíte completa no fechamento ou quando alterações compartilhadas justificarem.
- Cada tarefa segue `utf-task`: tutor antes da implementação, TDD, dois revisores independentes, triagem dos apontamentos pelo autor e aceite explícito antes do commit. Não iniciar produção antes de a aprovação da spec estar commitada pelo autor e de este plano estar aprovado e commitado.
