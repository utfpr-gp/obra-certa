# Plano — Issue #7

## Decisões técnicas

### Backend (`apps/api`)

- Criar `GET /api/expenses` como consulta autenticada e somente leitura. O endpoint recebe a obra ativa, página, tamanho, aba, filtros e ordenação como parâmetros tipados e devolve uma resposta com `content`, `page`, `size`, `totalElements`, `totalPages`, `referenceDate` e `totals`.
- O tamanho efetivo será limitado a 15 registros por página. A API validará página não negativa, tamanho permitido, aba, ordenação, datas, categorias e fornecedor. Intervalos invertidos e parâmetros desconhecidos serão rejeitados com erro de validação.
- A autorização será aplicada no service/repository pela posse da obra e pela exclusão lógica. Nenhuma entidade JPA será recebida pelo controller e nenhuma consulta de listagem acessará o armazenamento de comprovantes.
- A classificação de vencimento usará `Clock`/data de referência definida no backend. `PENDING` incluirá vencidas, `OVERDUE` exigirá vencimento anterior à referência e `PAID` usará a situação quitada persistida. Despesas pagas à vista serão incluídas sem depender de `PendingPayment`.
- Os totalizadores serão calculados sobre o conjunto completo após filtros e aba, antes da paginação. `totalGeneral` será igual a `totalPaid + totalPending`.
- Reutilizar fornecedores e categorias já autorizados para a conta do usuário. Não criar catálogo global nem novo status persistido.

### Migração de schema

- Nenhuma. A US03 já fornece os dados necessários de despesa, pagamento, categoria, fornecedor, obra e exclusão lógica.

### Frontend (`apps/web`)

- Reutilizar `/contas` como tela de listagem e manter o botão “Cadastrar conta”. Cada linha apontará para a consulta individual existente.
- Concentrar o contrato HTTP e os tipos em `core/services/expense.service.ts` e `core/models`, sem chamadas HTTP nos componentes.
- Manter no componente sinais separados para obra, aba, filtros, ordenação, página, carregamento, erro e resposta atual. Toda mudança de aba, filtro ou ordenação retornará à primeira página.
- Usar uma identidade/geração de consulta para ignorar respostas antigas após troca de obra ou contexto, inclusive no ciclo A → B → A. O interceptor existente continuará responsável por 401.
- Usar os pipes e tokens visuais existentes para datas e moeda, com layout responsivo sem dados demonstrativos.

## Tarefas

- [ ] **Tarefa 1 — Consultar despesas paginadas da obra**
  - Cobre: CA1 e CA8.
  - Teste primeiro: JUnit de integração para consulta por obra própria, exclusão lógica, paginação de até 15 registros, despesa paga sem pagamento pendente e 404 para obra inexistente, excluída ou alheia; `.spec.ts` Angular para renderizar os campos, paginação, link da consulta individual e botão “Cadastrar conta”.
  - Migration: nenhuma.
  - Arquivos previstos: DTOs, repository, service, mapper e controller de despesas em `apps/api`; testes de integração; modelo e service HTTP de despesas, componente/HTML da listagem, rota e testes em `apps/web`.

- [ ] **Tarefa 2 — Classificar a situação nas quatro abas**
  - Cobre: CA2.
  - Teste primeiro: JUnit para Todas, Pendentes, Vencidas e Pagas, incluindo vencimento nulo, vencimento na data de referência, vencimento anterior e despesas excluídas; `.spec.ts` para troca de aba, retorno à primeira página e disponibilidade das quatro abas em resultado vazio.
  - Migration: nenhuma.
  - Arquivos previstos: enum/parâmetro de consulta, predicates/repository e service da API; estado de aba no componente e testes web.

- [ ] **Tarefa 3 — Calcular e apresentar totalizadores**
  - Cobre: CA3.
  - Teste primeiro: JUnit para totais de todas as páginas, combinações com abas e valores pagos/pendentes; `.spec.ts` para cards em moeda brasileira, soma de Total Geral e estabilidade dos totais ao mudar somente a página.
  - Migration: nenhuma.
  - Arquivos previstos: projeção/agregação do repository ou service, DTO de resumo e mapper na API; modelo, cards/templates e testes web.

- [ ] **Tarefa 4 — Aplicar filtros combinados e validar intervalos**
  - Cobre: CA4 e CA7.
  - Teste primeiro: JUnit para períodos inclusivos, filtro de vencimento sem vencimento, múltiplas categorias, fornecedor autorizado, combinações, intervalos invertidos e parâmetros inválidos; `.spec.ts` para aplicar/limpar filtros, validação antes do HTTP, primeira página e preservação da aba.
  - Migration: nenhuma.
  - Arquivos previstos: parâmetros tipados, validação, queries e service da API; formulário de filtros, tipos, service HTTP e testes web.

- [ ] **Tarefa 5 — Ordenar antes de paginar**
  - Cobre: CA5.
  - Teste primeiro: JUnit para ordenação por compra e valor, desempate estável e interação com paginação; `.spec.ts` para ordenação inicial, troca de opção, retorno à primeira página e preservação de filtros/aba.
  - Migration: nenhuma.
  - Arquivos previstos: enum/validação de ordenação, `Sort`/query do repository e service da API; controle de ordenação, estado do componente e testes web.

- [ ] **Tarefa 6 — Tratar estados vazios e apresentação responsiva**
  - Cobre: CA6 e CA11.
  - Teste primeiro: `.spec.ts` para obra sem despesas, resultado vazio por aba/filtro, totais zerados, loading, erro visual, limpeza de filtros, abas utilizáveis e ações disponíveis em viewport mobile; testes de API serão mantidos para garantir que resposta vazia não seja erro.
  - Migration: nenhuma.
  - Arquivos previstos: templates, signals, estados vazios, componentes compartilhados e estilos/tokens existentes em `apps/web`, com ajustes mínimos no contrato de resposta da API se necessários.

- [ ] **Tarefa 7 — Preservar contexto, falhas e navegação**
  - Cobre: CA9 e CA10.
  - Teste primeiro: `.spec.ts` com requests controlados para troca de obra A → B → A, respostas antigas de sucesso/erro, mudança de aba/filtro/página, ausência de obra, retry, retorno do cadastro/consulta e 401; teste de integração da API confirma consulta somente leitura e isolamento.
  - Migration: nenhuma.
  - Arquivos previstos: integração com `ActiveProjectService`, geração de consulta, signals de erro/loading, navegação e service HTTP em `apps/web`; ajustes de leitura no controller/service da API e testes correspondentes.

## Critérios sem tarefa

-
