# Plano — Issue #8

## Decisões técnicas

### Backend (`apps/api`)

- A tarefa 1 não altera o backend: prepara a validação visual solicitada pelo autor e não conclui a US06.
- Na integração, `GET /api/projects/{projectId}/reports` retorna identificação da obra, totais orçado, realizado, pago e a pagar e consolidação por categoria. `GET /api/projects/{projectId}/reports/pdf` retorna `application/pdf` com nome de download.
- `ReportController` delega a `ReportService`; validar posse da obra pelo usuário autenticado antes de consultar dados, inclusive para obra vazia. Obra inexistente ou alheia retorna 404.
- Consultar somente despesas e orçamentos ativos; calcular valores financeiros com `BigDecimal`. Categorias sem orçamento participam da distribuição e dos totais, mas não do comparativo. Reutilizar vínculos e regras de quitação existentes.
- O PDF reúne o consolidado por categoria e a lista individual de despesas ativas em um único arquivo. Em falha, a tela apresenta somente uma mensagem de erro, sem retry automático ou ação específica de tentar novamente.
- Usar Apache PDFBox 3.0.8 (`org.apache.pdfbox:pdfbox`) para geração e extração de texto nos testes. A dependência ainda não existe no `pom.xml` e será adicionada na tarefa 4; validar sua execução no Java 21 do projeto. Referências oficiais: https://pdfbox.apache.org/download.html e https://pdfbox.apache.org/3.0/migration.html.

### Migração de schema

- Nenhuma prevista: usar as entidades e colunas existentes. Mudança descoberta no planejamento detalhado precisa ser apresentada ao autor antes da implementação.

### Frontend (`apps/web`)

- Criar `features/reports/reports-page.component` na rota autenticada `/relatorios`, reutilizando `MainLayoutComponent` e o item já existente da sidebar.
- Signals locais para categoria selecionada e aviso do PDF. Estado derivado para indicadores, gráficos, resumo e detalhamento; nenhum dado financeiro em localStorage.
- Na tarefa 1, massa fictícia isolada e marcada com `TODO #8`, valores monetários em centavos e totais coerentes. Os valores da imagem são referência visual, não regras de cálculo.
- Rosca e barras com recursos nativos de HTML/CSS/SVG, legenda textual e valores acessíveis. Reutilizar ícones e tokens existentes. Desktop com duas áreas de gráficos; mobile em coluna, com detalhamento em cartões e controles de pelo menos 44px.
- Na integração, `core/services/report.service.ts` será o único ponto HTTP dos relatórios. Troca da obra ativa deve descartar dados anteriores e ignorar respostas atrasadas. Exibir estados de carregamento, erro com nova tentativa e ausência de obra.
- Na tarefa 6, compartilhar a apresentação da página com a versão visual de exportação, usando todas as categorias sem alterar o filtro da tela. Capturar seções e compor as páginas do PDF sob demanda. Validar `html-to-image` e `pdf-lib`, fixando versões antes do RED. A partir da tarefa 7, o PDF visual não anexa apêndice textual e não desenha cabeçalho de página; data de geração, pago e a pagar ficam no cabeçalho da composição. Conferir o contexto após cada etapa assíncrona, inclusive importações e captura.
- A exportação visual recebe da API um único contrato interno JSON autorizado com relatório completo, nome seguro e data de geração, produzidos a partir do mesmo snapshot de leitura. Preservar `GET /reports/pdf` com consolidação e lista individual de despesas para o contrato legado, e manter `GET /reports/export` para esse snapshot visual. A apresentação isolada de exportação recebe os dados desse retorno; não captura um relatório antigo.

## Tarefas

