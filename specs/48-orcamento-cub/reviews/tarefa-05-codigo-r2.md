# Parecer de Código — Tarefa 5 (Issue 48, US15), rodada 2

**Veredito:** APONTAMENTOS

Li o delta da rodada 2 (`git diff --cached 5ec086b`, 10 arquivos), o `docs/architecture.md` (§5.1, §5.2, US07/US08), o `utf-rules.md`, o `plan.md`, os pareceres da rodada 1 e, em volta do diff, `BudgetService`, `GlobalExceptionHandler`, `BudgetRepository`, `SecurityConfigurations`, a migration `V1__baseline_schema.sql:50` e os templates dos dois componentes.
Rodei a suíte do front (`npm test -- --watch=false` em `apps/web`): **627 SUCCESS**. A suíte do backend **não foi executada**: `mvn`, `mvnw.cmd` e qualquer comando com pipe foram recusados pelo shell deste harness (`Permission denied`); a avaliação dos testes Java é por leitura.

## Apontamentos (bloqueiam)

**1. O bloqueio do fechamento durante o envio do lote SINAPI é contornável pelas abas do modal, e a recarga continua sendo perdida**
- `apps/web/.../budget-form-modal/budget-form-modal.component.html:33` — a aba "Orçamento padrão" executa `(click)="sinapiOpen.set(false)"` e não tem `[disabled]` (o `[disabled]="saving()"` da linha 39 está só na aba SINAPI). O `onBudgetTabKeydown` (`budget-form-modal.component.ts:110-113`) faz o mesmo com setas/Home/End.
- Ao trocar de aba durante o envio, o `@if` da linha 47 desmonta o `app-sinapi-form`. A guarda nova então não tem o que consultar: `close()` (`budget-form-modal.component.ts:204-206`) avalia `this.sinapiForm()?.saving()` como `undefined` e libera o fechamento. A resposta que chega depois chama `confirmed.emit()` (`sinapi-form.component.ts:236`) sem destinatário, porque o listener do template foi destruído junto com o filho — `onBudgetSaved()` (`budgets-page.component.ts:134-141`) não roda.
- A causa raiz é que `saving` do modal (`:55`) nunca é ligado ao `saving` do filho: ele só é escrito em `save()` do orçamento padrão (`:177`) e no `effect` (`:74`, `:81`). O único `saving` que vale para o lote é o de `sinapi-form.component.ts:223`.
- Regra violada: `plan.md:21` ("Após confirmar, a página recarrega os tetos da obra") e `architecture.md:373` (resposta perdida não prova que o servidor deixou de gravar); o padrão da US08 (`architecture.md:567`) bloqueia confirmação **e** fechamento durante o envio.
- Prejuízo concreto: o lote fica gravado e o painel continua com os tetos antigos — exatamente o defeito aceito na rodada 1 (apontamento 2), agora por um clique na aba em vez do X. Os três caminhos pedidos (X, Escape, `(cancelled)`) passam por `close()` e estão corretos; falta este quarto caminho, que não passa por `close()` coisa nenhuma.
- Correção (o autor decide): expor o `saving` do filho ao modal (ex.: `output` de mudança) e usá-lo na guarda de `close()` **e** na troca de aba (`onBudgetTabKeydown` incluído).

## Sugestões (não bloqueiam)

