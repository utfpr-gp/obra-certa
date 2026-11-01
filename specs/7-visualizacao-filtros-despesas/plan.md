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

- [x] **Tarefa 1 — Consultar despesas paginadas da obra**
  - Rastreabilidade: implementação registrada no commit `e1cddbf`; os bloqueios remanescentes das duas rodadas continuam pendentes na Tarefa 8. Esta marca reconcilia o checklist com a entrega já registrada e não declara encerrados esses bloqueios.
  - Cobre: CA1 e CA8.
  - Teste primeiro: JUnit de integração para consulta por obra própria, exclusão lógica, paginação de até 15 registros, despesa paga sem pagamento pendente e 404 para obra inexistente, excluída ou alheia; `.spec.ts` Angular para renderizar os campos, paginação, link da consulta individual e botão “Cadastrar conta”.
  - Migration: nenhuma.
  - Arquivos previstos: DTOs, repository, service, mapper e controller de despesas em `apps/api`; testes de integração; modelo e service HTTP de despesas, componente/HTML da listagem, rota e testes em `apps/web`.

- [x] **Tarefa 2 — Classificar a situação nas quatro abas**
  - Rastreabilidade: implementação e pareceres em `749f317`; falhas de execução da retomada corrigidas e revisadas na Tarefa 9.
  - Cobre: CA2.
  - Teste primeiro: JUnit para Todas, Pendentes, Vencidas e Pagas, incluindo vencimento nulo, vencimento na data de referência, vencimento anterior e despesas excluídas; `.spec.ts` para troca de aba, retorno à primeira página e disponibilidade das quatro abas em resultado vazio.
  - Migration: nenhuma.
  - Arquivos previstos: enum/parâmetro de consulta, predicates/repository e service da API; estado de aba no componente e testes web.

- [x] **Tarefa 3 — Calcular e apresentar totalizadores**
  - Cobre: CA3.
  - Teste primeiro: JUnit para totais de todas as páginas, combinações com abas e valores pagos/pendentes; `.spec.ts` para cards em moeda brasileira, soma de Total Geral e estabilidade dos totais ao mudar somente a página.
  - Migration: nenhuma.
  - Arquivos previstos: projeção/agregação do repository ou service, DTO de resumo e mapper na API; modelo, cards/templates e testes web.

- [x] **Tarefa 4 — Aplicar filtros combinados e validar intervalos**
  - Cobre: CA4 e CA7.
  - Teste primeiro: JUnit para períodos inclusivos, filtro de vencimento sem vencimento, múltiplas categorias, fornecedor autorizado, combinações, intervalos invertidos e parâmetros inválidos; `.spec.ts` para aplicar/limpar filtros, validação antes do HTTP, primeira página e preservação da aba.
  - Migration: nenhuma.
  - Arquivos previstos: parâmetros tipados, validação, queries e service da API; formulário de filtros, tipos, service HTTP e testes web.

- [x] **Tarefa 5 — Ordenar antes de paginar**
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

- [ ] **Tarefa 8 — Consolidar correções que excederam duas rodadas de revisão**
  - Cobre: correções pendentes da Tarefa 1, sem criar novos critérios de aceite.
  - Origem: a Tarefa 1 atingiu o limite de duas rodadas de revisão com apontamentos bloqueantes em `tarefa-01-conformidade-r2.md` e `tarefa-01-codigo-r2.md`.
  - Entrega: ampliar os testes frontend para comprovar explicitamente data de compra, vencimento, valor e situação de pagamento; invalidar respostas antigas por identidade de consulta, incluindo troca A → B → A e consultas concorrentes da mesma obra, sem antecipar regras das tarefas posteriores.
  - Teste primeiro: `.spec.ts` com asserções para todos os campos exigidos pelo CA1 e cenários de respostas atrasadas A → B → A e paginação concorrente; manter os testes de integração existentes da Tarefa 1.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/features/expenses/accounts-page.component.ts`, `accounts-page.component.spec.ts` e, se necessário, os modelos/serviços diretamente envolvidos; não alterar backend nem introduzir filtros, abas, ordenação ou totalizadores.

- [x] **Tarefa 9 — Corrigir as falhas de validação na retomada das abas**
  - Cobre: CA2 e restauração da validação dos testes de listagem existentes, sem novos critérios de aceite.
  - Autorização: o autor solicitou “realize os ajustes” após receber as falhas registradas em `reviews/tarefa-02-validacao-retomada.md`.
  - Teste primeiro: reproduzir os três testes Angular falhando; corrigir os dados simulados para respeitar o contrato e provar o retorno à página inicial ao trocar aba, incluindo resposta atrasada. Executar o teste integrado de situação com a configuração de testes prevista no projeto.
  - Entrega: ajustar somente as causas demonstradas pelos testes. Investigar o H2/Flyway e utilizar a configuração existente apropriada; não editar migrations aplicadas, não alterar `ddl-auto` para `update`/`create` nem desativar validações como atalho. Problema estrutural que exija nova infraestrutura será relatado separadamente.
  - Migration: nenhuma.
  - Arquivos previstos: teste e componente `accounts-page` em `apps/web`; teste integrado de situação em `apps/api` somente se houver divergência do padrão de testes existente; registro da execução em `reviews/`.

- [ ] **Tarefa 10 — Consolidar correções da Tarefa 6 após o limite de revisão**
  - Autorização: o autor aprovou este encaminhamento e solicitou a correção: “Pode aprovar e corrigir”. Os pareceres da Tarefa 6 permanecem preservados; esta é a primeira rodada da Tarefa 10.
  - Cobre: correções de CA6 e CA11 que permaneceram bloqueantes após duas rodadas da Tarefa 6, sem alterar os critérios de aceite.
  - Origem: a Tarefa 6 atingiu o limite de duas rodadas com falhas na suíte frontend, cobertura insuficiente de viewport mobile e regressões nos testes existentes, registradas em `reviews/tarefa-06-conformidade-r2.md` e `reviews/tarefa-06-codigo-r2.md`.
  - Entrega: corrigir os testes e a implementação de estados vazios, carregamento, erro e responsividade; preservar a navegação e os comportamentos já entregues; manter a semântica acessível das abas; não antecipar retry, invalidação de respostas ou preservação de contexto da Tarefa 7.
  - Teste primeiro: reproduzir as 5 falhas da suíte `accounts-page.component.spec.ts`; adicionar cobertura verificável para viewport mobile, estados vazios, totais zerados, loading, erro, limpeza de filtros e abas; executar também a suíte frontend relacionada à navegação para confirmar ausência de regressões.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/features/expenses/accounts-page.component.ts`, `accounts-page.component.spec.ts` e estilos/arquivos diretamente relacionados, sem alterar backend, migrations, `spec.md` ou documentos de arquitetura.

## Critérios sem tarefa

-
