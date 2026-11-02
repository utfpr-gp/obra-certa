# Plano — Issue #8

Revisão de escopo solicitada em 02/11/2026: a tarefa 1 passa a validar toda a apresentação das tarefas 2–4 com dados fictícios. O autor autorizou a revisão com “Realize os ajustes”. Os pareceres do escopo anterior são preservados em `reviews/arquivo/2026-11-02/`; a nova implementação passa por seu próprio ciclo de revisão, sem sobrescrever o histórico.

## Decisões técnicas

### Backend (`apps/api`)

- A tarefa 1 não altera o backend: prepara a validação visual solicitada pelo autor e não conclui a US06.
- Na integração, `GET /api/projects/{projectId}/reports` retorna identificação da obra, totais orçado, realizado, pago e a pagar e consolidação por categoria. `GET /api/projects/{projectId}/reports/pdf` retorna `application/pdf` com nome de download.
- `ReportController` delega a `ReportService`; validar posse da obra pelo usuário autenticado antes de consultar dados, inclusive para obra vazia. Obra inexistente ou alheia retorna 404.
- Consultar somente despesas e orçamentos ativos; calcular valores financeiros com `BigDecimal`. Categorias sem orçamento participam da distribuição e dos totais, mas não do comparativo. Reutilizar vínculos e regras de quitação existentes.
- Decisões aprovadas: PDF consolidado por categoria e todo o histórico da obra, sem lista individual de despesas e sem restrição pelo filtro da tela; falha/interrupção oferece nova tentativa manual, sem geração ou download automático ao retornar ou trocar de contexto. Preservar essas decisões na tarefa 4.

### Migração de schema

- Nenhuma prevista: usar as entidades e colunas existentes. Mudança descoberta no planejamento detalhado precisa ser apresentada ao autor antes da implementação.

### Frontend (`apps/web`)

- Criar `features/reports/reports-page.component` na rota autenticada `/relatorios`, reutilizando `MainLayoutComponent` e o item já existente da sidebar.
- Signals locais para cenário demonstrativo, categoria selecionada, estados de consulta, prévia e exportação simulada. Estado derivado para indicadores, gráficos, resumo e detalhamento; nenhum dado financeiro em localStorage. Interações e mensagens de erro simuladas não alteram a autenticação real.
- Na tarefa 1, massa fictícia isolada e marcada com `TODO #8`, valores monetários em centavos e totais coerentes. Os valores da imagem são referência visual, não regras de cálculo.
- A massa inclui pago/a pagar, despesas excluídas e cenários de obra vazia, sem gastos, sem teto, misto, limite exato e excedente. Separar coleções de distribuição/comparativo/detalhamento; denominadores zerados e coleções vazias devem ter apresentação explícita. Uma única consolidação alimenta tela e prévia, respeitando o alcance aprovado da exportação.
- Prévia do documento em componente standalone de `features/reports`, com layout próprio responsivo, rótulo demonstrativo e navegação por teclado. Não adicionar biblioteca de PDF, endpoint, download ou arquivo gerado nesta etapa.
- Troca da obra ativa limpa estado demonstrativo e prévia, reutilizando `ActiveProjectService` somente para observar a mudança de contexto; o cabeçalho da demonstração não atribui dados fictícios à obra real.
- Rosca e barras com recursos nativos de HTML/CSS/SVG, legenda textual e valores acessíveis. Reutilizar ícones e tokens existentes. Desktop com duas áreas de gráficos; mobile em coluna, com detalhamento em cartões e controles de pelo menos 44px.
- Na integração, `core/services/report.service.ts` será o único ponto HTTP dos relatórios. Troca da obra ativa deve descartar dados anteriores e ignorar respostas atrasadas. Exibir estados de carregamento, erro com nova tentativa e ausência de obra.

## Tarefas

