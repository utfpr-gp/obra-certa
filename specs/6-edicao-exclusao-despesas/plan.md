# Plano — Issue #6

## Decisões técnicas

Este plano implementa a spec aprovada da US04 em sete tarefas. A consulta individual existente é a entrada; a listagem da US05 e a evolução de fornecedores da US15 permanecem fora do escopo. Cada tarefa funcional atravessa API e tela e começa pelos testes.

Plano aprovado pelo autor em 31/10/2026, com a condição de revisar antes de iniciar cada tarefa. Essa revisão prévia confere os critérios cobertos, o código existente, os arquivos previstos, as dependências e os riscos; apresenta o que será alterado e o que os testes devem provar antes de despachar a implementação. Não substitui o tutor antes do código nem as duas revisões independentes posteriores previstas em `utf-task`. Mudanças de escopo ou dúvidas encontradas voltam ao autor antes de qualquer implementação.

### Backend (`apps/api`)

- `PUT /api/expenses/{id}` → `200 ExpenseResponseDTO`: atualiza a despesa ativa do usuário autenticado. `ExpenseUpdateDTO` contém descrição, data, categoria e os campos de valor direto/calculado; na Tarefa 2 recebe também situação de pagamento e vencimento. Não recebe alteração de obra, fornecedor ou comprovante. Se um cliente enviar um identificador de obra extra, ele nunca altera a obra persistida. Todos os vínculos continuam conforme a US03 atual.
- Reutilizar o cálculo com `BigDecimal` e limites da criação. Alterar categoria ajusta o vínculo opcional ao orçamento da categoria de destino; despesa sem teto continua permitida. Os gastos são agregados de despesas ativas, sem manter contadores monetários paralelos ou modificar tetos. A atualização retorna a mesma despesa e a tela consulta o orçamento após o sucesso para apresentar o alerta.
- `ExpenseResponseDTO` recebe `paidAt` nullable na Tarefa 2 e `receiptCleanupPending` na Tarefa 3, com espelhos no Angular e mapeamento centralizado em `ExpenseMapper`. Campos novos não removem os contratos da US03.
- `PendingPayment` mantém a relação um para um. Acrescentar `PaymentStatus` (`PENDING`, `PAID`) e `paidAt` (`Instant`, nullable). Pendente → paga atualiza a mesma linha, status e data; paga → pendente reutiliza a linha, atualiza vencimento e limpa `paidAt`, que representa a quitação atual. Não criar histórico separado de ciclos nem remover o pagamento ao quitar. Criar uma linha somente quando ainda não houver pagamento. Na criação de despesa a prazo, inicializar `PENDING`; despesa criada já paga sem compromisso prévio pode continuar sem linha de pagamento. Usar o `Clock` existente para datas e instantes.
- `DELETE /api/expenses/{id}/receipt` → `200 ExpenseResponseDTO`: remove a associação ao comprovante e devolve o estado `NONE`, registrando a limpeza física antes de perder a chave antiga. Sem anexo confirmado, pode devolver o estado atual sem criar trabalho repetido.
- `PUT /api/expenses/{id}/receipt`: estender o endpoint multipart existente para substituir também um anexo `UPLOADED`. Validar antes de qualquer mudança. Um novo envio usa chave privada diferente da atual; nunca sobrescrever o arquivo confirmado em uso. Confirmar o envio, persistir a nova associação e a limpeza pendente da chave anterior na mesma transação, e só depois apagar o anterior. Falha no envio preserva os metadados e o arquivo atual. Falha na associação não autoriza apagar o arquivo antigo; o objeto novo sem associação deve ser encaminhado à limpeza, sem confundi-lo com o comprovante confirmado.
- `DELETE /api/expenses/{id}` → `200 ExpenseDeleteResponseDTO` com `id`, `deleted` e `receiptCleanupPending`. A transação grava `deleted_at` na despesa e no pagamento existente, preserva as linhas e registra a limpeza do comprovante. A resposta só confirma exclusão depois do commit. Nenhum erro do armazenamento desfaz uma exclusão financeira já confirmada. Repetir a chamada a uma despesa já excluída devolve `404 Despesa não encontrada`; o cliente consulta o resultado após resposta perdida, sem reenvio automático.
- Toda operação resolve primeiro despesa ativa e obra ativa pelo proprietário, usando a consulta de posse existente; não acessar armazenamento antes dessa autorização. Identificadores alheios/inexistentes/excluídos retornam 404 no formato atual. Segurança mantém autenticação obrigatória e o interceptor existente trata 401. Nenhuma rota pública nova.
- A extensão de `ReceiptStorage` inclui exclusão física por chave. `S3ReceiptStorage` usa a operação de exclusão de objeto, tratando arquivo já ausente como limpeza concluída. Não simular exclusão lógica de arquivos nem manter versões no produto.