- [x] **Tarefa 1 — Prototipar a tela de relatórios com dados fictícios**
  - Cobre: CA7, CA8, CA9 e CA10. É a etapa visual preliminar solicitada pelo autor; não comprova os critérios financeiros de produção CA1–CA6.
  - Teste primeiro: Jasmine/Karma em `apps/web`, provando renderização dos quatro indicadores, consistência de totais e percentuais, categoria excedida, atualização conjunta ao filtrar, aviso de PDF sem download e restauração do estado ao recriar o componente. Teste da rota autenticada. O RED ocorre pela ausência da página e da rota.
  - Implementação: título e descrição, período fixo em todo o histórico, seletor de categoria, indicadores, rosca com legenda, barras horizontais, resumo e detalhamento. Identificar dados demonstrativos. Não alterar funcionalidades das demais telas.
  - Validação visual: comparar com a referência enviada no desktop e verificar em 360px, sem transbordamento horizontal e com cartões no detalhamento.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/src/app/features/reports/reports-page.component.{ts,html,css,spec.ts}`, `apps/web/src/app/features/reports/reports-demo.data.ts`, `apps/web/src/app/app.routes.ts`, `apps/web/src/app/app.routes.spec.ts`.

- [x] **Tarefa 2 — Integrar a distribuição real de gastos da obra**
  - Cobre: CA1, CA5 e CA6 na consulta JSON, incluindo obra sem despesas na visualização de distribuição.
  - Teste primeiro: JUnit de serviço, repositório e controlador para agregação por categoria, exclusão lógica e 404 Anti-IDOR; Jasmine para substituir a massa fictícia, exibir legenda e totais reais e descartar respostas de obra anterior. Testar falha de rede com nova tentativa e retorno 401 pelo fluxo de autenticação existente.
  - Implementação: contrato de relatório, consulta autorizada e distribuição real de todas as categorias com despesas, além dos estados de carregamento, erro e ausência de obra. Retirar o demonstrativo do fluxo real após a validação visual.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/src/main/java/com/obracerta/{controller/ReportController.java,service/ReportService.java,model/dto/report/,repository/ExpenseRepository.java,repository/BudgetRepository.java}`, testes correspondentes em `apps/api/src/test/`, `apps/web/src/app/core/{models/report.model.ts,services/report.service.ts,services/report.service.spec.ts}`, página de relatórios e seus testes.

- [x] **Tarefa 3 — Integrar o comparativo orçado versus realizado**
  - Cobre: CA2 e parte visual de CA4; mantém CA5 e CA6 na consulta.
  - Teste primeiro: JUnit para categoria sem teto, orçamento sem gastos, igualdade no limite e excedente; Jasmine para barras na mesma escala, saldo positivo verde, excedente vermelho e exclusão de categorias sem orçamento do comparativo. Testar categorias com despesa sem teto continuando nos totais e na rosca.
  - Implementação: completar o contrato e a tela com orçamento, saldo e consumo por categoria, quatro indicadores e detalhamento com números reais; obra sem movimentação apresenta orçamentos e realizado zero, sem percentuais inválidos.
  - Migration: nenhuma.
  - Arquivos previstos: serviço, DTOs e repositórios de relatórios da tarefa 2, testes JUnit correspondentes, modelo e página Angular de relatórios e seus testes.

