# Plano — Issue #48

## Decisões técnicas

### Backend (`apps/api`)

- `GET /api/budgets/{projectId}/sinapi/references?uf={uf}&month={AAAA-MM}&projectType={id}` retorna `200 OK` com os acabamentos disponíveis, seus custos decimais em R$/m² e a fonte SIDRA/IBGE. Consulta a tabela 647, variável 51, com a classificação 314 para projeto e 41 para acabamento. Valida UF, mês e um dos oito projetos do PRD. Uma consulta válida sem combinações retorna lista vazia. Falha ou tempo limite do provedor retorna erro temporário e permite repetir a consulta.
- `POST /api/budgets/{projectId}/sinapi/confirm` recebe UF, mês, projeto de referência, acabamento, área positiva, custo unitário exibido e percentuais por ID de categoria. Valida valores decimais, categorias únicas, percentuais não negativos e soma igual a 100%. Reconsulta o custo antes de abrir a transação. Se o custo mudou, retorna `409 Conflict` e solicita nova prévia. Com um custo válido e igual ao da prévia, recalcula o total e o rateio e retorna `200 OK` com as categorias criadas e preservadas.
- O servidor valida a titularidade da obra antes de consultar o SIDRA ou gravar tetos, seguindo o contrato de obra inexistente da API de orçamento. O backend mapeia a UF para o código do IBGE e usa um cliente HTTP com destino fixo e tempo limite.
- Arredondar o total monetário para centavos com `HALF_UP`. Distribuir os centavos restantes pelas maiores frações de centavo, com desempate pela ordem estável das categorias no PRD. Aplicar a mesma regra no frontend e no backend, com valores decimais exatos e casos de teste equivalentes.
- Gravar o lote em uma transação usando inserção condicionada à ausência de orçamento ativo, apoiada no índice único parcial por obra e categoria. Um conflito nesse índice preserva o teto vencedor, inclusive se estiver zerado. Outras falhas revertem o lote. Reutilizar o modelo `Budget` e as categorias existentes.
- Usar os dados do SIDRA temporariamente. As respostas do fluxo recebem `Cache-Control: no-store`. Parâmetros, custo unitário, resposta externa e memória de cálculo ficam fora de banco, cache persistente e logs, inclusive dos logs de requisição. A confirmação persiste somente os tetos.

### Migração de schema

- Nenhuma. O lote usa a tabela `budgets` e o índice único parcial já existente.

### Frontend (`apps/web`)

- Abrir o formulário SINAPI a partir de **Adicionar orçamento** na página de Orçamentos. O formulário agrupa os oito projetos conforme o PRD, oferece os acabamentos disponíveis e exibe fonte, custo por m², estimativa e prévia por categoria. Reutiliza as categorias da página e `hasBudget` para identificar tetos ativos, inclusive zerados.
- O formulário mantém a seleção, a prévia e o rateio editável em memória, com signals. Mudança de seleção, troca de obra ou fechamento invalida a consulta anterior. O `BudgetService` em `core/services/` intermedeia o HTTP. Após confirmar, a página recarrega os tetos da obra.
- A tarefa 1 entrega a tela para revisão com um provedor de exemplo restrito a testes e à demonstração local. A demonstração permite conferir o formulário e o rateio sem chamar a API nem gravar tetos. A tarefa 2 conecta a consulta real e encerra o uso do provedor de exemplo no fluxo normal.

## Tarefas

- [x] **Tarefa 1 — Apresentar o formulário SINAPI**
  - Cobre: passo técnico de revisão visual. Os critérios que dependem da API são fechados nas tarefas seguintes.
  - Teste primeiro: em `apps/web`, abrir **Usar SINAPI** pelo modal de orçamento, exercitar a seleção agrupada e a prévia com dados de exemplo e verificar que fechar descarta os ajustes. Conferir os estados inicial, carregando, sem acabamento e com prévia em viewport móvel e desktop.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/features/budgets-page/` e seus testes de componente.

- [x] **Tarefa 2 — Consultar referências do SIDRA**
  - Cobre: CA1, CA5 e CA7.
  - Teste primeiro: em `apps/api`, validar parâmetros, titularidade, leitura das dimensões e custos positivos, ausência de combinações e timeout. Em `apps/web`, provar que a seleção consulta o serviço, que o custo aparece na prévia e que respostas atrasadas de uma seleção anterior ficam fora da tela. Cobrir erro e nova tentativa.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/controller/BudgetController.java`, cliente SIDRA, records e testes JUnit. `apps/web/src/app/core/services/budget.service.ts`, formulário SINAPI e testes.