### Limpeza física e recuperação

- Criar uma tabela simples de pendências `receipt_cleanup_tasks`, sem serviço de filas externo, com identificador, referência à despesa, chave privada única, data de criação, quantidade de tentativas, próxima tentativa e data de conclusão nullable. A chave não é exposta nos DTOs públicos nem os erros incluem credenciais.
- Remoção de anexo, substituição e exclusão financeira gravam a pendência na mesma transação da mudança correspondente. O apagamento da chave antiga só começa após commit. Para a resposta inicial, consultar o resultado da tentativa imediata e informar corretamente se a limpeza continua pendente. Falha ao apagar ou ao confirmar a limpeza conserva a pendência; nova exclusão do mesmo objeto é segura.
- Um processador agendado retoma pendências vencidas a cada 60 segundos, inclusive depois de reiniciar a API. Usar `Clock` e parâmetros configuráveis, sem espera real nos testes. Falhas continuam agendadas, sem limite que abandone silenciosamente um arquivo; não é necessário nova exclusão pelo usuário.
- O processador não depende de a despesa continuar ativa. Antes de apagar uma chave, verificar que ela não é o comprovante confirmado de uma despesa ativa; nunca apagar a chave atual durante a substituição. A Tarefa 4 deve tratar explicitamente o objeto recém-enviado cuja associação falha e testar sua recuperação.
- A operação financeira e a chamada ao armazenamento são etapas distintas: nenhum rollback de PostgreSQL recupera um arquivo já apagado. Separar os limites transacionais e os colaboradores de commit/limpeza, sem confiar em chamadas internas a métodos `@Transactional` da mesma instância. Os testes integrados verificam a ordem de commit e os estados duráveis.
- `receiptCleanupPending` informa somente se existe limpeza ainda pendente para aquela despesa; nunca afirma que o arquivo foi apagado antes da confirmação. Após exclusão, a tela pode exibir “Despesa excluída. A limpeza do comprovante está pendente.” sem manter acesso à despesa excluída.

### Migração de schema

- Última migration conferida no início do plano: V9. Confirmar novamente antes de implementar; as versões abaixo são reservadas nesta sequência local, não autorizam editar migrations aplicadas.
- Tarefa 2: `V10__add_payment_status_and_paid_at.sql`. Acrescentar status e data de quitação, preservando a unicidade por despesa e os dados existentes. Inicializar status pela situação persistida de `expenses.paid`. Não inventar data de quitação para registros legados que não a possuem; permitir `paidAt` nulo nesse legado. Validar coerência dos novos registros na aplicação.
- Tarefa 3: `V11__create_receipt_cleanup_tasks.sql`. Criar as pendências duráveis e índices para a chave única, despesa e busca de trabalhos vencidos. Manter a constraint da V9: despesa `NONE/PENDING` não conserva chave ativa; a chave antiga necessária à limpeza vive na nova tabela.
- Tarefas 1 e 4 a 7 não preveem migration adicional. Manter `ddl-auto=validate` em todos os perfis.

### Frontend (`apps/web`)

- Adicionar “Editar” e “Excluir” à consulta individual existente. A edição abre um modal próprio `expense-edit-modal`, preenchido a partir de `ExpenseResponse`, com `ReactiveFormsModule`; descrição, data, categoria, modo de valor e campos monetários seguem as validações da US03. A situação financeira e o vencimento entram na Tarefa 2. Não exibir controle editável de obra ou fornecedor.
- `ExpenseService` concentra as operações HTTP; componentes não injetam `HttpClient`. Modelos de atualização e exclusão ficam em `expense-registration.model.ts`. A resposta salva atualiza a consulta e recarrega o orçamento da mesma obra; falha nessa leitura complementar não transforma uma edição confirmada em falha de gravação.
- Remoção e substituição de anexo usam a consulta individual, seleção de arquivo e progresso existentes, estendidos na respectiva tarefa. “Sem comprovante” aparece após remoção. Apresentar a diferença entre novo anexo confirmado e limpeza antiga pendente, sem oferecer o arquivo antigo.
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

- [ ] **Tarefa 2 — Alternar entre pagamento quitado e futuro**
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

