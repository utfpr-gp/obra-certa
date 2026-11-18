# Validação — Tarefa 3, rodada 1

Base: `c181b84ae83f931636df075ce38d5f34708b4908`.

## RED

- Backend: `./mvnw.cmd test -Dtest=ReportServiceTest`, executado pelo implementador antes da mudança de produção. Cinco testes, duas falhas esperadas: categorias com orçamento sem despesas eram omitidas tanto no cenário misto quanto na obra sem movimentação.
- Frontend: `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/reports/reports-page.component.spec.ts --include=src/app/core/services/report.service.spec.ts --include=src/app/app.routes.spec.ts`. Quatorze testes: quatro falhas novas e dez sucessos. As falhas demonstraram escala fixa e inclusão de categorias sem orçamento no comparativo; saldo positivo sem verde e consumo indefinido apresentado como zero; distribuição e maior gasto fictícios na obra sem despesas; filtro de categoria sem orçamento inconsistente.
- A primeira saída frontend ficou truncada; a execução foi repetida somente para recuperar o diagnóstico, antes de qualquer alteração de produção Angular.

## GREEN backend

Com perfil `test` explícito e PostgreSQL 16 descartável exclusivo desta validação, porta local 55438, banco `obracerta_task3_test`, Flyway habilitado e `ddl-auto=validate`:

`./mvnw.cmd test -Dtest=ReportServiceTest,ReportControllerTest,ExpenseRepositoryTest`

Resultado: **BUILD SUCCESS**, 11 testes, nenhuma falha ou erro (5 serviço, 2 controlador e 4 repositório). O banco de desenvolvimento não foi utilizado nesta execução.

## GREEN frontend e build inicial

O mesmo comando Jasmine/Karma executado no RED passou após a implementação: **14 SUCCESS**, saída 0.

Primeira execução de `npm.cmd run build`: falhou porque o CSS compilado da página atingiu 8,31 kB, excedendo em 306 bytes o limite de erro de 8 kB. O impedimento foi devolvido ao implementador; não foi autorizada alteração dos budgets.

Após simplificação do CSS e reutilização de classes no HTML, a segunda execução concluiu com **saída 0**. CSS compilado: **7,88 kB**. Permanecem avisos de tamanho acima dos limites de aviso de 4 kB para CSS e 500 kB para o bundle inicial (741,88 kB); nenhum limite foi alterado.

## Reexecução independente

O revisor de conformidade repetiu os comandos após o ajuste final de CSS/HTML: **14/14 frontend** e **11/11 backend**, ambos com saída 0. A primeira tentativa backend restrita encontrou bloqueio de socket (`getsockopt`); a repetição com execução autorizada fora do sandbox passou.

O container descartável `obra-certa-us06-task3-tests` foi encerrado após a conclusão das execuções. Logs temporários de diagnóstico frontend removidos; não integram o commit.

## Validação visual

Ao atualizar a aba local para carregar a implementação, a aplicação redirecionou para o login. Foi solicitado ao autor autenticar e abrir Relatórios pelo menu. A validação visual final permanece pendente dessa sessão; os resultados automatizados acima não equivalem à comparação visual desktop/mobile.
