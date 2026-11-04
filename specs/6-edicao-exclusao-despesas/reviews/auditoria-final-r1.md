# Auditoria Final — Issue #6

**Veredito:** PRONTO PARA PR

Auditoria somente leitura da spec original aprovada contra `git diff origin/develop...HEAD`, incluindo API, migration, frontend, testes e documentação. O `plan.md` não foi usado como régua.

## Critérios de aceite da spec

Nas referências abaixo, `api/` corresponde a `apps/api/src/` e `web/` a `apps/web/src/app/`.

| # | Critério | Situação | Evidência (arquivo:linha / teste) |
| --- | --- | --- | --- |
| CA1 | Edição preenchida, atualização da mesma despesa e obra imutável | Atendido | `web/features/expenses/components/expense-edit-modal/expense-edit-modal.component.ts:52`; template `:7`; `api/main/java/com/obracerta/service/ExpenseService.java:148`. `updatesSameRowAndReclassifiesAggregateWithoutChangingCeilingsOrProtectedFields` verifica identidade, obra, fornecedor e campos protegidos. |
| CA2 | Recálculo, reclassificação e alerta sem aumentar teto | Atendido | `ExpenseService.java:169`; `ExpenseRepository.java:19`; `BudgetService.java:193`; `web/features/expenses/expense-detail.component.ts:247`. Integração verifica saída da categoria anterior, entrada na nova e preservação dos tetos; `expense-edit.spec.ts:100` verifica alerta após salvar. |
| CA3 | Transições de pagamento atômicas e compromisso reutilizado | Atendido | `ExpenseService.java:147`, `:176`; `V10__add_payment_status_and_paid_at.sql:1`. `ExpensePaymentUpdateIntegrationTest` cobre criação somente quando ausente, reutilização do identificador, vencimento, quitação, preservação de `paidAt`, legado nulo e rejeição sem gravação parcial. |
| CA4 | Remoção física antes da retirada do vínculo; falhas e repetição manual | Atendido | `ExpenseReceiptService.java:93`; `S3ReceiptStorage.java:69`; `expense-detail.component.ts:323`. `ExpenseReceiptRemovalIntegrationTest` verifica arquivo ausente, storage indisponível e falha de banco após remoção física seguida de tentativa manual. Dados financeiros permanecem preservados. |
| CA5 | Substituição confirma upload e associação antes de apagar antigo | Atendido | `ExpenseReceiptService.java:38`, `:57`, `:70`. `ExpenseReceiptReplacementIntegrationTest` verifica commit por conexão independente, chaves distintas, formatos e limite exato de 10 MiB, preservação do antigo, falha de associação e tentativa única de apagar o novo sem vínculo. Frontend apresenta os avisos em `expense-detail.component.ts:285`. |
| CA6 | Confirmação, exclusão lógica financeira e tratamento separado do arquivo | Atendido | `ExpenseService.java:72`; `expense-detail.component.ts:202`. `ExpenseDeletionIntegrationTest` verifica preservação das linhas e histórico, pagamentos inativos, agregados sem gasto, teto intacto, commit anterior ao storage, rollback financeiro e bloqueio das operações após exclusão. `expense-delete.spec.ts:38` verifica confirmação e resultado visual. |
| CA7 | Cancelar, X, Escape, backdrop e bloqueio de duplo envio | Atendido | Modal de edição `:108`, `:110`, template `:51`; `expense-detail.component.ts:207`; `ConfirmModalComponent.java` não existe: o componente compartilhado correto é `web/shared/components/confirm-modal/confirm-modal.component.ts:31`. `expense-edit.spec.ts:243` e `expense-delete.spec.ts:55` cobrem abandono sem mutação, backdrop inerte e confirmação repetida. |
| CA8 | 401 antes de alterações; logout/login sem retomada automática | Atendido | `ExpenseMutationAuthenticationIntegrationTest.java:103` cobre quatro mutações com JWT ausente, inválido e expirado, verificando banco e ausência de acesso ao storage. `web/features/expenses/expense-mutation-auth.spec.ts:73` verifica interceptor e logout reais, limpeza de token/obra, navegação e ausência de reenvio após novo token. |
| CA9 | Isolamento, obrigatoriedade, limites e ausência de gravação parcial | Atendido | `ExpenseRepository.java:15`; `ExpenseService.java:149`, `:206`; `ExpenseReceiptService.java:106`; validadores do modal `:77`, `:84`, `:130`. Matrizes de integração cobrem recursos alheios, inexistentes e excluídos, obra excluída, limites monetários e vencimento inválido sem alterações financeiras ou acesso indevido ao storage. |
| CA10 | Troca de contexto, respostas tardias, ausência de obra e falhas | Atendido | `expense-detail.component.ts:150`, `:176`, `:232`, `:260`; modal `:76`, `:124`. `expense-mutation-context.spec.ts` cobre A → B → A, respostas de sucesso/erro, ausência de obra e preservação ao atualizar metadados da mesma obra. Testes de edição preservam campos em falhas; testes de exclusão retiram dados após consulta 404 sem afirmar exclusão confirmada e impedem ressurreição por GET antigo. |