- [ ] **Tarefa 3 — Remover comprovante com limpeza física recuperável**
  - Cobre: CA4; proteção de acesso ao anexo do CA9.
  - Teste primeiro:
    - JUnit: `S3ReceiptStorageTest` prova chamada de exclusão física e objeto ausente como sucesso. `ReceiptCleanupServiceTest` prova retentativa por relógio, falha sem perda da pendência, processamento após reinício e proteção de chave ainda ativa.
    - Integração PostgreSQL: `ExpenseReceiptRemovalIntegrationTest` prova retirada dos metadados, estado NONE, outbox gravada na mesma transação, tentativa de limpeza somente após commit, retorno correto de pendência, cancelamento da transação sem apagar o arquivo e 404 sem acesso ao storage para recurso alheio/excluído. `ReceiptCleanupSchemaMigrationTest` verifica estrutura e unicidade.
    - Angular: `expense-receipt-edit.spec.ts` prova remoção, “Sem comprovante” e mensagem distinta de limpeza pendente, preservando os dados financeiros. Antes da tarefa, não existe DELETE de anexo nem operação de apagar no storage.
  - Migration: `V11__create_receipt_cleanup_tasks.sql`.
  - Arquivos previstos:
    - Migration acima em `apps/api/src/main/resources/db/migration/`.
    - `apps/api/src/main/java/com/obracerta/model/entity/ReceiptCleanupTask.java`
    - `apps/api/src/main/java/com/obracerta/repository/ReceiptCleanupTaskRepository.java`
    - `apps/api/src/main/java/com/obracerta/service/ReceiptCleanupService.java`
    - `apps/api/src/main/java/com/obracerta/configuration/ReceiptCleanupConfiguration.java`
    - `ExpenseReceiptService`, `ExpenseReceiptController`, `ReceiptStorage`, `S3ReceiptStorage`, `ExpenseResponseDTO`, `ExpenseMapper` e `ExpenseRepository` nos pacotes existentes, com colaboradores transacionais de limpeza no pacote `service/` se necessários.
    - `apps/api/src/main/resources/application.properties` e `application-test.properties` para intervalo e controle do agendamento nos testes.
    - Testes JUnit citados, nos respectivos pacotes `integration/`, `service/`, `controller/` e `migration/`.
    - Serviço e modelos Angular, consulta individual e `apps/web/src/app/features/expenses/expense-receipt-edit.spec.ts`.

- [ ] **Tarefa 4 — Substituir comprovante preservando o atual até a confirmação**
  - Cobre: CA5; validações de arquivo e isolamento do CA9.
  - Teste primeiro:
    - JUnit: `ExpenseReceiptReplacementIntegrationTest` prova chave nova, envio confirmado antes de trocar a associação, commit antes de apagar o antigo e limpeza durável em caso de falha. Novo envio inválido/falho conserva o atual. Falha na persistência conserva o antigo e encaminha o novo órfão para limpeza. Exercitar sequência de substituições com a chave correta e impedir remoção do comprovante atual pelo processador. Cobrir MIME, extensão, vazio, limite de 10 MiB e 404 antes de acessar storage.
    - Angular: `expense-receipt-edit.spec.ts` prova seleção, progresso, consulta do novo confirmado, preservação do antigo em falha de envio e mensagem de limpeza pendente sem oferecer versão anterior.
  - Migration: nenhuma; usar a estrutura da Tarefa 3.
  - Arquivos previstos: `ExpenseReceiptService`, colaboradores de limpeza, testes `ExpenseReceiptReplacementIntegrationTest` e `ReceiptCleanupServiceTest`; `ExpenseService` Angular, consulta individual e `expense-receipt-edit.spec.ts`. Ajustar os testes existentes de upload da US03 para o novo comportamento de substituição explicitamente previsto pela US04, preservando os demais contratos.

- [ ] **Tarefa 5 — Excluir logicamente a despesa mediante confirmação**
  - Cobre: CA6; cancelamento e duplo envio da exclusão do CA7; isolamento da exclusão do CA9.
  - Teste primeiro:
    - JUnit/PostgreSQL: `ExpenseDeletionIntegrationTest` prova linhas preservadas com `deleted_at`, pagamento inativado, gasto removido dos agregados, teto intacto e remoção física posterior ao commit. Simular falha do storage com exclusão financeira concluída e pendência durável; falha ao gravar no banco não pode apagar o comprovante. Provar 404 em repetição e em recurso alheio/excluído, inclusive leitura/edição/download/upload após a exclusão.
    - Angular: `expense-delete.spec.ts` prova diálogo, confirmação única, cancelamento por botão/X/Escape sem requisição, backdrop inerte, retirada dos dados da consulta após sucesso e confirmação de limpeza pendente com retorno a Contas a Pagar.
  - Migration: nenhuma.
  - Arquivos previstos:
    - `apps/api/src/main/java/com/obracerta/model/dto/expense/ExpenseDeleteResponseDTO.java`
    - `ExpenseController`, `ExpenseService`, `ExpenseRepository`, limpeza de comprovantes e eventual `PendingPaymentRepository` no pacote `repository/`.
    - `apps/api/src/test/java/com/obracerta/controller/ExpenseDeletionIntegrationTest.java`
    - Serviço/modelos Angular, consulta individual e `apps/web/src/app/features/expenses/expense-delete.spec.ts`.
    - Reutilizar `ConfirmModalComponent` sem modificá-lo, salvo necessidade aprovada posteriormente.