- [x] **Tarefa 3 — Corrigir o timeout da consulta SINAPI no front**
  - Cobre: CA5 (tempo limite da consulta na interface). Corrige o apontamento aceito na rodada 2 da tarefa 2 (`reviews/tarefa-02-codigo-r2.md`). Ao concluir, marcar também a tarefa 2 como feita.
  - Teste primeiro: em `apps/web`, provar em `budget.service.spec.ts` que uma consulta sem resposta vira erro após 15 s, e no formulário SINAPI que o tempo limite exibe o estado de erro com nova tentativa. Trocar a opção `timeout` do `HttpClient` por `.pipe(timeout(15000))`, como em `payment.service.ts`.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/core/services/budget.service.ts` e `budget.service.spec.ts`; `budget-form-modal.component.spec.ts` se necessário.

- [x] **Tarefa 4 — Calcular o rateio editável**
  - Cobre: CA2 e CA6.
  - Teste primeiro: em `apps/web`, verificar os percentuais do PRD para qualquer modelo, edição, soma de 100%, desempate e conservação dos centavos, além de cancelamento e reabertura. Em `apps/api`, testar a mesma regra de cálculo com os mesmos casos de centavos e percentuais inválidos.
  - Migration: nenhuma.
  - Arquivos previstos: formulário SINAPI e seus testes em `apps/web/src/app/features/budgets-page/`, cálculo de rateio e testes JUnit em `apps/api`.

- [x] **Tarefa 5 — Confirmar os novos tetos**
  - Cobre: CA3 e CA4.
  - Teste primeiro: em `apps/api`, testar custo alterado desde a prévia, obra alheia, teto ativo com valor zero, parcela zero, repetição, concorrência real no PostgreSQL e rollback após falha durante o lote. Em `apps/web`, conferir os tetos marcados como preservados, enviar a confirmação e recarregar o painel após sucesso.
  - Decisões do autor: a confirmação responde `200 OK`; o servidor valida que a ordem das categorias recebida é a do PRD e recusa com `400` se não for; custo unitário negativo é recusado com `400` antes de chegar ao banco.
  - Migration: nenhuma.
  - Arquivos previstos: `BudgetController.java`, `BudgetService.java`, `BudgetRepository.java`, records e testes JUnit. `budget.service.ts`, página de Orçamentos, formulário SINAPI e testes.

- [x] **Tarefa 6 — Verificar o descarte dos dados da consulta**
  - Cobre: CA8.
  - Teste primeiro: em `apps/api`, confirmar `no-store` nas respostas do fluxo e verificar, após consulta, confirmação e erro, que o banco contém somente os novos tetos e que os logs excluem os dados da consulta. Em `apps/web`, verificar que os dados deixam de existir no estado do formulário ao fechá-lo e ficam fora do armazenamento persistente do navegador.
  - Migration: nenhuma.
  - Arquivos previstos: testes dos endpoints SINAPI, configuração de logs do fluxo se necessária e testes do formulário.

- [x] **Tarefa 7 — Preservar a confirmação SINAPI ao tentar trocar de aba**
  - Cobre: pendência do CA4 registrada na Tarefa 5. A Tarefa 5 pode ser fechada após a verificação desta correção.
  - Teste primeiro: em `apps/web`, manter a confirmação pendente com uma resposta controlada e tentar mudar para **Orçamento padrão** por clique e teclado. Verificar que a aba SINAPI segue ativa e que a resposta de sucesso recarrega o painel uma vez. Em caso de erro, verificar que a mensagem fica visível e que a troca de aba volta a funcionar.
  - Migration: nenhuma.
  - Arquivos previstos: `budget-form-modal.component.ts`, `budget-form-modal.component.html` e testes do modal e da página de Orçamentos.

- [x] **Tarefa 8 — Desabilitar meses e projetos sem referência SINAPI**
  - Cobre: extensão da disponibilidade prevista no CA7, solicitada pelo autor. Para a UF selecionada, desabilitar os meses em que nenhum dos oito projetos tem preço positivo. Para um mês disponível, desabilitar cada projeto que não tenha pelo menos um acabamento com preço positivo.
  - Contrato: consulta de disponibilidade por obra, UF e ano. A API valida a titularidade e consulta os oito projetos da tabela 647 em lote, agrupando os resultados por mês e projeto. A consulta existente fornece os preços dos acabamentos após a seleção do projeto. A disponibilidade é consultada sob demanda e mantida em memória durante o fluxo.
  - Interface: permitir a seleção de ano e exibir os meses em uma lista com opções desabilitáveis. Identificar as opções sem dados como indisponíveis. Ao trocar UF, ano ou mês, limpar as seleções dependentes e a prévia anterior. Em caso de falha, informar o erro e permitir nova tentativa.
  - Teste primeiro: em `apps/api`, verificar que uma resposta com um mês sem linhas e outro com preços apenas para parte dos projetos retorna o mapa correto. Cobrir titularidade e falha do SIDRA. Em `apps/web`, verificar que novembro sem preços fica desabilitado, que um projeto sem preço fica desabilitado em mês disponível e que uma resposta antiga não altera a seleção atual. Exercitar nova tentativa após falha.
  - Migration: nenhuma.
  - Arquivos previstos: `BudgetController.java`, `SinapiReferenceService.java`, `SidraClient.java`, DTO e testes da API. Modelo e serviço de Orçamentos, formulário SINAPI e testes Angular.

## Critérios sem tarefa