- [x] **Tarefa 4 — Exportar o relatório financeiro consolidado em PDF**
  - Cobre: CA3, exportação de CA4, CA5 e CA6 no download.
  - Pré-condição resolvida pelo autor: um único PDF com consolidado e lista individual de despesas ativas; em falha, apenas mensagem de erro. Biblioteca selecionada antes do RED: Apache PDFBox 3.0.8; adicionar a dependência e validar no Java 21.
  - Teste primeiro: JUnit para conteúdo extraído do PDF, identificação, valores pago/a pagar, saldos, lista individual de despesas ativas, data determinística via Clock, nome do arquivo, obra vazia e 404 para obra alheia; Jasmine para download, prevenção de cliques duplicados, indicação de geração, falha com apenas mensagem de erro (sem retry automático ou ação específica de tentar novamente) e descarte ao trocar de obra ou sair da página.
  - Implementação: geração síncrona usando a mesma consolidação autorizada dos gráficos e consulta autorizada de despesas ativas para o detalhamento no mesmo arquivo; consumir como Blob pelo service Angular, baixar com nome seguro e liberar a URL temporária. Preservar o botão de exportação existente, sem seletor de formatos. Não emitir novo pedido automaticamente ao retornar à tela.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/api/pom.xml`, controlador e serviço de relatórios, serviço gerador de PDF, testes JUnit correspondentes, service e página Angular de relatórios e seus testes.

- [x] **Tarefa 5 — Corrigir a integração e a validação da distribuição real**
  - Cobre: pendências aceitas nas revisões da Tarefa 2 para CA1, CA5 e CA6; não substitui a implementação do comparativo completo da CA2 nem a exportação da CA3.
  - Teste primeiro: JUnit de repository/service/controller comprovando execução no perfil de testes, exclusão lógica, posse, obra vazia e contrato com orçamento por categoria; Jasmine comprovando retry sem dados antigos, descarte de resposta atrasada, 401 pelo interceptor e formatação monetária sem fragilidade de espaço.
  - Implementação: corrigir a configuração/teste que impede o bootstrap H2/Flyway sem alterar migrations aplicadas; limpar o relatório no retry; manter o contexto por identificador da obra; transportar o orçamento por categoria necessário para que a tela não mostre saldos falsos, deixando cores, omissões e regras finais do comparativo para a Tarefa 3; remover o resíduo demonstrativo do fluxo integrado.
  - Migration: nenhuma.
  - Arquivos previstos: configuração de testes do `apps/api` e testes de `repository`, `service` e `controller`; DTOs/`ReportService`/repositories apenas se necessários ao contrato; `apps/web/src/app/core/models/report.model.ts`, `report.service.spec.ts`, `reports-page.component.{ts,spec.ts}`, além de testes do interceptor somente se necessário.

- [x] **Tarefa 6 — Gerar PDF visual a partir da página de Relatórios**
  - Cobre: CA11 e preservação de CA3, CA4, CA5 e CA6; mantém erro simples, prevenção de duplicidade e descarte da exportação abandonada.
  - Pré-condição: fechamento da tarefa 4 e proposta visual aprovados pelo autor; validar e fixar as bibliotecas de captura/composição antes do RED.
  - Teste primeiro: JUnit para apêndice autorizado sem repetição do consolidado, informações obrigatórias de quitação/data/nome, obra vazia, 404 e exclusão lógica; Jasmine para reutilização da apresentação, exportação global sem alterar seleção, captura dos gráficos, montagem de arquivo único, paginação e nome, falhas nas etapas locais/remotas e descarte por troca de obra/saída, inclusive A → B → A. Preservar as regressões existentes da exportação.
  - Implementação: compartilhar a apresentação da página, gerar as páginas visuais e anexar o detalhamento autorizado ao mesmo PDF, com resolução legível e carregamento sob demanda. Manter download direto pelo botão existente e o estado da tela após concluir ou falhar. Não abrir diálogo de impressão nem acrescentar seletor de formatos.
  - Validação visual: renderizar e inspecionar o PDF final inteiro, comparando gráficos, cores e valores com a página; verificar massa com várias categorias/despesas e obra vazia, acionando a exportação em desktop e em 360px.
  - Migration: nenhuma.
  - Arquivos previstos: `apps/web/package.json` e lockfile; página de relatórios, apresentação compartilhada e testes; serviço local de captura/composição e testes; serviço HTTP de relatórios e testes; controlador/serviços de relatórios PDF e testes Java correspondentes. Ajustar somente os estilos necessários à exportação, sem alterar os limites de build.

- [x] **Tarefa 7 — Remover a página de apêndice do PDF visual**
  - Cobre: CA3 e CA11 revisados pela [proposta](proposta-pdf-somente-visual.md) aprovada pelo autor; preserva CA4, CA5 e CA6, o erro único, a prevenção de duplicidade e o descarte da exportação abandonada.
  - Pré-condição: tarefa 6 fechada no commit `c141eae`; proposta de PDF somente visual aprovada pelo autor antes do RED.
  - Teste primeiro: JUnit do contrato `/reports/export` sem apêndice, com data de geração e nome determinístico; remover os testes do apêndice que deixam de existir e preservar os do `/reports/pdf` legado. Jasmine provando que o PDF gerado tem exatamente as folhas visuais (nenhuma página de apêndice), que o cabeçalho da composição traz data de geração, pago e a pagar, e que obra vazia, falha e abandono continuam cobertos.
  - Implementação: enxugar o contrato interno de exportação (relatório, nome e data de geração), deixar de gerar e anexar o apêndice, remover `generateAppendix` e o cabeçalho de página do caminho visual, exibir no cabeçalho da composição a data de geração e os totais pago/a pagar, e não alterar o comportamento de `GET /reports/pdf`.
  - Validação visual: renderizar e inspecionar o PDF final inteiro, confirmando a ausência da página de apêndice e do cabeçalho de página, em desktop e em 360px, com massa de várias categorias e obra vazia.
  - Migration: nenhuma.
  - Arquivos previstos: `ReportExportDTO`, `ReportController`, `ReportService`, `ReportPdfService` e testes JUnit correspondentes; `core/services/report.service.{ts,spec.ts}`, `report-presentation.component.{ts,html,css}`, `report-presentation.model.ts`, `report-visual-export.service.{ts,spec.ts}` e testes da página. Não afrouxar os limites de build.

- [x] **Tarefa 8 — Filtrar os relatórios por período**
  - Cobre: CA12 e CA11 revisado pela [proposta](proposta-filtro-periodo.md) aprovada pelo autor; preserva CA1, CA2, CA4, CA5 e CA6, o erro único, a prevenção de duplicidade e o descarte da exportação abandonada.
  - Pré-condição: tarefa 7 fechada no commit `0cda8ef`; proposta do filtro de período aprovada pelo autor antes do RED.
  - Teste primeiro: JUnit de repositório/serviço/controlador com `from`/`to` (limites inclusivos, ausência de filtro, intervalo inválido com 400, exclusão lógica e posse) e do snapshot com período e categoria; Jasmine dos campos, Filtrar/Limpar, bloqueio de intervalo, recorte refletido em indicadores/gráficos/detalhamento, PDF com período e categoria e descarte por troca de obra/filtro/saída.
  - Implementação: parâmetros opcionais de data nas somas de despesas e no snapshot autorizado, mantendo o orçamento previsto integral; tela com dois campos e os dois botões, estado digitado vs aplicado, mensagem única para intervalo inválido e restauração do período ao trocar de obra; cabeçalho do PDF com período e categoria aplicados; `/reports/pdf` legado inalterado.
  - Validação visual: conferir a tela com período vazio, com intervalo válido e com intervalo inválido, em desktop e 360px; exportar com e sem filtro e inspecionar o PDF.
  - Migration: nenhuma.
  - Arquivos previstos: `ExpenseRepository`, `ReportService`, `ReportController`, `ReportExportDTO` e testes JUnit correspondentes; `core/services/report.service.{ts,spec.ts}`, `reports-page.component.{ts,html,css,spec.ts}`, `report-presentation.component.{ts,html}`, `report-presentation.model.ts`, `report-visual-export.service.{ts,spec.ts}`. Não afrouxar os limites de build.

- [x] **Tarefa 9 — Sincronizar a categoria após aplicar o período**
  - Cobre: CA11 e CA12, conforme o apontamento aceito na auditoria final r5.
  - Teste primeiro: selecionar uma categoria antes de aplicar o período, conferir o seletor e a requisição de PDF quando a categoria desaparece, e preservar a seleção quando ela continua disponível.
  - Implementação: reconciliar a seleção com a resposta atual do relatório e manter o seletor, as visualizações e o PDF sincronizados.
  - Migration: nenhuma.
  - Arquivos previstos: `reports-page.component.{ts,html,spec.ts}`.

- [x] **Tarefa 10 — Impedir exportação após falha da consulta**
  - Cobre: CA11, conforme o apontamento aceito na auditoria final r6.
  - Teste primeiro: aplicar um período com categoria selecionada, simular a falha da consulta e comprovar que o PDF fica indisponível até uma resposta válida.
  - Implementação: compartilhar a condição de exportação entre o botão e a ação, mantendo o filtro reconciliado após a recuperação.
  - Migration: nenhuma.
  - Arquivos previstos: `reports-page.component.{ts,html,spec.ts}`.

## Critérios sem tarefa
