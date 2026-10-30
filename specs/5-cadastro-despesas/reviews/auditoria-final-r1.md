# Auditoria Final — Issue #5 (local), US03

**Veredito:** NÃO PRONTO

Auditoria sobre `HEAD 65ca4e5`, usando a spec aprovada em `specs/5-cadastro-despesas/spec.md`, incluindo fora de escopo, abandono e premissas. O plano não foi usado como régua. A retirada de idempotência e recuperação de sessão, assim como CNPJ opcional, foi respeitada.

Base de comparação: `git diff 710e272c867078bd6b40f07ab7771e7f6f21ad82 HEAD`. O delta desde `1b5b658467f7ca2f1bba1e25197018085e23619e` distingue a implementação desta história das dependências herdadas.

## Critérios de aceite da spec

| # | Critério | Situação | Evidência (arquivo:linha / teste) |
| --- | --- | --- | --- |
| CA1 | Despesa quitada, modos direto e calculado, total automático e gasto acumulado | Atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:34`; testes `calculatesRoundedTotalAndAcceptsPastDate`, `persistsInlineSupplierExpenseAndBudgetAggregateThenReadsActualIndividualResource`; `expense-flow.spec.ts` cobre cálculo e consulta após cadastro. |
| CA2 | Despesa e pagamento pendente gravados atomicamente | Atendido | `ExpenseService.java:34`, `:78`; `PendingExpenseIntegrationTest` verifica vencimento igual/posterior e rollback após inserções financeiras. |
| CA3 | Formatos e limite informados, progresso, associação e consulta privada | Atendido nos testes automatizados | `apps/web/src/app/features/expenses/expense-form.component.html:118`; `expense-form.component.ts:227`; `ExpenseReceiptIntegrationTest` cobre JPEG, PNG, PDF e download; `S3ReceiptStorageTest` cobre o adaptador com HTTP local. |
| CA4 | Categoria sem teto ou com teto zero permite lançamento e oferece atalho | Atendido | `expense-form.component.ts:59`; `expense-form.component.html:32`; `expense-budget.spec.ts`; testes API `savesWithoutBudgetWithoutCreatingAnArtificialCeiling` e `savesWithZeroBudgetWithoutIncreasingOrDuplicatingTheCeiling`. |
| CA5 | Salvar ao atingir/ultrapassar 100% e exibir alerta | **Parcial — bloqueio AF-01** | Agregado correto em `ExpenseRepository.java:19` e `BudgetService.java:188`; alerta em `expense-detail.component.ts:20`. Quando o upload falha, o formulário permanece aberto sem esse alerta: `expense-form.component.ts:239`, `:273`. |
| CA6 | Falha preserva registros, tag persistente e reenvio na mesma despesa | Atendido | `ExpenseReceiptService.java:30`, `:42`; consulta mostra tag e reenvio em `expense-detail.component.ts:52`; teste `retryPersistsPendingAcrossRequestsWithoutDuplicatingFinancialRecords` verifica persistência entre requisições e ausência de duplicação. `expense-flow.spec.ts` cobre reabertura e ações após inicialização assíncrona da obra. |
| CA7 | Isolamento por proprietário e recusa de recursos excluídos | Atendido | `ExpenseService.java:36`, `:60`; `ExpenseRepository.java:15`; `ExpenseReceiptService.java:61`; testes `ownerFiltersForeignSupplierExpenseAndDeletedProjectAndExpense`, `refusesForeignProjectForeignSupplierAndDeletedProjectWithoutPayments` e `deniesReadAndUploadBeforeAnyStorageAccess`. |
| CA8 | Rejeição de anexo inválido na interface e API | Atendido | `apps/web/src/app/core/services/expense.service.ts:14`; `ExpenseReceiptService.java:35`; `ExpenseReceiptIntegrationTest` cobre MIME/extensão incompatíveis, vazio, limite exato e excesso; `ReceiptMultipartErrorTest` cobre excesso multipart. |
| CA9 | Vencimento anterior à compra impede gravação | Atendido | `ExpenseService.java:41`; `expense-form.component.ts:153`; testes `rejectsInvalidDueDateWithoutAnyPartialWrites` e validações de datas em `expense-flow.spec.ts`. |
| CA10 | Campos obrigatórios, valores por modo, fornecedor existente/inline e CNPJ opcional | Atendido | `ExpenseCreateDTO.java:8`; `ExpenseService.java:46`, `:58`; validadores e máscara em `expense-form.component.ts:46`, `:151`, `:188`. Testes cobrem CNPJ ausente/nulo/vazio, documento parcial inválido, normalização e fornecedores distintos sem CNPJ. |
| CA11 | Cancelamento, fechamento, ausência e troca de obra sem contaminação | Atendido | `ActiveProjectService.java` não se aplica: implementação em `apps/web/src/app/core/services/active-project.service.ts:61`; `expense-form.component.ts:90`, `:249`; `expense-context.spec.ts` cobre cancelamento, destruição, respostas atrasadas e A → B → A. |

A validação de arquivos segue o contrato documentado: MIME declarado, extensão correspondente e tamanho, sem inspeção interna dos bytes.

## Pendências que bloqueiam o PR

1. **AF-01 — P2 — O alerta de teto depende do sucesso do upload ou de navegação manual.**

   Cenário: categoria com teto de R$ 100 e gasto de R$ 90; cadastrar despesa de R$ 20 com comprovante válido; criação responde `201`, mas envio responde `503`, timeout ou erro de rede.

   A despesa permanece salva e o gasto passa a R$ 110. Entretanto, `ExpenseFormComponent.save()` encaminha o fluxo diretamente ao upload (`expense-form.component.ts:273–277`). No erro, apenas encerra o progresso e informa a falha do comprovante (`:239–245`), mantendo o usuário no cadastro.

   O aviso de revisão do orçamento existe exclusivamente na consulta individual (`expense-detail.component.ts:20–24`, `:120–122`). Ele só aparece depois que o usuário segue manualmente o link “Consultar despesa salva”. Portanto, nesse caminho aprovado pelo CA6, o salvamento não entrega o alerta exigido pelo CA5.

   O teste existente `expense-flow.spec.ts:316` confirma o caminho de falha e o link de consulta, mas não verifica a combinação com teto atingido. É necessário tornar o alerta independente do resultado do envio e cobrir essa combinação, após triagem do autor.

## Validação

- **Build web executado pelo auditor:** aprovado. Aviso de bundle inicial de **621,37 kB**, acima do orçamento de 500 kB.
- **Suíte web inteira:** **262 testes aprovados**, código de saída 0, executada pelo agente principal sobre o mesmo HEAD.
- **Suíte API inteira:** **179 testes, zero falhas, zero erros e zero ignorados; BUILD SUCCESS**, executada pelo agente principal contra PostgreSQL 16.15 no banco isolado `obracerta_us03_test`.
- As tentativas próprias encontraram restrições do ambiente: API com `SocketException: Permission denied: getsockopt`; web terminou com código 1 sem diagnóstico adicional. A repetição atual pelo agente principal forneceu a evidência executável.
- Nenhum arquivo-fonte foi alterado pelo auditor.

## Documentação

- **`docs/prd.md`:** US03 está 🟢 Live (`:105–111`), com ressalva explícita de integração pendente e sem confundir esse status com produção. Registra CNPJ opcional e retirada de idempotência/restauração.
- **`docs/architecture.md`:** acompanha V8/V9, vínculo opcional com orçamento, titularidade de fornecedores, estados do comprovante, contratos, Supabase privado e invalidação de contexto. Sem divergência documental bloqueante identificada.
- **`specs/README.md`:** identifica a referência local #5 e o estado implementado. A expressão “Fechamento documental […] pendente” está desatualizada diante dos documentos já commitados; ajuste editorial de fechamento, sem bloqueio funcional.
- **Premissas:** a seção “Assume que” está vazia; não há premissa desta spec exigindo novo `TODO #issue` ou abertura de dívida.
- **Escopo:** o diff contra `develop` inclui US07 e gestão de obras herdadas. Essa composição foi autorizada pelo autor e está declarada nas dependências; não foi tratada como implementação nova indevida da US03. O futuro PR deve deixar essa dependência visível.
- **Limitações externas:** vínculo da Issue remota não confirmado — o agente principal informou resposta 404 do GitHub. Integração ao vivo com o projeto Supabase não foi comprovada nesta auditoria; os testes usam armazenamento controlado e HTTP local. Nenhuma Issue ou PR foi criado.

## Matéria-prima para a seção “O que este PR faz e por quê”

- Cadastro de despesas quitadas ou pendentes, com valor direto ou cálculo no servidor.
- Criação atômica do pagamento pendente e atualização dos gastos por categoria.
- Seleção de fornecedor próprio ou cadastro inline com CNPJ opcional.
- Comprovantes privados com consulta autenticada, estado persistente e reenvio sem repetir registros financeiros.
- Proteção do contexto da obra contra respostas atrasadas, incluindo A → B → A.
