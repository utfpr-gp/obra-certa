# Tarefa 7 — Registro de validação

Data: 2026-11-01. Escopo: CA9 e CA10 da US05. Sem migration, alteração da spec/plano ou commit pelo implementador.

## RED

Testes escritos antes da alteração da lógica e executados pelo orquestrador em `apps/web`:

```powershell
npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-context.spec.ts --include=src/app/features/expenses/accounts-page.component.spec.ts
```

Resultado: 40 testes, 13 falhas e 27 sucessos. Evidência local: `apps/web/tarefa-07-web-red.log`. Falhas demonstraram respostas antigas sobrescrevendo resultados, totais, erro ou carregamento, recarga indevida ao atualizar metadados da mesma obra, ausência de retry e atualização após destruir a página. Os casos que confirmam comportamento já existente não receberam falhas artificiais.

## Implementação

- Uma geração monotônica por consulta, combinada à versão síncrona de `ActiveProjectService`, invalida respostas de páginas e contextos anteriores, inclusive A → B → A entre effects.
- A troca real de obra limpa formulário, filtros, aba, ordenação, página, dados e erro. Metadados da mesma obra preservam a seleção e não geram novo GET.
- Sem obra, o carregamento termina, os dados são retirados e a tela orienta selecionar uma obra.
- A tentativa manual repete a página solicitada com os filtros, aba e ordenação atuais. Dados anteriores não são apresentados durante falha ou carregamento.
- `DestroyRef` impede que respostas posteriores à destruição alterem o estado do componente. A cadeia existente de 401 segue responsável pelo logout e redirecionamento.
- As rotas e serviços existentes foram preservados. Voltar à listagem cria uma nova página e consulta os dados atuais.

## Cobertura adicionada

- `accounts-context.spec.ts`: respostas controladas de sucesso/erro, obras A → B → A, transições antes do effect, páginas concorrentes, loading da consulta recente, abas/filtros/ordenação concorrentes, metadados da mesma obra, ausência de obra, falhas de rede/503 e retry manual, interceptor 401 real e saída da página sem escrita.
- `accounts-return-navigation.spec.ts`: ida e volta pelas rotas reais de cadastro/consulta; a resposta atualizada do servidor representa inclusão, edição, quitação e exclusão já concluídas. As mutações dessas telas não são duplicadas nesta suíte.
- `accounts-page.component.spec.ts`: expectativa existente passa a exigir a ação manual de retry.
- `ExpenseListingIntegrationTest`: GET repetido verifica IDs e totais; consulta alheia responde 404 sem registros/totais; snapshots completos das linhas de despesas, pagamentos, orçamentos e obras permanecem iguais; nenhum acesso ao substituto de `ReceiptStorage`.

## GREEN

API: `ExpenseListingIntegrationTest`, 4 testes, zero falhas/erros, executado pelo orquestrador em `apps/api` com PostgreSQL de testes e substituto de storage:

```powershell
.\mvnw.cmd -Dtest=ExpenseListingIntegrationTest '-Dlogging.file.name=target/tarefa-07-api.log' test -q
```

Ambiente: `SPRING_PROFILES_ACTIVE=test`, `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/obracerta_test`, usuário/senha de teste `postgres`, pool máximo 4/mínimo ocioso 1; Flyway e `ddl-auto=validate` preservados. O teste adicional confirmou o comportamento já existente, sem alterar produção da API.

Primeira execução frontend com as quatro suítes: 49 testes, 46 sucessos e três falhas nos retornos por link da consulta individual. Os 20 testes de contexto passaram. Evidência local: `apps/web/tarefa-07-web-green.log`.

As três falhas eram sincronização da fixture: `RouterTestingHarness.navigateByUrl` executa `fixture.detectChanges()` após a navegação (fonte instalada de `@angular/router`, `fesm2022/testing.mjs`, linhas 210–219); o caminho por clique aguardava estabilidade sem detectar a página recém-criada antes de exigir a chamada HTTP do effect. O teste agora confirma URL `/contas`, tipo e identidade da nova instância e executa `harness.detectChanges()` antes de verificar a consulta. Nenhuma mudança de produção foi feita para essa falha.

Segunda execução frontend confirmada pelo orquestrador: **49 testes, 49 sucessos**, com as quatro suítes:

```powershell
npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts --include=src/app/features/expenses/accounts-context.spec.ts --include=src/app/features/expenses/accounts-return-navigation.spec.ts --include=src/app/features/expenses/accounts-navigation.spec.ts
```

Validação complementar executada pelo orquestrador:

- `npm test -- --watch=false --browsers=ChromeHeadless`: exit 0, 388/388 testes frontend aprovados. Log: `apps/web/tarefa-07-web-suite.log`.
- `npm run build`: exit 0, aviso de bundle inicial de 698,21 kB para orçamento de aviso de 500 kB. Log: `apps/web/tarefa-07-build.log`.

Nenhum teste/backend GUI foi executado fora da sandbox pelo implementador.

## Decisões e limites

A ordenação também retorna ao padrão ao trocar de obra, seguindo o abandono integral do contexto anterior e a ordenação inicial da listagem. Retry usa a página solicitada, mesmo quando a falha antecedeu a confirmação dessa página. Nenhum ajuste de produção na API foi necessário: o serviço de listagem já utiliza transação somente leitura. Não foram acrescentados persistência de filtros, restauração de intenção após login, reenvio automático, regras financeiras, acesso ao storage real ou alterações de documentos externos a esta tarefa. Este registro não substitui os pareceres independentes de revisão.
