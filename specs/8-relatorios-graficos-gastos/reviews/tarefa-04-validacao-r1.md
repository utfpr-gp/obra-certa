# Validação — Tarefa 4, rodada 1

Base: `e0a8178cfca55418ffd12fba797dc11a65188f9a`.

## Decisões anteriores à implementação

O autor confirmou um único PDF com consolidado por categoria e lista individual de despesas ativas. Em falha, apresentar apenas erro, sem retry automático ou ação específica de tentar novamente. Spec e plano atualizados antes do aceite explícito de implementação; o status de aprovação da spec foi preservado.

## RED

- Backend: o implementador executou os testes com Java 21 e PDFBox 3.0.8; a compilação falhou pela ausência de `ReportPdfService`, antes de implementar o gerador.
- Frontend: `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/reports/reports-page.component.spec.ts --include=src/app/core/services/report.service.spec.ts --include=src/app/app.routes.spec.ts`, em `apps/web`. Saída 1: `TS2339`, método `exportPdf` ausente em `ReportService`; erro secundário `TS7006` no parâmetro da resposta. Produção Angular ainda não alterada naquele momento.

## Ambiente de integração preparado

PostgreSQL 16 descartável exclusivo: container `obra-certa-us06-task4-tests`, porta local 55439, banco `obracerta_task4_test`. Os testes devem usar perfil `test` explícito, Flyway habilitado e `ddl-auto=validate`. O banco de desenvolvimento não integra esta validação.

## Primeiras execuções GREEN

- Frontend: o mesmo comando após a implementação passou com **19 SUCCESS**, saída 0.
- Build: `npm.cmd run build` concluiu com saída 0. CSS da página em **7,88 kB**, sem alterar limites. Permanecem os avisos de CSS acima de 4 kB e bundle inicial acima de 500 kB (743,25 kB).
- O implementador identificou cobertura adicional necessária para preservação de caracteres no PDF e para a troca rápida de obra A → B → A antes da execução dos efeitos Angular. Os testes adicionais são executados antes das respectivas correções.

## Execuções finais do orquestrador

- RED adicional A → B → A: **1 FAILED, 19 SUCCESS**; uma resposta obsoleta ainda chamava `URL.createObjectURL`. Após capturar e conferir a versão síncrona do contexto, a mesma suíte passou com **20 SUCCESS**, saída 0.
- API: `./mvnw.cmd test -Dtest=ReportPdfServiceTest,ReportServiceTest,ReportControllerTest,ExpenseRepositoryTest`, com perfil e conexão isolados explícitos, **BUILD SUCCESS**, 18 testes, nenhuma falha ou erro (3 PDF, 7 serviço, 4 controlador, 4 repositório).
- Build final após correção A → B → A: saída 0, CSS 7,88 kB, bundle inicial 743,37 kB; somente avisos de tamanho, sem alteração de limites.

## Inspeção do PDF e navegador

- Fixture sintética `apps/api/target/report-fixture.pdf`: 90 despesas, nome de obra extenso e texto em português, grego e cirílico. Gerada após execução bem-sucedida do marker da skill PDF. PDFBox utiliza a Liberation Sans incluída na dependência, sem fonte binária adicional no repositório; caracteres sem glyph causam erro explícito.
- Poppler identificou 13 páginas A4 e renderizou todas. A inspeção visual identificou descrições e metadados de uma mesma despesa divididos entre páginas, incluindo uma página final apenas com metadados. Evidência encaminhada aos revisores para classificação; nenhuma correção aplicada antes da triagem do autor.
- Na aba autenticada local, o hot reload reteve template antigo e registrou `ctx.pdfNotice is not a function`. Navegar pelo menu não resolveu o estado misto; a atualização completa redirecionou ao login. A conferência do download real no navegador permanece pendente de nova autenticação. Os testes automatizados acima não equivalem a essa conferência.

## Reexecução independente e encerramento do ambiente

O revisor de conformidade executou os comandos de API e frontend independentemente: **18/18 API** e **20/20 frontend**, ambos aprovados. A tentativa inicial de API no sandbox passou nos 14 testes unitários e encontrou bloqueio de socket nos quatro testes de repositório; a repetição com permissão ampliada passou nos 18 testes, com PostgreSQL 16.15, Flyway e `validate`.

O container descartável foi encerrado após essas execuções. Logs temporários frontend foram removidos. Os dois pareceres da rodada 1 apontaram bloqueios e foram salvos sem edição. O código permanece congelado aguardando triagem do autor; nenhuma correção de revisão ou commit foi realizado.
