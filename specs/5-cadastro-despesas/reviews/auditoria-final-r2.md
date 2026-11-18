# Auditoria Final — Issue #5 (local), US03 — Rodada 2

**Veredito:** PRONTO PARA PR

Referência auditada: `HEAD caef752`. A avaliação considera os onze critérios da spec aprovada, suas exclusões de escopo, abandono e premissas. O plano não foi usado como régua.

Comparação da branch contra `develop`: `git diff 710e272c867078bd6b40f07ab7771e7f6f21ad82 HEAD`. A comparação com `1b5b658467f7ca2f1bba1e25197018085e23619e` distingue a US03 das dependências herdadas. A correção posterior ao parecer anterior foi conferida no delta desde `65ca4e5`.

## Critérios de aceite da spec

| # | Critério | Situação | Evidência (arquivo:linha / teste) |
| --- | --- | --- | --- |
| CA1 | Cadastro quitado, valor direto ou calculado, total automático e gasto acumulado | Atendido | `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:34`; testes `calculatesRoundedTotalAndAcceptsPastDate` e `persistsInlineSupplierExpenseAndBudgetAggregateThenReadsActualIndividualResource`; fluxo Angular de cadastro e consulta. |
| CA2 | Despesa e pagamento pendente gravados atomicamente | Atendido | `ExpenseService.java:34`, `:78`; `PendingExpenseIntegrationTest` verifica vencimentos válidos e rollback após inserções financeiras. |
| CA3 | Orientação sobre formatos/limite, progresso, associação e consulta do comprovante | Atendido nos testes automatizados | `expense-form.component.html:124`; `expense-form.component.ts:236`; `ExpenseReceiptIntegrationTest` cobre JPEG, PNG, PDF e download privado; `S3ReceiptStorageTest` cobre o adaptador com HTTP local. |
| CA4 | Aviso e atalho para categoria sem teto, preservando lançamento permitido | Atendido | `expense-form.component.ts:66`; `expense-budget.spec.ts`; testes API de orçamento ausente ou zerado, sem teto artificial. |
| CA5 | Salvar e alertar ao atingir ou ultrapassar teto positivo | **Atendido — AF-01 resolvido** | `expense-form.component.ts:49`, `:115`, `:284`; `expense-form.component.html:14`; `expense-flow.spec.ts:278`, `:318`; agregado permanece na API, incluindo despesas ativas pagas e pendentes. |
| CA6 | Falha preserva registros, tag persistente, reabertura e reenvio sem duplicação | Atendido | `ExpenseReceiptService.java:30`, `:42`; `expense-detail.component.ts:52`; teste `retryPersistsPendingAcrossRequestsWithoutDuplicatingFinancialRecords`; fluxo Angular cobre reabertura, tag e reenvio. |
| CA7 | Isolamento por proprietário e recusa de recursos excluídos | Atendido | `ExpenseService.java:36`, `:60`; `ExpenseRepository.java:15`; `ExpenseReceiptService.java:61`; testes de fornecedor/obra alheios e recusa de leitura/upload antes do acesso ao storage. |
| CA8 | Arquivos inválidos recusados na interface e API | Atendido | `apps/web/src/app/core/services/expense.service.ts:14`; `ExpenseReceiptService.java:35`; testes cobrem MIME/extensão, arquivo vazio, tamanho exato e excesso de tamanho. |
| CA9 | Vencimento anterior à despesa impede gravação | Atendido | `ExpenseService.java:41`; validadores em `expense-form.component.ts:160`; teste `rejectsInvalidDueDateWithoutAnyPartialWrites` e validações Angular. |
| CA10 | Campos e valores obrigatórios por modo; fornecedor existente/inline; CNPJ opcional | Atendido | `ExpenseCreateDTO.java:8`; `ExpenseService.java:46`, `:58`; `expense-form.component.ts:160`, `:197`; testes de CNPJ ausente, inválido, normalização e máscara. |
| CA11 | Cancelamento, fechamento e troca de obra sem contaminação | Atendido | `apps/web/src/app/core/services/active-project.service.ts:61`; `expense-form.component.ts:97`, `:258`; `expense-context.spec.ts` cobre cancelamento, destruição, respostas atrasadas e A → B → A. |

