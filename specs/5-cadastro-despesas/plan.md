# Plano — Issue #5

## Decisões técnicas

Plano aprovado explicitamente pelo autor nesta conversa. A implementação acontece em `feature/us03-cadastro-despesas`. Não alterar o status da spec pelo agente. Antes do código, conferir a aprovação commitada pelo autor e este plano aprovado e commitado.

### Backend (`apps/api`)

- `POST /api/expenses`: recebe `ExpenseCreateDTO`, retorna `201 Created`, `Location` e `ExpenseResponseDTO`. Campos: `projectId`, `description`, `purchaseDate`, `categoryId`, seleção exclusiva entre `supplierId` e `newSupplier` (nome e CNPJ), `paid`, `dueDate` e modo de valor `DIRECT` ou `CALCULATED`. No modo direto, exigir `totalPrice`; no calculado, exigir `quantity` e `unitPrice` e calcular o total no servidor. Não aceitar um total arbitrário que substitua o cálculo.
- Valores monetários positivos com até duas casas decimais, respeitando `NUMERIC(15,2)`. Quantidade positiva com até duas casas, respeitando `NUMERIC(10,2)`. Multiplicar com `BigDecimal` e arredondar o resultado final para centavos com `HALF_UP`. Validar também o total calculado: não pode resultar em zero nem exceder a coluna. São decisões técnicas propostas para aprovação deste plano.
- `GET /api/expenses/{id}`: consulta individual, `200` com dados da despesa, informação de quitação, eventual pagamento e estado de comprovante. O retorno nunca expõe uma URL pública do armazenamento. A criação fornece o endereço da consulta individual para acesso posterior.
- `GET /api/suppliers`: listar apenas fornecedores do usuário autenticado para seleção. A criação inline é parte da transação da despesa; falha de validação do lançamento não deixa fornecedor recém-criado órfão. O CNPJ é obrigatório nesse fluxo, normalizado para comparação; não consultar bases fiscais externas.
- `PUT /api/expenses/{id}/receipt`: enviar um único arquivo multipart à despesa já salva. A gravação financeira é confirmada antes do envio. O formulário informa, na criação, se havia intenção de anexar comprovante, permitindo registrar `PENDING` antes da tentativa. Sem intenção, registrar `NONE`; upload confirmado gera `UPLOADED`. A consulta deriva a tag “Sem comprovante” sempre que não há arquivo confirmado. Uma interrupção antes de iniciar o upload também deixa a pendência recuperável.
- `GET /api/expenses/{id}/receipt`: leitura autenticada do arquivo, com tipo e nome seguros. Validar a posse antes de acessar o armazenamento; não permitir referência arbitrária de objeto enviada pelo cliente.
- Armazenamento S3 compatível conforme a arquitetura, com MinIO em desenvolvimento e substituto controlado nos testes. Chave interna gerada no servidor. Confirmar `UPLOADED` somente após armazenamento bem-sucedido; falhas preservam o lançamento e permitem retry. Repetir o envio para uma pendência não deve criar registros financeiros nem acumular arquivos órfãos; se o arquivo já foi confirmado, consultar o resultado antes de tentar substituir, pois substituição é US04.
- Validar JPEG, PNG e PDF por conteúdo e tipo, além da extensão, e tamanho máximo de 10 MiB (10 × 1024 × 1024 bytes); comunicar esse limite no formulário. Arquivo inválido: `400`; tamanho excedido: `413`, ambos com mensagem compreensível. Limites multipart devem comportar o envelope sem rejeitar um arquivo válido de exatamente esse tamanho.
- O service valida obra ativa não excluída do usuário, categoria existente e fornecedor pertencente ao mesmo usuário. Leituras e upload filtram também despesa ativa e obra não excluída. Recurso alheio/inexistente: `404`, sem acesso ao armazenamento nem escrita. Controllers não recebem entidades nem acessam repositórios.
- Despesa e pagamento pendente são uma única transação. Despesa quitada não cria pagamento pendente. Vencimento é obrigatório para não quitada e não pode anteceder `purchaseDate`. Valores gastos incluem despesas ativas pagas e pendentes; usar o agregado de orçamento da US07 para os alertas, sem manter um segundo saldo mutável.
- Criação com `Idempotency-Key`: UUID estável por tentativa. Persistir usuário, obra, chave, hash do payload normalizado e despesa criada na mesma transação. Repetição idêntica devolve a mesma despesa; payload divergente retorna `409`. Resolver concorrência pela unicidade no banco, sem repetir fornecedor inline ou pagamento. Revalidar autorização e exclusão lógica antes de devolver resultado antigo.

