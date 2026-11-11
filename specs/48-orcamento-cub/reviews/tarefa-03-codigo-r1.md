# Parecer de Código — Tarefa 3

**Veredito:** APONTAMENTOS

Não rodei `ng test` (o shell é só para leitura e diff aqui). A análise é estática, com base no diff e nos arquivos completos.

## Apontamentos (bloqueiam)

1. **O teste do formulário não prova o que o nome afirma, e o timeout que ele exercita é do stub, não do código de produção.** — `apps/web/src/app/features/budgets-page/components/budget-form-modal/budget-form-modal.component.spec.ts:290-329`
   Regra violada: `architecture.md` §5.1 item 7 (falha chega ao componente para feedback e nova tentativa). A regra de TDD do `utf-rules.md` exige que o teste da camada do comportamento prove o comportamento.
   Evidência:
   - Linha 292-293: o stub é `lookup.pipe(timeout(15000))`. O operador é reimplementado dentro do teste. Se `budget.service.ts:28` fosse removido, este teste continuaria verde. Ele não prova o fix.
   - O componente não tem timer nenhum (`sinapi-form.component.ts:115-138`). A única coisa que ele faz com o erro é o `catchError` da linha 126, que trata qualquer erro igual. O cenário "erro chega → mostra `sinapi-error` → `sinapi-retry` funciona" já está coberto pelo teste das linhas 247-288, que usa `current.error(...)`. O que sobra de novo é só o `tick` de 14999/1 ms, e esse tempo vem do stub.
   - Linha 320: `expect(query('budget-form-submit')).toBeNull()` é vacuamente verdadeiro. O botão de submit está no `@else` de `budget-form-modal.component.html:47-50` e só existe no modo padrão. Como o teste está na aba SINAPI (`budget-form-sinapi`, linha 304), o botão nunca aparece, com ou sem erro.
   - Linha 328: `expect(budgetService.setBudget).not.toHaveBeenCalled()` também é vacuo, porque nenhum caminho do fluxo SINAPI chama `setBudget`.
   - Prejuízo concreto: o título "blocks confirmation until a retry succeeds" promete uma garantia que o teste não verifica. Ele dá sensação de cobertura do timeout onde não há cobertura, e uma regressão real do timeout no serviço passa neste arquivo sem aviso.
   Correção sugerida ao autor (não feita aqui): remover este `it` do formulário, já que o timeout pertence ao serviço e o erro-e-retry já está coberto na linha 247. Se quiser manter algo no formulário, o teste precisa usar o `BudgetService` real com `HttpTestingController`, ou um stub que devolva `throwError(() => new TimeoutError())` sem reimplementar o `timeout`. E o título e as asserções de "bloqueio de confirmação" precisam sair, por serem vacuas.

## Verificações que passaram

- **(1) Operador e import:** `budget.service.ts:3` importa `timeout` de `'rxjs'`, e `:28` aplica `.pipe(timeout(15000))` após o `get`. Isso bate com `payment.service.ts:3,30` (mesmo import, mesmo estilo de chamada). A opção `timeout` do `HttpClient.get` saiu do código, então o apontamento 1 da r2 está resolvido.
- **(2) Teste do serviço (`budget.service.spec.ts:94-106`):** usa `fakeAsync`, `tick(14999)` seguido de `tick(1)`, `expectOne` antes do tick e `req.cancelled` para provar que o HTTP foi abortado. Não há timer pendente ao fim, porque o `timeout` dispara em 15000 e se limpa. `expectNone` e o `verify()` do `afterEach` fecham o caso. O padrão é idêntico ao de `payment.service.spec.ts:71-81`, então está consistente com o repo.
- **(3) Camada do teste do serviço:** correta. Ele testa o contrato do serviço com `HttpTestingController`, sem depender do componente.
- **(5) Regressões:** busca em `apps/web/src` por `timeout: 15000`, `request.timeout` e `TimeoutError` não achou nenhum spec que dependa do formato antigo da opção. `budgets-page.component.spec.ts:154,521` mocka `getSinapiReferences` e não passa pelo `HttpClient`, então não é afetado. Nenhuma regressão encontrada.

## Sugestões (não bloqueiam)

- `budget.service.spec.ts:96-98`: o `error: () => failed = true` aceita qualquer erro. Para garantir que é de fato o timeout (e não outra falha imediata), vale checar `error` como `TimeoutError` (`import { TimeoutError } from 'rxjs'`). Assim o teste não passa caso o erro venha de outra fonte antes de 15 s.
- `budget.service.spec.ts:94`: o título "ends a SINAPI lookup without response at 15 seconds" está bom. Caso o `failed` vire `error` com TimeoutError, o `expectNone` pode virar `expect(req.cancelled)` apenas, mas isso é preferência.

## Observações fora do escopo deste diff

- `sinapi-form.component.ts:126-129` engole o erro e troca por `lookupFailed`. Isso é intencional e está de acordo com o `architecture.md` §5.1 item 7, porque o erro vira feedback de retry. Não é apontamento, mas vale saber que o tipo do erro (timeout ou 5xx) não chega à UI.
- Herdado da r2 e ainda não tratado: `budget-form-modal.component.ts` removeu `sinapiDemoAvailable`, então a aba SINAPI aparece em produção. Confirmar com o autor se é intencional.