- [ ] **Tarefa 1 — Prototipar todos os estados visuais dos relatórios com dados fictícios**
  - Cobre: CA7–CA15 e a representação demonstrativa de CA1–CA6, sem comprovar as garantias de backend e download real. O autor solicita validar toda a interface antes da integração.
  - Teste primeiro: Jasmine/Karma em `apps/web`, preservando os testes existentes e acrescentando RED para seleção de cenários, carregamento, erro/nova tentativa, ausência de obra, obra não localizada e limpeza ao trocar de obra. Testar vazio, orçamento sem gastos, gastos sem orçamento, mistura, igualdade e excedente, sem NaN/Infinity/percentuais fictícios; despesa excluída ignorada; separação das coleções da rosca e barras; saldo verde/vermelho. Testar prévia com identificação/data/nome/totais/pago/a pagar/saldos, alcance da exportação aprovado, fechamento/foco, estado gerando sem duplicidade, falha/nova tentativa e descarte ao sair, sem HTTP/download/gravação. Os novos testes falham pela ausência dos cenários e da prévia no protótipo anterior.
  - Implementação: preservar a estrutura de título, período fixo, categoria, quatro indicadores, rosca, barras, resumo e detalhamento; completar as apresentações dos CA11–CA15. Adicionar seletor identificado de cenários demonstrativos e prévia de documento, sem controles de backend na interface final. Preparar os mesmos estados para os serviços reais das próximas tarefas, mantendo claro o que é simulação. Não alterar funcionalidades das demais telas.
  - Validação visual: desktop e 360px para cenário principal, vazio, sem orçamento, erros e prévia; sem sobreposição ou transbordamento, cartões no detalhamento mobile, foco/teclado e controles de pelo menos 44px. Verificar cada cenário, não apenas o cenário principal.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/features/reports/reports-page.component.{ts,html,css,spec.ts}`, `apps/web/src/app/features/reports/reports-demo.data.ts`, `apps/web/src/app/features/reports/report-preview.component.{ts,html,css,spec.ts}`, `apps/web/src/app/app.routes.ts`, `apps/web/src/app/app.routes.spec.ts`.

- [ ] **Tarefa 2 — Integrar a distribuição real de gastos da obra**
  - Cobre: CA1, CA5 e CA6 na consulta JSON, incluindo obra sem despesas na visualização de distribuição.
  - Teste primeiro: JUnit de serviço, repositório e controlador para agregação por categoria, exclusão lógica e 404 Anti-IDOR; Jasmine para substituir a massa fictícia, exibir legenda e totais reais e descartar respostas de obra anterior. Testar falha de rede com nova tentativa e retorno 401 pelo fluxo de autenticação existente.
  - Implementação: contrato de relatório, consulta autorizada e distribuição real de todas as categorias com despesas. Conectar os estados visuais validados na tarefa 1 aos resultados reais de carregamento, erro, ausência de obra, 404 e troca de contexto. Retirar massa/seletor de cenários e identificação demonstrativa do fluxo real após a validação visual.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/{controller/ReportController.java,service/ReportService.java,model/dto/report/,repository/ExpenseRepository.java,repository/BudgetRepository.java}`, testes correspondentes em `apps/api/src/test/`, `apps/web/src/app/core/{models/report.model.ts,services/report.service.ts,services/report.service.spec.ts}`, página de relatórios e seus testes.

- [ ] **Tarefa 3 — Integrar o comparativo orçado versus realizado**
  - Cobre: CA2 e parte visual de CA4; mantém CA5 e CA6 na consulta.
  - Teste primeiro: JUnit para categoria sem teto, orçamento sem gastos, igualdade no limite e excedente; Jasmine para barras na mesma escala, saldo positivo verde, excedente vermelho e exclusão de categorias sem orçamento do comparativo. Testar categorias com despesa sem teto continuando nos totais e na rosca.
  - Implementação: conectar o contrato aos componentes validados na tarefa 1 com orçamento, saldo e consumo por categoria reais, quatro indicadores e detalhamento. Obra sem movimentação preserva os orçamentos existentes e apresenta realizado zero; manter os estados visuais de ausência de gastos e de teto, sem percentuais inválidos.
  - Migration: nenhuma.
  - Arquivos previstos: serviço, DTOs e repositórios de relatórios da tarefa 2, testes JUnit correspondentes, modelo e página Angular de relatórios e seus testes.

- [ ] **Tarefa 4 — Exportar o relatório financeiro consolidado em PDF**
  - Cobre: CA3, exportação de CA4, CA5 e CA6 no download.
  - Pré-condição: seguir as decisões aprovadas sobre conteúdo, interrupção e alcance da exportação registradas nesta revisão da spec. Selecionar a biblioteca de PDF compatível com o backend antes do RED; não presumir dependência já instalada.
  - Teste primeiro: JUnit para conteúdo extraído do PDF, identificação, valores pago/a pagar, saldos, data determinística via Clock, nome do arquivo, obra vazia e 404 para obra alheia; Jasmine para download, prevenção de cliques duplicados, indicação de geração, falha com recuperação e descarte ao trocar de obra ou sair da página.
  - Implementação: produzir o PDF real seguindo o layout e os estados de exportação validados na tarefa 1 e o alcance aprovado pelo autor. Geração síncrona usando a mesma consolidação autorizada dos gráficos; consumir como Blob pelo service Angular, baixar com nome seguro e liberar a URL temporária. Conectar geração/erro/nova tentativa/limpeza de contexto à execução real e não emitir novo pedido automaticamente ao retornar à tela.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/pom.xml`, controlador e serviço de relatórios, serviço gerador de PDF, testes JUnit correspondentes, service e página Angular de relatórios e seus testes.

## Critérios sem tarefa
