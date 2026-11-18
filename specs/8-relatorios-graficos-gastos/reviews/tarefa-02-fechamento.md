# Fechamento da Tarefa 2 — Integração da distribuição real

## Origem da entrega

A implementação da tarefa 2 e as correções de suas pendências foram versionadas no commit `0d711e473061439c17a33b8e2acbaa7b38b6967d` (`tarefa 5: corrigir integracao e validar relatorios com PostgreSQL`). A tarefa 5 foi criada para tratar os apontamentos aceitos após as duas rodadas da tarefa 2.

Este documento consolida a rastreabilidade para o fechamento do checklist. Não substitui nem altera os pareceres anteriores, não inicia uma terceira rodada da tarefa 2 e não introduz implementação nova.

## Cobertura do plano

| Exigência da tarefa 2 | Implementação existente | Comprovação |
| --- | --- | --- |
| CA1: distribuição real, valores e percentuais por categoria | `ReportController`, `ReportService`, agregação em `ExpenseRepository`, `ReportService` Angular e página consumindo o contrato HTTP | `ReportServiceTest`, `ReportControllerTest`, `report.service.spec.ts` e `reports-page.component.spec.ts` |
| CA5: rejeitar obra alheia ou inexistente | Busca da obra pelo ID e proprietário antes das consultas; exceção de recurso não localizado resulta em 404 | Testes de serviço, controlador e consulta com proprietário no repositório |
| CA6: ignorar despesas excluídas | Agregações filtram `deletedAt`, obra ativa e proprietário | Testes PostgreSQL de exclusão lógica e isolamento por proprietário em `ExpenseRepositoryTest` |
| Obra válida sem despesas na distribuição | Resposta com totais zerados e categorias vazias; mensagem de ausência de despesas no frontend | `ReportServiceTest.returnsAnEmptyDistributionForAValidProjectWithoutExpenses` e template da página |
| Carregamento, falha e nova tentativa | Signals de carregamento/erro, ação de retry e descarte do relatório anterior antes de uma nova consulta | Teste frontend de retry e leitura do componente/template |
| Ausência e troca de obra | Orientação para selecionar uma obra; limpeza de estado ao mudar o contexto; resposta aceita somente para a geração e ID atuais | Componente e teste de troca da obra |
| 401 pelo fluxo de autenticação | Uso do interceptor existente e chamada de logout | `report.service.spec.ts` |
| Substituição da massa fictícia no fluxo real | Página recebe dados do endpoint; rótulo final identifica os dados reais da obra ativa | Componente/template e teste que rejeita o texto demonstrativo |

## Destino dos apontamentos aceitos na tarefa 2

| Apontamento aceito na rodada 2 | Resolução na tarefa 5 |
| --- | --- |
| Execução dos testes não comprovada | Execução registrada: 10 testes frontend e 9 backend aprovados, com comandos e resultados |
| Retry mantém dados antigos | `report.set(null)` antes de disparar nova consulta |
| Orçamento por categoria ausente no contrato | `plannedAmount` no DTO, calculado a partir dos orçamentos ativos |
| Orçamento perdido no comparativo frontend | Modelo e página transportam `plannedAmount` para `plannedCents` |
| Teste de moeda frágil por espaço não separável | Normalização de espaço na apresentação e correção da requisição pendente no teste |
| Testes backend bloqueados por H2/Flyway | PostgreSQL temporário real, Flyway habilitado e `ddl-auto=validate`; regressão comprova banco e histórico de migrations |

## Evidências de aceite técnico existentes

- [Decisões da tarefa 2, rodada 2](tarefa-02-decisoes-r2.md).
- [Conformidade da tarefa 5, rodada 2 — APROVADO](tarefa-05-conformidade-r2.md).
- [Código da tarefa 5, rodada 2 — APROVADO](tarefa-05-codigo-r2.md).
- [Validação da tarefa 5, rodada 2](tarefa-05-validacao-r2.md): frontend 10/10, backend 9/9, PostgreSQL 16.15, dez migrations aplicadas em banco vazio e validação do schema.

Na conferência de fechamento, os arquivos de implementação e testes de `apps/api` e `apps/web` permaneciam sem mudanças em relação ao commit `0d711e4`. Não houve nova execução dos mesmos comandos, pois não foi introduzida alteração que invalidasse a validação registrada.

A sugestão não bloqueante de fortalecer a ordem das respostas no teste de troca da obra continua registrada no parecer de código da tarefa 5; não foi promovida a correção pelo autor.

## Escopo restante da história

O comparativo completo, os estados financeiros de CA2/CA4 e a exportação de PDF continuam pertencendo às tarefas 3 e 4. Não são motivo para reimplementar a distribuição real já entregue.
