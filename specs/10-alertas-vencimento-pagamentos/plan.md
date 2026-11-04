# Plano — Issue #10

## Decisões técnicas

### Backend (`apps/api`)

- `GET /api/projects/{projectId}/payment-alerts` → 200 com `projectId`, `referenceDate`, `count`, `totalAmount` e `items`. Cada item contém `expenseId`, `description`, `purchaseDate`, `dueDate`, `totalPrice` e `urgency` (`OVERDUE`, `DUE_SOON`, `REGULAR`). A consulta retorna todo o horizonte, sem paginação nem truncamento silencioso. Quantidade, soma e itens derivam do mesmo conjunto, com BigDecimal e uma referenceDate UTC obtida de Clock.
- `PUT /api/projects/{projectId}/expenses/{expenseId}/payment` recebe `PaymentSettlementRequestDTO` com `paymentDate` obrigatório, LocalDate ISO, e retorna 200 com `ExpenseResponseDTO`. A operação autoriza obra e vínculo da despesa, verifica exclusão lógica e executa a transição na mesma transação. Não recebe o DTO completo de edição. Campo ausente, nulo ou malformado retorna 400; data anterior à compra retorna 400 na transição pendente → paga. Para recurso já pago, retorna o estado original sem sobrescrever paidAt.
- Serializar quitações concorrentes por bloqueio pessimista da despesa, usando sempre a mesma ordem de acesso antes de ler/alterar o pagamento. O teste com PostgreSQL deve demonstrar que a segunda requisição observa a primeira data confirmada. Não alterar o fluxo de edição completa da US04.
- Reutilizar `GET /api/expenses/{id}` para reconciliar resultado incerto, conferindo também o projectId no cliente. Recurso indisponível retorna 404, sem afirmar quitação.
- Controladores magros, DTOs records e serviço de pagamentos dedicado. Repositories filtram proprietário, obra e exclusões; autenticação mantém o tratamento existente de 401. Data civil é convertida para início do dia UTC em paidAt, preservando o schema existente.

### Migração de schema

- Nenhuma prevista: paid, status e paid_at já existem. Não editar migrations aplicadas nem ddl-auto=validate. Se a inspeção durante a implementação revelar necessidade de schema adicional, devolver a descoberta ao autor antes de mudar este plano.

### Frontend (`apps/web`)

- Alterar a Home real em `features/home-page/` e a listagem em `features/expenses/accounts-page.component.ts`; manter rotas e layout geral. Apenas os dados do painel de pagamentos passam a usar a consulta real desta história.
- Criar `core/services/payment.service.ts` para alertas, quitação e reconciliação via ExpenseService; contratos em `core/models/payment.model.ts`. Componentes não acessam HttpClient diretamente.
- Criar modal compartilhado em `shared/components/payment-modal/`, com formulário reativo, identificação/valor da conta, data sugerida max(referenceDate UTC, purchaseDate), validação, Confirmar/Cancelar, X e Escape. Backdrop inerte; durante envio, impedir fechamento e duplicação. Gerenciar foco de entrada e retorno ao acionador, conforme os componentes existentes e tokens do projeto.
- Estado de consulta pertence à tela; estado de quitação/reconciliação pertence ao fluxo compartilhado do modal. Signals distinguem carregamento, vazio, erro, envio, resultado incerto e sucesso com falha de atualização. Usar timeout HTTP finito de 30 segundos nas operações desta história, sem retry automático, preservando a propagação de 401 ao interceptor.
- Usar versão de contexto por troca de obra, inclusive A → B → A, e versão de consulta para ignorar respostas antigas. Destruir/invalidar o modal ao trocar obra. Sucesso provoca nova consulta; falha nessa consulta não desfaz nem esconde a confirmação financeira. A data civil de quitação deve aparecer sem conversão para o dia anterior em fusos negativos.

## Tarefas

- [x] **Tarefa 1 — Exibir alertas reais na Home**
  - Cobre: CA1, CA2 e CA6 na leitura; CA8 na falha de consulta; CA9 na consulta e troca de contexto.
  - Teste primeiro: JUnit de serviço com Clock fixo e integração HTTP/repositório com PostgreSQL para vencidas, hoje, +3, +4, +7, +8, pagas, sem vencimento, exclusões e Anti-IDOR; provar soma, desempate e limites. Specs Angular da Home e serviço HTTP devem inicialmente falhar por ausência do painel real e provar banner, urgência com texto/cor, vazio, erro/repetição manual, ausência de obra, timeout e resposta antiga em A → B → A. Incluir 401 com o interceptor existente.
  - Entrega: GET completo até PostgreSQL e consumo real na Home, sem implementar quitação nesta etapa.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/{controller/PaymentController.java,service/PaymentService.java,repository/ExpenseRepository.java,model/dto/payment/}`; testes JUnit correspondentes em `apps/api/src/test/java/com/obracerta/`; `apps/web/src/app/core/{models/payment.model.ts,services/payment.service.ts,services/payment.service.spec.ts}`; `apps/web/src/app/features/home-page/home-page.{ts,html,css,spec.ts}`.

- [x] **Tarefa 2 — Preparar a quitação transacional na API**
  - Cobre: CA4 e CA6 na escrita; validação de API do CA3. Passo técnico que destrava as tarefas 3 e 4; isoladamente não prova o modal nas duas telas.
  - Teste primeiro: JUnit de serviço/controlador para data obrigatória, formato inválido, anterior à compra, igual à compra e futura, conversão UTC, preservação dos demais campos e transação sem gravação parcial. Integração com PostgreSQL para status da despesa/pagamento, histórico, repetições sequenciais e concorrentes com datas diferentes, Anti-IDOR, vínculo cruzado de obra, exclusões e 401. Provar que a primeira data confirmada permanece; não substituir o teste concorrente por mocks.
  - Entrega: PUT de quitação dedicado, autorização anterior à idempotência, bloqueio e retorno do estado persistido, sem alterar a edição da US04.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/{controller/PaymentController.java,service/PaymentService.java,repository/ExpenseRepository.java,repository/PendingPaymentRepository.java,model/dto/payment/PaymentSettlementRequestDTO.java}`; testes em `apps/api/src/test/java/com/obracerta/{service,controller,repository}/`.