### Migração de schema

- Última migration no início do plano: `V7__seed_predefined_expense_categories.sql`. Confirmar novamente a sequência antes de cada tarefa; nunca editar uma migration aplicada. Manter `ddl-auto=validate`.
- Tarefa 1: `V8__prepare_expense_registration.sql`. Flexibilizar `expenses.budget_id` para permitir categoria sem orçamento; manter obra e categoria obrigatórias. Persistir a informação de quitação. Introduzir titularidade de fornecedor e ajustar dados legados sem misturar contas: associar fornecedor usado por uma conta a essa conta, clonar e religar referências por proprietário quando compartilhado no legado. Fornecedores legados sem referências ficam sem proprietário e não são expostos pela API. Testar explicitamente esse backfill; não atribuir dados sem dono a um usuário arbitrário.
- Tarefa 2: `V9__validate_pending_payment_due_date.sql`, para a obrigatoriedade de vencimento quando aplicável e eventuais ajustes necessários à representação do pagamento. Comparação entre data da despesa e vencimento é validada no service, dentro da transação; não criar `CHECK` que consulte outra tabela.
- Tarefa 5: `V10__add_expense_receipt_state.sql`. Persistir chave interna e estado `NONE`/`PENDING`/`UPLOADED`, com integridade entre presença de chave e estado. Tratar valores legados explicitamente; não inventar sucesso para uma referência cujo objeto não foi confirmado. O estado após upload deve ser consistente com o comportamento de retry da tarefa 7.
- Tarefa 9: `V11__add_expense_creation_idempotency.sql`, com unicidade por usuário, obra e chave, hash normalizado e referência da despesa. Sem reutilizar chave para uma nova intenção de lançamento.
- Caso uma migration prevista não seja necessária após verificar o schema, registrar “nenhuma” na tarefa antes de implementá-la; não criar migration vazia. Renumerar apenas as futuras, ainda não aplicadas.

### Frontend (`apps/web`)

- Rotas protegidas `/despesas/nova` e `/despesas/:id`, carregadas sob o layout existente. Cadastro com `ReactiveForms`, tokens existentes e modos de valor mutuamente exclusivos. Consulta individual com tag “Sem comprovante”, acesso ao comprovante confirmado e seleção de arquivo para reenvio. Sem criar uma seção separada de pendências nem antecipar a listagem completa da US05.
- Ajuste solicitado pelo autor na triagem da tarefa 1: o acesso ao cadastro fica em um botão **“Cadastrar conta”** dentro de **“Contas a pagar”** (`/contas`), direcionando a `/despesas/nova`. Não criar um item “Cadastrar despesa” no menu principal. A página de entrada não antecipa listagem, filtros ou baixa de pagamentos das histórias posteriores.
- `core/services/expense.service.ts` e `supplier.service.ts` concentram HTTP e DTOs tipados. Usar `CategoryService`, `BudgetService`, `ActiveProjectService` e identidade autenticada existentes. Estado de carregamento, erro, envio e progresso em signals; nenhum componente usa HTTP diretamente.
- Após criar, abrir a consulta individual usando o ID confirmado e disponibilizar seu endereço. Para comprovante selecionado, enviar somente depois da criação; falha mostra o alerta aprovado sem apagar o sucesso da gravação financeira. Reabrir o endereço permite reenvio escolhendo outro arquivo local.
- A mudança real de obra encerra o contexto do formulário e ignora respostas antigas, inclusive A → B → A. Atualização dos metadados da mesma obra não descarta campos. Uma operação já recebida pelo servidor pode concluir para a obra original; não prometer cancelamento transacional por navegação.
- Serviço de recuperação de rascunho em `sessionStorage`, sem token ou conteúdo binário: campos, usuário, obra, rota e chave da tentativa. Capturar antes de uma requisição protegida para sobreviver ao logout síncrono do interceptor. Restaurar somente após login da mesma conta, validando acesso à obra original; oferecer o retorno a essa obra, sem copiar o lançamento para a atualmente selecionada. Excluir rascunho após sucesso confirmado, cancelamento ou logout voluntário. Não restaurar dados para outra conta.
- Manter o encerramento de sessão e redirecionamento para login da arquitetura existente. Recuperação não salva automaticamente; pede conferência e nova seleção do arquivo. Não modificar globalmente o comportamento dos demais formulários.

