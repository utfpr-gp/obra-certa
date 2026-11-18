# Tarefa 8 — Registro de validação

Data: 2026-11-01. Escopo: bloqueios remanescentes da Tarefa 1, conforme os pareceres `tarefa-01-conformidade-r2.md` e `tarefa-01-codigo-r2.md`, sem novos critérios de aceite.

## Testes antes de alterações de produção

Foram ampliados os dois testes existentes de viewport real, em iframe de 360 e 1280 px, em `accounts-page.component.spec.ts`. Os testes usam os estilos reais da aplicação e verificam a representação visível correspondente: cards no mobile e linhas da tabela no desktop.

Cada viewport recebe dois registros distintos: uma despesa paga, sem vencimento, e uma pendente, com vencimento. As asserções comparam exatamente descrição, categoria, fornecedor, compra, vencimento (inclusive o marcador `—`), valor em BRL e situação `Pago`/`Pendente`, dentro de cada linha/card. No mobile, os rótulos `dt` e os valores `dd` também são conferidos. Valores encontrados em totalizadores não podem satisfazer essas asserções. Cada registro tem seu link individual verificado, e o acesso `Cadastrar conta` aponta para `/contas/nova`.

Não houve alteração de produção. O despacho autorizou ampliar a cobertura de comportamento já existente sem produzir falha artificial. A execução passou de primeira; não foi necessário modificar componente, modelos ou serviços.

## Respostas antigas

A implementação de identidade/geração de consulta já foi entregue pela Tarefa 7. Seus testes existentes em `accounts-context.spec.ts` foram executados novamente, sem duplicação: A → B → A com respostas antigas de sucesso/erro, transições entre effects e páginas concorrentes da mesma obra, além dos demais casos de contexto e falhas dessa suíte.

## Resultado frontend

O orquestrador confirmou **40 testes aprovados, exit 0**, abrangendo `accounts-page.component.spec.ts` e `accounts-context.spec.ts`. Comando para repetir em `apps/web`:

```powershell
npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts --include=src/app/features/expenses/accounts-context.spec.ts
```

`git diff --check` do arquivo alterado passou, com apenas o aviso de normalização CRLF → LF do Git.

## Integração preservada

`ExpenseListingIntegrationTest` não foi alterado. Ele mantém a comprovação de paginação 15 + 1, despesas ativas, pagamento à vista sem `PendingPayment`, vencimento da pendente, isolamento, exclusão lógica, consulta somente leitura e ausência de acesso ao storage. O teste frontend recebe o DTO e não comprova a ausência de uma entidade de pagamento no banco; essa garantia pertence ao teste integrado.

A reexecução da API foi realizada pelo orquestrador em PostgreSQL 16, banco separado `obracerta_test`, perfil `test`, pool máximo quatro e mínimo ocioso um. Comando em `apps/api`: `.\mvnw.cmd -Dtest=ExpenseListingIntegrationTest '-Dlogging.file.name=target/tarefa-08-api.log' test -q`. Resultado: exit 0, quatro testes, zero falhas e zero erros. Relatório: `apps/api/target/surefire-reports/com.obracerta.controller.ExpenseListingIntegrationTest.txt`; log: `apps/api/target/tarefa-08-api.log`.

## Decisões e limites

Validação complementar pelo orquestrador em `apps/web`: `npm test -- --watch=false --browsers=ChromeHeadless`, exit 0, 388/388 testes aprovados. Log: `apps/web/tarefa-08-web-suite.log`. Build não repetido nesta tarefa: somente testes foram alterados; o build da Tarefa 7 permanece como evidência anterior, sem ser apresentado como nova execução.

Foram reutilizados os testes de viewport e de contexto existentes. Não foram introduzidos novos filtros, abas, ordenação, totalizadores, regras financeiras ou dados fixos em produção. Backend, migrations, spec, plano, documentos externos e alterações de outros trabalhos foram preservados. Sem stage ou commit pelo implementador. Este registro não substitui a revisão independente nem declara a tarefa concluída.