O AF-01 foi resolvido: após a confirmação financeira, a consulta do agregado inicia independentemente do upload. O formulário apresenta simultaneamente o alerta de teto e a mensagem de falha do comprovante. Respostas antigas de orçamento, inclusive erros da mesma obra, são descartadas pelo contador de consultas; a proteção por versão do contexto permanece.

Os testes adicionais cobrem 100%, ultrapassagem, percentual arredondado sem estouro real, falhas de rede/503/504, inversões de respostas da mesma obra e troca A → B → A.

## Pendências que bloqueiam o PR

Nenhuma identificada.

A correção mantém o lançamento permitido, sem desfazer registros financeiros ou repetir sua criação. Idempotência e recuperação após sessão expirada continuam fora do escopo autorizado.

## Validação

Resultados atuais sobre `caef752`, **executados pelo agente principal** com permissão de acesso ao ambiente:

- **Web:** suíte inteira com **274 testes aprovados**, código de saída 0.
- **API:** suíte inteira com **179 testes, zero falhas, zero erros e zero ignorados; BUILD SUCCESS**.
- **Build web:** aprovado, código de saída 0; permanece o aviso de bundle inicial de **622,29 kB** frente ao orçamento de 500 kB.

Não repeti as execuções no sandbox, conforme despacho e bloqueios anteriores documentados. Nenhum arquivo foi alterado pelo auditor.

O banco isolado de testes mantém histórico Flyway V10, superior à última migration disponível no código, V9; a execução informou esse aviso e passou. Esse histórico residual não foi apagado nem modificado nesta auditoria.

## Documentação

- **`docs/prd.md`:** US03 está 🟢 Live, com ressalva de integração pendente e sem indicar implantação em produção. Critérios e decisões de escopo permanecem coerentes.
- **`docs/architecture.md`:** entidades, persistência V8/V9, estados dos comprovantes, contratos, armazenamento privado e isolamento de contexto acompanham a implementação. A correção AF-01 não introduziu novo estado, entidade ou contrato.
- **Nota editorial não bloqueante:** `architecture.md:264` e `prd.md:111` ainda descrevem a entrega até a tarefa 8; a spec e o índice esclarecem que esse é o recorte original, seguido da nova tarefa 9 de correção.
- **`specs/README.md`:** registra fechamento documental, correção AF-01 e aprovação da nova tarefa 9, preservando a retirada das funcionalidades anteriores.
- **Premissas:** “Assume que” permanece vazio; não há nova dívida declarada exigindo `TODO #issue`.
- **Escopo:** US07 e gestão de obras herdadas permanecem dependências expressamente autorizadas. Essa composição deve ficar visível no PR para `develop`; não foi exigida sua remoção ou reimplementação.
- **Limitações externas:** vínculo remoto da Issue não confirmado, diante do 404 informado pelo agente principal. A integração ao vivo com o projeto Supabase não foi comprovada por esta auditoria; os testes usam armazenamento controlado e HTTP local. Essas limitações permanecem documentadas. Nenhuma Issue ou PR foi criado.

## Matéria-prima para a seção “O que este PR faz e por quê”

- Cadastro de despesas quitadas ou pendentes, com total direto ou cálculo validado no servidor.
- Gravação atômica do compromisso pendente e inclusão no gasto da categoria.
- Seleção de fornecedor próprio ou criação inline com CNPJ opcional.
- Comprovantes privados com consulta, tag persistente e reenvio sem repetir registros financeiros.
- Alertas de orçamento independentes da falha de upload, protegidos contra respostas antigas e troca de obra.
