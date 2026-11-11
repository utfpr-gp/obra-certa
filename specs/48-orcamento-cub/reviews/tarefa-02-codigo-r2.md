# Parecer de Código — Tarefa 2 (rodada 2)

**Veredito:** APONTAMENTOS

Observação de método: o shell foi negado neste ambiente, então não rodei `git diff` nem os testes. Usei o diff já capturado no comando (`git diff --cached 13390bc`) e leitura estática. `node_modules` não existe, então não consegui checar os typings do Angular. O ponto 1 depende dessa verificação.

## Apontamentos (bloqueiam)

1. **O timeout do front não é aplicado pelo padrão do repo e não tem teste.** `apps/web/src/app/core/services/budget.service.ts:26-29`
   Regra violada: `architecture.md` §5.1 item 7 exige que falhas de rede cheguem ao componente para feedback e nova tentativa. A spec (plano, tarefa 2) pede "falha ou tempo limite → erro temporário repetível".
   Evidência: o código passa `timeout: 15000` como opção do `HttpClient.get`. Nos outros serviços do repo, o prazo é imposto pelo operador RxJS `timeout(...)`: `payment.service.ts:30,45,63`, `nfe-import.service.ts:18,34`, `accounts-page.component.ts:495`. A opção `timeout` não faz parte das opções públicas que conheço do `HttpClient`. Se o compilador a rejeitar, o build quebra. Se for ignorada, não há prazo no front. Nesse caso, com o backend travado acima do seu timeout por socket, a tela fica em "Consultando acabamentos…" indefinidamente. O spec `budget.service.spec.ts` não testa o caminho de timeout.
   Prejuízo concreto: a falha de timeout não chega à UI no tempo esperado, e nenhum teste detecta isso.
   Correção sugerida ao autor (não feita aqui): trocar pelo `.pipe(timeout(15000))` como nos demais serviços, e cobrir o timeout com um teste no `budget.service.spec.ts`. Confirmar com `tsc`/`ng test` que o código atual compila, se a intenção for manter a opção.

## Verificações que passaram

- **(a) Resposta incompatível do SIDRA:** resolvido. `SidraClient.java:64` valida o cabeçalho (`hasExpectedHeader`) antes de ler as linhas. `[]`, `[{"error":...}]` e cabeçalho sem as dimensões viram 503 (`BudgetControllerTest.java:177-198`). Lista vazia só com cabeçalho válido (`:167-175`).
- **(b) `tick` removido:** resolvido em `budgets-page.component.spec.ts:1` e no spec da modal. Ainda há `fakeAsync` em `:520`, mas ele é usado.
- **(c) Rótulo "SINAPI":** resolvido em `budget-form-modal.component.html:40`.
- **Timeout do back:** `SidraClient.java:28,49-50` define 5 s de conexão e de leitura. Redirecionamento desligado (`:46`). Destino fixo: a URL é constante e os parâmetros entram por template (`:24-25`). `uf` e `month` chegam validados pelo service (`SinapiReferenceService.java:35-37`). Erro de transporte e HTTP viram 503 (`:60-61`).
- **Titularidade antes do SIDRA:** `SinapiReferenceService.java:41-44`, a consulta ao SIDRA está em `:46-47`, depois do `orElseThrow`. Teste em `BudgetControllerTest.java:139-152`.
- **Validação de parâmetros:** UF (27 códigos IBGE, conferidos), mês `AAAA-MM` com rejeição de `0000` e os oito códigos do PRD (`prd.md:559-566`) estão corretos. Testados em `BudgetControllerTest.java:103-112`.
- **Sem dados do SIDRA em log ou persistência:** não há `Logger`, banco ou cache nos arquivos novos. No front, o resultado fica só em signal (`sinapi-form.component.ts`, sem `localStorage`).
- **`Cache-Control: no-store`:** definido em `BudgetController.java:41` antes de qualquer retorno do service, então vale também para erros tratados. Testado no caminho 200 e 503.
- **Front, descarte de respostas atrasadas:** `merge(...).pipe(switchMap(...))` em `sinapi-form.component.ts:115-130`. Cada seleção nova cancela a anterior. O `catchError` fica dentro do observable interno (`:124-128`), então um erro não encerra o stream externo, e o retry continua funcionando. O teste de resposta antiga está em `budget-form-modal.component.spec.ts` ("ignores stale SINAPI results...").
- **Camadas:** o componente usa `BudgetService` (não `HttpClient`). Sintaxe `@if`/`@for`, `inject()` e signals, como manda o `architecture.md` §5.1.

## Sugestões (não bloqueiam)

- `SidraClient.java:57-59`: um 200 com corpo não-JSON (página HTML de manutenção, por exemplo) precisa virar 503, não 500. Confirmar que o `RestClient` embrulha o erro de conversão em `RestClientException`. Se não embrulhar, falta um `catch` para ele. Um teste com `withSuccess("<html>", TEXT_HTML)` cobre isso.
- `BudgetControllerTest.java:139-152`: as respostas 400 e 404 não verificam `Cache-Control`. A regra vale para todas as respostas do fluxo; uma asserção no teste parametrizado de 400 fecha a lacuna.
- `BudgetController.java:36-42`: o `HttpServletResponse` deixa o controller mais pesado do que o necessário. `ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(...)` faz o mesmo. Vale checar como o `ReportController` (export, `no-store`, `architecture.md:445`) faz isso, para manter o padrão.

## Observações fora do escopo deste diff

- Logs (spec, plano tarefa 2, linha 12): `application.properties:40-41` deixa `org.springframework.web` em INFO. Não há filtro de log de requisição, então os parâmetros da consulta não são logados por padrão. Vale confirmar que o perfil dev não sobe para DEBUG. Candidato a item de verificação na tarefa de logs.
- `budget-form-modal.component.ts` removeu `sinapiDemoAvailable` (era gate de dev/localhost). A aba agora aparece em produção. Isso parece intencional pela feature, mas o autor deve confirmar.
- Dependência externa: a disponibilidade do SIDRA está listada como risco na spec (linha 45). Nada a fazer neste diff.