## Pendências que bloqueiam o PR

Nenhuma identificada.

As suítes completas foram executadas pelo orquestrador no estado final; conferi os logs reais e os XML correspondentes:

- **API:** 287 testes, zero falhas, erros ou ignorados; `BUILD SUCCESS` — `apps/api/target/us04-auditoria-final-backend.log:837` e `:840`. Os 33 relatórios da execução somam exatamente 287. Dois XML antigos, de idempotência/recuperação de sessão, não pertencem à execução final e foram desconsiderados.
- **Angular:** 344 sucessos — `apps/web/us04-auditoria-final-frontend.log:451`.
- **Build:** concluído — `apps/web/us04-layout-tipografia-r2-build.log:28`; permanece aviso de bundle inicial de **651,96 kB** para orçamento de 500 kB.
- `git diff --check` aponta espaços finais em Markdown, incluindo quebras de linha e pareceres históricos. É uma observação documental sem impacto nos critérios de aceite; os pareceres imutáveis foram preservados.

## Documentação

- **prd.md:** versão commitada coerente com a US04 entregue, status 🟢 Live explicitamente qualificado como implementação local, sem declarar implantação.
- **architecture.md:** acompanha V10, estados e quitação, atomicidade, DELETE com DTO/200, comprovantes, contexto e autenticação.
- **design-tokens.md:** registra a exceção aprovada de sessão expirada para US03/US04; os títulos corrigidos seguem os tokens.
- **specs/README.md:** identifica Issue #6 como implementada e distingue a numeração legada.
- **Assume que:** não há substitutos novos nem dívida que exija `TODO #issue`.
- **Escopo e abandono:** permanecem coerentes com a spec. Não entrou catálogo US15, listagem US05, infraestrutura de limpeza, recuperação persistente ou autenticação inline. As alterações locais de US15 não integram o diff auditado.
- **Histórico de revisão:** a retomada excepcional R3 da Tarefa 2 está explicitamente autorizada em `tarefa-02-decisoes-r2.md:10`, sem ocultar as rodadas anteriores nem generalizar a exceção. A pendência tipográfica foi resolvida e aprovada na R2.

## Matéria-prima para a seção “O que este PR faz e por quê”

- Edição pela consulta individual corrige dados e valores na mesma despesa, preservando a obra e recalculando os gastos por categoria.
- Transições entre paga e pendente reutilizam o compromisso financeiro e registram a quitação sem duplicar pagamentos.
- Remoção e substituição de comprovantes respeitam a ordem definida entre storage e banco e informam falhas sem prometer limpeza posterior.
- Exclusão confirmada preserva registros e histórico, inativa pagamentos e retira gastos dos agregados sem alterar tetos.
- Interface bloqueia duplo envio, abandona contextos antigos e permite conferir resultados incertos antes de tentar novamente.