- [ ] **Tarefa 6 — Encerrar a sessão sem retomar operações automaticamente**
  - Cobre: CA8.
  - Teste primeiro:
    - `ExpenseMutationAuthenticationIntegrationTest` usa cadeia real de segurança e JWT expirado/ausente/inválido para PUT de despesa, DELETE de despesa, DELETE de comprovante e PUT multipart de substituição. Provar 401 sem escrita, pendência criada ou chamada ao storage; token válido deve continuar autorizado.
    - Angular: `expense-mutation-auth.spec.ts` usa o interceptor e o serviço de autenticação reais para comprovar logout, redirecionamento, ausência de modal inline e de reenvio/retorno automático após novo login. Antes desta tarefa, falta a comprovação integrada de todas as novas mutações; só alterar produção se o teste revelar lacuna dentro desse contrato.
  - Migration: nenhuma.
  - Arquivos previstos: os dois testes acima; se necessário, correção restrita aos handlers de erro das novas operações na consulta/modal e no serviço de despesas. Não mudar a política global de login nem reintroduzir recuperação de rascunho da US03.

- [ ] **Tarefa 7 — Consolidar cancelamento, troca de obra e recuperação de falhas**
  - Cobre: CA7 completo, CA9 completo e CA10.
  - Teste primeiro:
    - Angular: `expense-edit.spec.ts`, `expense-delete.spec.ts`, `expense-receipt-edit.spec.ts` e novo `expense-mutation-context.spec.ts` provam cancelar/X/Escape, backdrop inerte, duplo envio, formulário preservado em erro enquanto aberto, orientação sem obra, atualização da mesma obra, troca real e A → B → A com respostas tardias de sucesso/erro. Provar que resposta perdida não dispara reenvio automático e permite conferir o estado atual.
    - JUnit: consolidar a matriz de 404/validações das tarefas anteriores para todas as mutações, ausência de acesso ao storage antes da autorização e rollback financeiro em entradas inválidas. Cobrir limites numéricos e coerência de datas também ao editar uma despesa já pendente.
    - Falhas do storage não podem desfazer exclusão concluída nem perder a pendência de limpeza. A retomada agendada é testada chamando o processador com relógio fixo, sem esperas e sem depender de conta real no storage.
  - Migration: nenhuma.
  - Arquivos previstos: componentes de consulta/edição, seus testes e serviços Angular existentes; suítes de integração da US04 e testes do processador de limpeza. Correções somente dos caminhos descritos nesta tarefa.

## Critérios sem tarefa

Nenhum. CA1/CA2 → Tarefa 1; CA3 → Tarefa 2; CA4 → Tarefa 3; CA5 → Tarefa 4; CA6 → Tarefa 5; CA7 → Tarefas 5 e 7; CA8 → Tarefa 6; CA9 → testes de cada operação e consolidação na Tarefa 7; CA10 → Tarefa 7.

### Verificação prevista

- Backend: `apps/api/.\mvnw.cmd test`, com perfil `test` e PostgreSQL exclusivo para testes; testes de schema mantêm Flyway e `ddl-auto=validate`. As primeiras passadas executam as classes da tarefa; no fechamento, executar a suíte completa.
- Frontend: em `apps/web`, `npx.cmd ng test --watch=false --browsers=ChromeHeadless` e `npm.cmd run build`. Durante cada tarefa, executar primeiro as specs relacionadas; ampliar para a suíte completa no fechamento ou quando alterações compartilhadas justificarem.
- Cada tarefa segue `utf-task`: tutor antes da implementação, TDD, dois revisores independentes, triagem dos apontamentos pelo autor e aceite explícito antes do commit. Não iniciar produção antes de a aprovação da spec estar commitada pelo autor e de este plano estar aprovado e commitado.
