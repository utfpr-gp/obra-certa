# Auditoria Final — Issue #8, rodada 6

**Veredito — NÃO PRONTO.** Auditei o candidato local, composto pelo commit `91fe2a7` e pelas alterações intencionais ainda sem commit, contra `71b8e21`. A tarefa 9 resolveu a divergência apontada na rodada 5 quando a consulta retorna com sucesso. A divergência persiste quando a consulta falha.

## Critérios de aceite da spec

| # | Critério | Situação | Evidência |
| --- | --- | --- | --- |
| CA1 | Distribuição | Atendido | `ReportServiceTest:65` e `reports-page.component.spec.ts:29` |
| CA2 | Comparativo | Atendido | Escala compartilhada, exclusão de categorias sem orçamento e cores de saldo em `reports-page.component.spec.ts:393` e `:409`. |
| CA3 | PDF | Atendido | Download único, dados obrigatórios e erro de exportação sem nova tentativa em `reports-page.component.spec.ts:90` e `:116` e `report-visual-export.service.spec.ts:78`. |
| CA4 | Sem movimentação | Atendido | Orçamento preservado, gastos zerados e exportação cobertos em `reports-page.component.spec.ts:426` e `report-visual-export.service.spec.ts:121`. |
| CA5 | Posse | Atendido | `ReportControllerTest:48`, `:55` e `:147` e `reports-page.component.spec.ts:385`. |
| CA6 | Exclusão lógica | Atendido | `ExpenseRepositoryTest:160` e `:213`. |
| CA7 | Apresentação demonstrativa | Atendido na primeira etapa | `reviews/tarefa-01-conformidade-r2.md`, com verificações desktop e 360 px. |
| CA8 | Consistência da massa fictícia | Atendido na primeira etapa | Massa única e categoria excedida registradas em `reviews/tarefa-01-conformidade-r2.md`. |
| CA9 | Controles do protótipo | Atendido na primeira etapa | Período fixo, filtro de categoria e aviso de PDF registrados em `reviews/tarefa-01-conformidade-r2.md`. |
| CA10 | Abandono do protótipo | Atendido na primeira etapa | Descarte da seleção local ao recriar a tela registrado em `reviews/tarefa-01-conformidade-r2.md`. |
| CA11 | PDF visual | **Parcial** | Composição, paginação e abandono cobertos. Após falha da consulta, o PDF pode usar uma categoria que o seletor deixou de exibir. |
| CA12 | Período | Atendido | Limites inclusivos e orçamento integral em `ReportServiceTest:203`. Aplicação, inversão, sincronização após resposta válida e troca de obra em `reports-page.component.spec.ts:179`, `:212`, `:230` e `:279`. |

## Pendência que bloqueia o PR

1. **CA11 — Após falha da consulta, a categoria exportada pode divergir da categoria visível.** Carregue uma obra, selecione Pintura e aplique um período cujo `GET /reports` falhe transitoriamente. `retry()` limpa o relatório e suas opções, a reconciliação da categoria só acontece no retorno bem-sucedido e o caminho de erro encerra o carregamento. O seletor fica apenas com **Todas as categorias** e o botão de PDF volta a ficar habilitado. Ao clicar, o frontend envia o ID retido de Pintura ao endpoint independente `/reports/export`. Se a conexão já tiver se recuperado, o endpoint pode responder `200` e produzir um PDF restrito a Pintura. Os testes novos cobrem as duas respostas bem-sucedidas. A constatação da falha vem da leitura do fluxo. [Consulta](/C:/Users/panic/dev/obra-certa/apps/web/src/app/features/reports/reports-page.component.ts:51) · [Seletor e botão](/C:/Users/panic/dev/obra-certa/apps/web/src/app/features/reports/reports-page.component.html:8) · [Requisição de exportação](/C:/Users/panic/dev/obra-certa/apps/web/src/app/features/reports/reports-page.component.ts:99) · [Snapshot](/C:/Users/panic/dev/obra-certa/apps/api/src/main/java/com/obracerta/service/ReportService.java:64)

## Documentação e validação

- O PRD registra a entrega local, mas a rastreabilidade ainda cita oito tarefas. O índice também cita oito tarefas e aponta para a rodada 4 e os 443 testes anteriores. Atualizar ambos para refletir o estado do candidato que seguirá à `develop`, incluindo o parecer e os registros da tarefa 9. [PRD](/C:/Users/panic/dev/obra-certa/docs/prd.md:267) · [Índice](/C:/Users/panic/dev/obra-certa/specs/README.md:19)
- A arquitetura documenta os três contratos. A US06 usa o schema existente. O `TODO #8` cumpriu seu papel no protótipo e a integração substituiu a massa fictícia. O diff de produção concentra-se na US06. O ajuste do pool é restrito ao perfil de teste. [Arquitetura](/C:/Users/panic/dev/obra-certa/docs/architecture.md:443)
- Conferi os logs do orquestrador sem repetir as suítes. **445 testes web** e **348 testes da API** passaram, estes em PostgreSQL 16 com Flyway. O build web concluiu com avisos de orçamento e CommonJS. A validação visual registra inspeção do PDF desktop pelo agente e confirmação do autor para 360 px, obra vazia e filtros.

## Matéria-prima para o PR

- A rota autenticada de relatórios agrega despesas ativas e orçamentos da obra em indicadores, gráficos e detalhamento.
- O período recorta despesas pela data da compra e preserva os valores orçados.
- O PDF visual reutiliza a apresentação em composição desktop a partir de um snapshot autorizado.
- O endpoint legado mantém o consolidado e a lista individual de despesas ativas.