- [x] **Tarefa 3 — Quitar contas pelo modal da Home**
  - Cobre: CA3 na Home, CA5 na Home, CA7, CA8 no envio/reconciliação e CA9 no modal/envio; integra CA4 à interface. CA3 e CA5 nas duas telas ficam completos na tarefa 4.
  - Teste primeiro: specs do modal, serviço HTTP e Home para abertura, data sugerida, datas inválidas/iguais/futuras, confirmação pelo PUT real contratado, apresentação da data UTC, cancelamento/X/Escape/backdrop, bloqueio de duplicação/fechamento, atualização de alertas e total, falha de atualização após sucesso, timeout e reconciliação antes de nova tentativa manual. Cobrir GET pago/pendente/404/erro, 401 sem restauração e troca A → B → A durante envio. Testar os estados usando respostas HTTP controladas; verificar no JUnit o contrato consumido, reaproveitando os testes da tarefa 2.
  - Entrega: modal compartilhado conectado à API e ação rápida funcional na Home, preservando os demais dados do painel.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/shared/components/payment-modal/`; `apps/web/src/app/core/{services/payment.service.ts,services/payment.service.spec.ts,models/payment.model.ts}`; `apps/web/src/app/features/home-page/home-page.{ts,html,spec.ts}`; ajuste de apresentação de paidAt e seu teste no componente que já o exibe, se necessário para CA4.

- [x] **Tarefa 4 — Quitar contas em Contas a Pagar**
  - Cobre: conclusão de CA3 e CA5 nas duas telas; CA7, CA8 e CA9 aplicados à listagem. Reutiliza CA4 e CA6, sem duplicar regras de pagamento.
  - Teste primeiro: specs da listagem para botão apenas em pendentes, integração do mesmo modal, confirmação HTTP, filtros/ordenação preservados, abas Todas/Pendentes/Vencidas/Pagas, totais atualizados, ajuste de página após sair a última linha, data sem deslocamento de fuso e falha ao recarregar após sucesso. Cobrir cancelamento, recuperação de resultado incerto, ausência/troca de obra, respostas fora de ordem e sessão expirada. Reexecutar testes HTTP/JUnit da quitação e da consulta paginada para garantir que o estado persistido produz os recortes esperados.
  - Entrega: ação funcional desktop/mobile em Contas a Pagar consumindo a mesma API/modal da Home; retorno à Home consulta os dados atuais.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/features/expenses/accounts-page.component.ts` e specs de listagem correspondentes; `apps/web/src/app/shared/components/payment-modal/` somente se a integração exigir ajuste; `apps/api/src/test/java/com/obracerta/controller/` para validação integrada de quitação seguida de listagem.

- [x] **Tarefa 5 — Consolidar os ajustes de manutenção da listagem de Contas a Pagar**
  - Cobre: refinamentos de manutenção apontados na revisão de código da Tarefa 4; preserva CA5 e CA8. Não altera regras financeiras, contrato HTTP, modal compartilhado nem fluxo da Home.
  - Teste primeiro: specs da listagem dirigidas pelos controles visíveis para filtros, ordenação, abas e paginação. Permitir eventos DOM sintéticos (`input`, `change` e `toggle`) despachados nos elementos reais do template para acionar os bindings Angular; esses eventos não equivalem a interação física do usuário. Manter proibidas chamadas diretas a handlers ou métodos internos do componente, inclusive `selectTab`, `selectSort` e `loadPage`, eventos passados diretamente a esses métodos e casts usados para contornar os contratos de eventos. Preparar a página pelos controles de paginação e selecionar abas pelos botões visíveis. Incluir spec garantindo que, após uma quitação e recarga bem-sucedidas, abrir a quitação de outra conta não mantém um aviso anterior como se pertencesse à operação atual. Reexecutar os cenários de filtros/ordenação, falha de recarga pós-quitação e erro comum de consulta.
  - Implementação: substituir parâmetros posicionais ambíguos de `loadPage` por opções nomeadas ou método privado específico, preservando o comportamento de consulta e ajuste de página; tornar explícito o ciclo de vida do aviso de quitação ao iniciar outra operação; manter os testes desacoplados dos métodos internos e interagir pelos controles visíveis. Usar a infraestrutura Jasmine/Karma existente, sem adicionar harness ou dependências. A revisão deste critério não apaga os pareceres nem reinicia os contadores de rodadas já registrados.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/features/expenses/accounts-page.component.ts` e `apps/web/src/app/features/expenses/accounts-page.component.spec.ts`.

## Critérios sem tarefa