## Tarefas

- [x] **Tarefa 1 — Cadastrar despesa quitada com fornecedor**
  - Cobre: CA1, CA10 e CA7 para criação e consulta individual.
  - Teste primeiro: JUnit de criação por valor direto e calculado, limites e campos inválidos, seleção/criação inline de fornecedor e rollback, incluindo fornecedor/obra alheios com 404. Integração PostgreSQL para backfill de fornecedores e persistência. Angular `.spec.ts` para formulário, validações dos dois modos, fornecedor inline, resposta de sucesso e consulta individual real. RED antes de criar o fluxo.
  - Migration: `V8__prepare_expense_registration.sql`.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/{controller,service,repository,mapper,model/dto,model/entity}` nos recursos Expense/Supplier; migration e testes correspondentes em `apps/api/src/test`; `apps/web/src/app/core/{models,services}`, `apps/web/src/app/features/expenses`, `app.routes.ts` e navegação necessária ao cadastro, com testes correspondentes.
  - Entrega: formulário → API → PostgreSQL → consulta individual; gasto da US07 reflete a despesa. Nenhuma listagem completa é criada.

- [ ] **Tarefa 2 — Registrar pagamento pendente com vencimento válido**
  - Cobre: CA2 e CA9; reforça CA7 no lançamento a prazo.
  - Teste primeiro: JUnit prova criação atômica de despesa/pagamento, igualdade de datas aceita, data anterior e ausência rejeitadas sem gravação parcial. Angular prova opção não quitada, campo obrigatório e erro de vencimento. Testar que falha não deixa fornecedor inline órfão.
  - Migration: `V9__validate_pending_payment_due_date.sql`, se necessária conforme a seção de schema.
  - Arquivos previstos: DTO/service/mapper de Expense, `PendingPayment`, repositório e migration; formulário e modelos de despesas; testes API/web.

- [ ] **Tarefa 3 — Avisar sobre categoria sem teto**
  - Cobre: CA4.
  - Teste primeiro: JUnit/integração prova salvamento sem orçamento e com teto zerado sem criar teto artificial; Angular prova aviso, atalho para orçamento da categoria e manutenção dos campos ao abrir esse fluxo.
  - Migration: nenhuma; nullable de `budget_id` nasce na tarefa 1.
  - Arquivos previstos: service/DTO de despesas se necessário; formulário, serviços de categoria/orçamento e integração com o formulário de teto existente; testes API/web.

- [ ] **Tarefa 4 — Alertar quando o gasto atingir o teto**
  - Cobre: CA5.
  - Teste primeiro: JUnit prova agregação após salvar, incluindo despesas pagas/pendentes e exclusão de deletadas; Angular prova alerta em 100% e acima, ausência abaixo do teto e salvamento concluído apesar do alerta.
  - Migration: nenhuma.
  - Arquivos previstos: service/DTO de resposta de despesas, integração com `BudgetService`, consulta individual/formulário e testes API/web.

- [ ] **Tarefa 5 — Anexar e consultar comprovante válido**
  - Cobre: CA3 e CA7 para acesso ao comprovante.
  - Teste primeiro: JUnit com armazenamento controlado prova upload/leitura de JPEG, PNG e PDF, limite exato aceito e 404 antes de acesso ao storage para recurso alheio ou excluído. Angular prova instruções de formato/tamanho, progresso e upload apenas após confirmar criação financeira.
  - Migration: `V10__add_expense_receipt_state.sql`.
  - Arquivos previstos: controller/service de comprovantes, adaptador S3 e configuração por ambiente, `pom.xml`, entidade/DTO de despesa, migration e testes API; serviço e componentes de despesa com testes web; configuração MinIO local e `.env.example` se necessário, sem credenciais reais.

- [ ] **Tarefa 6 — Rejeitar comprovantes inválidos**
  - Cobre: CA8.
  - Teste primeiro: JUnit prova rejeição de extensão/tipo/conteúdo divergentes e limite excedido sem objeto persistido; Angular prova rejeição na seleção e apresentação dos erros 400/413 sem declarar sucesso de upload. A ausência de um anexo válido não invalida os dados financeiros.
  - Migration: nenhuma.
  - Arquivos previstos: validação e configuração de upload, tratamento de erros da API, seletor de arquivo e testes API/web.

- [ ] **Tarefa 7 — Manter tag e permitir reenvio na despesa**
  - Cobre: CA6 completo e CA7 no reenvio.
  - Teste primeiro: JUnit prova despesa e pagamento preservados após falha do storage, estado recuperável por GET, upload posterior na mesma despesa e ausência de duplicação financeira. Angular simula falha, alerta, tag “Sem comprovante”, destruição/reabertura da consulta e nova seleção/reenvio; sucesso remove tag, nova falha mantém. Provar tag também em despesa criada sem anexo, sem alerta de falha nesse caso.
  - Migration: nenhuma; estado persistente incluído na tarefa 5.
  - Arquivos previstos: service/DTO de comprovante e despesas, consulta individual e serviço web, testes API/web. Não criar seção de pendências ou listagem geral.

- [ ] **Tarefa 8 — Preservar o contexto ao cancelar ou trocar de obra**
  - Cobre: CA11.
  - Teste primeiro: Angular prova cancelamento/fechamento antes do envio sem POST, ausência de obra com orientação, troca de obra e respostas atrasadas inclusive A → B → A, sem descarte por mudança de metadados da mesma obra. JUnit reforça que a obra persistida é a validada no payload da operação original.
  - Migration: nenhuma.
  - Arquivos previstos: componentes de despesas, integração com `ActiveProjectService` e rotas; testes web e teste de integração da API.

- [ ] **Tarefa 9 — Recuperar salvamento sem duplicar lançamento**
  - Cobre: CA12.
  - Teste primeiro: integração PostgreSQL prova duas requisições com mesma chave/payload, incluindo concorrência, gerando uma despesa, um fornecedor inline e no máximo um pagamento; payload diferente gera 409. Angular simula resposta perdida, preserva campos/chave, repete sem duplicação e bloqueia duplo clique; nova intenção recebe nova chave. Verificar autorização no replay.
  - Migration: `V11__add_expense_creation_idempotency.sql`.
  - Arquivos previstos: entidade/repositório da chave de criação, service/controller de despesas, migration e testes API; serviço/componente de cadastro e testes web.

- [ ] **Tarefa 10 — Recuperar campos após sessão expirada**
  - Cobre: CA13; integra recuperação com CA12 e seleção de arquivo de CA6.
  - Teste primeiro: Angular simula 401 com logout do interceptor, login da mesma conta e retorno à obra original, preservando campos e chave sem envio automático. Outra conta/obra não recebe os dados; cancelamento/logout voluntário/sucesso removem rascunho. Arquivo precisa de nova seleção. JUnit prova 401 sem escrita e replay autorizado após login sem duplicação.
  - Migration: nenhuma.
  - Arquivos previstos: serviço de rascunho de despesas, formulário, fluxo de retorno do login, identidade autenticada/interceptor apenas se necessário; testes API/web. Atualizar as decisões de sessão da US03 em `docs/design-tokens.md` e `docs/user-flows.md`, conforme a spec.

Cada tarefa segue RED → GREEN → REFACTOR nas camadas citadas. Usar PostgreSQL real com Flyway/validate nos testes de persistência, nunca H2 como substituto desses testes. Limite de duas rodadas de TDD pelo mesmo motivo e duas rodadas de revisão, conforme a constituição.

Validação por tarefa: testes JUnit do comportamento afetado em `apps/api` com perfil `test` e PostgreSQL configurado; testes Jasmine/Karma em `apps/web` com ChromeHeadless. Executar build Angular quando alterar componentes/contratos. Não declarar checks concluídos sem executá-los.

Após cada implementação: revisores distintos de conformidade e código, pareceres imutáveis e triagem do autor; leitura do diff com tutor e commit somente após autorização. Executar uma tarefa por vez e devolver o controle ao autor ao final.

No fechamento, após as dez tarefas: atualizar PRD, arquitetura, índice de specs e documentação de sessão; solicitar autorização para o commit documental, então despachar auditor-final contra a spec, seguindo `utf-issue`. Essa etapa não é uma tarefa adicional de implementação nem autoriza ampliar o escopo sem novo aceite.

## Critérios sem tarefa