- **O 400 novo de "limite" nunca chega ao usuário.** O servidor passou a responder 400 com "O total ultrapassa o limite de R$ 9.999.999.999.999,99.", mas `sinapi-form.component.ts:240` mapeia todo status diferente de 409 para `'failed'`, cuja mensagem é "Não foi possível confirmar o orçamento…". Vale distinguir 400/limite, ou espelhar `MAX_TOTAL` em `estimateCents`/`estimateInvalid` para a prévia já recusar (`sinapi-allocation.ts:55-62`).
- **Botão "Cancelar" do SINAPI fica clicável e inerte durante o envio** (`sinapi-form.component.html:137`): o clique é engolido pela guarda de `close()`. Desabilitá-lo (`[disabled]="saving()"`) evita a ação que não faz nada, como já ocorre com `canConfirm()`.
- **O teste de rollback pode ficar vacuamente verde se o spy deixar de delegar.** `BudgetSinapiConfirmationIntegrationTest:280-289` só verifica que o banco ficou vazio. Um `verify(budgets).insertIfAbsent(..., eq(byName.get(FUNDACAO).getId()), ...)` (ou asserção de que houve ≥1 insert antes do `doThrow`) prova que havia algo a reverter; hoje, se `@MockitoSpyBean` sobre o proxy JDK do Spring Data retornar 0 em vez de chamar o real, o teste passa sem inserir nada. A transação em si continua real (`BudgetService:215`), e a classe falharia em `gravaTetosSomente…` nesse cenário — por isso é sugestão, não bloqueio.
- **O interceptor só cobre erros que passam pelo handler.** `SinapiNoStoreConfiguration.java:24` restringe por `HandlerInterceptor`, que não roda em 404/405/415 (nenhum handler é resolvido) nem em respostas do `/error` fora do padrão. Para a tarefa 6 ("confirmar `no-store`… inclusive em erro"), ou se aceita que respostas sem corpo não levam o header, ou o caminho é um `Filter` de servlet. O `preHandle` está no lugar certo para os erros de parse/validação, que é o que o teste novo prova (`BudgetControllerTest:385-390`).
- **`putInvalidBodyKeepsItsResponseWithoutNoStore` prova a fatia MVC, não a produção.** `@AutoConfigureMockMvc(addFilters = false)` (`BudgetControllerTest:58`) desliga o `HeaderWriterFilter`; em produção o Spring Security escreve `Cache-Control` por default em todas as respostas, então o PUT continua com cache headers — comportamento pré-existente, mas o nome do teste sugere mais do que ele prova. Vale registrar a conclusão no contrato de tarefa 6.
- **A checagem do teto ocorre depois de `setScale(2)`** (`SinapiAllocationCalculator.java:51-54`). Para uma entrada como `unitCost: 1E+999999999`, `estimate` (`:38`) materializa cem bilhões de dígitos antes de o limite ser comparado. Comparar `total` (ou `unitCost.multiply(area)`) com `MAX_TOTAL` antes do arredondamento fecha isso sem custo.

## Observações fora do escopo deste diff

- **Javadoc desatualizado** em `SinapiAllocationCalculator.java:16` ("a confirmação que usa esta regra é da tarefa 5") — sugestão da rodada 1 não aceita nas decisões; segue valendo.
- **Prévia do front pode lançar `RangeError` na renderização com área enorme** (`sinapi-form.component.ts:131` → `allocateCents` exige `Number.isSafeInteger`, `sinapi-allocation.ts:76`). É código da tarefa 4, não tocado aqui, mas a nova regra de limite do back torna o espelhamento no front mais necessário. Candidata a Issue de manutenção.
- **JSON malformado não devolve `ApiErrorResponse`** — não há handler de `HttpMessageNotReadableException` no `GlobalExceptionHandler`; o teste novo fixa apenas status e header. Gap pré-existente frente a `architecture.md:385-396`.
- `@MockBean` (usado em `BudgetSinapiConfirmationIntegrationTest:93-95`) está depreciado no Boot 3.4+ em favor de `@MockitoBean`; pré-existente.
- Continua de pé a pendência da rodada 1: `ExpenseRegistrationIntegrationTest` com 9 falhas na suíte completa do backend, sem causa confirmada.

## Pontos verificados e corretos

- **Interceptor:** `/api/budgets/*/sinapi/**` casa `GET .../sinapi/references` e `POST .../sinapi/confirm` e não casa `PUT .../categories/{id}`; `preHandle` roda antes da leitura do corpo e devolve `true`, então erros de parse seguem o fluxo normal. O handler local e a dependência de `GlobalExceptionHandler` saíram do controller (`BudgetController.java:27-30`), que continua magro.
- **Limite:** `9999999999999.99` é o maior `NUMERIC(15,2)` (`V1__baseline_schema.sql:50`), a comparação é inclusiva (`> 0`), e depois dela `longValueExact()` não tem como estourar; `IllegalArgumentException` cai em `allocate` (`BudgetService.java:269-275`) e sai como 400 antes do SIDRA, como os testes de integração exigem.
- **Filtro `hasBudget`:** `sinapi-form.component.ts:125-126` filtra só a prévia; `hasBudget: true` com zero continua "preservado", `hasBudget: false` não aparece, e a confirmação segue enviando todas as categorias (o servidor cria as sem teto, como decidido).
- **`close()`:** sai cedo com `saving()` do filho, `viewChild` resolve o componente, X/Escape/`cancelled` passam todos por `close()`, nenhum `computed` escreve estado, e a recarga ocorre uma vez (`budgets-page.component.spec.ts:584-593`: `getOverview` 1 → 2).
- **Testes:** os novos casos de backend e front são RED reais (o de 1e13 não lançava nada, o de 1E17 lançava `ArithmeticException`, JSON malformado e PUT sem header não tinham header, a prévia marcava `hasBudget: false` como preservada, e o X fechava durante o envio). Só `acceptsTheLargestTotalThatFitsNumeric15_2` não é RED — é guarda de fronteira, legítima.
- **Schema:** nenhuma migration no diff (`git diff --cached --name-status bf9959e`), nenhum `ddl-auto` alterado, e a suíte do front inteira verde.
