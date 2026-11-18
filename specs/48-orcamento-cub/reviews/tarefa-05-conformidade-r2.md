# Parecer de Conformidade — Tarefa 5 (Issue 48, US15), rodada 2

**Veredito:** APONTAMENTOS

> **Limitações desta verificação**
> - O shell foi recusado (`permission.rejected`). Não rodei `git diff --cached 5ec086b…` nem `git diff --cached bf9959e`, e **não executei a suíte** (`mvn test`, `npm test`). Li os arquivos da árvore de trabalho; não há como eu afirmar por conta própria que eles são idênticos ao índice.
> - Portanto a suíte continua como **pendência de verificação**, não como critério atendido.

## Critérios verificados

| Critério | Situação | Onde |
| --- | --- | --- |
| **Ap. 1** — prévia não marca como preservada categoria só com despesa | atendido | `sinapi-form.component.ts:125-127` (`.filter(row => row.hasBudget)`); teste novo `sinapi-form.component.spec.ts:250-269` |
| **Ap. 1** — `hasBudget: true` com valor zero continua preservado | atendido | `sinapi-form.component.spec.ts:236-248`; template `sinapi-form.component.html:100-101` |
| **Ap. 1** — servidor não cria teto para categoria sem teto ativo que só tem despesa | atendido | `BudgetService.java:225-243` (só `budgets` ativos contam como preservados) |
| **Ap. 2** — `no-store` restrito ao fluxo SINAPI | atendido | `SinapiNoStoreConfiguration.java:19-22` (`/api/budgets/*/sinapi/**`) |
| **Ap. 2** — handler local do `BudgetController` removido; PUT volta ao comportamento anterior | atendido | `BudgetController.java:1-66` (sem `@ExceptionHandler`); teste `BudgetControllerTest.java:374-382` (`doesNotExist("Cache-Control")`) |
| **Ap. 2** — POST de confirmação com `no-store` no sucesso, na validação e no conflito | atendido | `BudgetControllerTest.java:336-372` |
| **Ap. 2** — `no-store` também em erro de parse de JSON | atendido (interceptor roda em `preHandle`, antes da leitura do corpo) | `SinapiNoStoreConfiguration.java:26-29`; teste `BudgetControllerTest.java:384-390` |
| **Ap. 2** — GET de referências com `no-store` | atendido | `BudgetControllerTest.java:160`, `:185`, `:198` |
| **Ap. 3** — fechar pelo botão/Escape/Cancelar durante o envio fica bloqueado | atendido | `budget-form-modal.component.ts:204-210`; `budget-form-modal.component.html:19`, `:50`; teste `budget-form-modal.component.spec.ts:284-294` |
| **Ap. 3** — recarga do painel ao concluir | atendido | `budget-form-modal.component.html:50` (`(confirmed)="sinapiConfirmed.emit()"`) → `budgets-page.component.html:232` (`onBudgetSaved()`) → `budgets-page.component.ts:134-141`; teste `budget-form-modal.component.spec.ts:296-299` |
| **Ap. 3** — a resposta do lote não se perde por *nenhum* caminho de saída do formulário | **não atendido** (ver apontamento 1) | `budget-form-modal.component.html:30-35`; `budget-form-modal.component.ts:102-114` |
| **Ap. 4** — total acima de `NUMERIC(15,2)` vira 400 com mensagem própria | atendido | `SinapiAllocationCalculator.java:22-23`, `:52-54`; `BudgetService.java:269-274`; testes `SinapiAllocationCalculatorTest.java:122-129`, `BudgetSinapiConfirmationIntegrationTest.java:267-275` |
| **Ap. 4** — estimativa enorme não estoura mais em 500 | atendido | `SinapiAllocationCalculatorTest.java:131-138`; `BudgetSinapiConfirmationIntegrationTest.java:257-265` |
| **Ap. 4** — limite é checado antes da consulta ao SIDRA, então não sai 409 de "custo mudou" | atendido | `BudgetService.java:203-204` (allocate) antes de `:206-213` (comparação); testes asseguram `verifyNoInteractions(sidra)` |
| **Ap. 4** — maior total que cabe em `NUMERIC(15,2)` é aceito | atendido | `SinapiAllocationCalculatorTest.java:140-147` |
| **Ap. 4** — rollback do lote continua provado | atendido | `BudgetSinapiConfirmationIntegrationTest.java:277-290` (inalterado); `BudgetService.java:215` (`TransactionTemplate`) |
| CA3 — cria teto só com parcela positiva e sem teto ativo; excluídas sem redistribuição | atendido | `BudgetService.java:230-243`; testes `:133-143`, `:184-199` |
| CA4 — revalidação dentro da transação, preserva tetos criados após a prévia, repetição, obra do proprietário | atendido | `BudgetService.java:215`, `:223-244`, `:196-197`; testes `:156-168`, `:170-182`, `:201-214` |
| Plano — 200 OK; 400 para ordem fora do PRD; 400 para custo negativo antes do banco | atendido | `BudgetController.java:54-59`; `BudgetService.java:247-267`; `SinapiConfirmDTO.java:21-22`; testes `:216-237` |
| Migration — nenhuma criada | atendido | `db/migration` vai de `V1` a `V13`; nenhuma `V14` |
| Escopo — nada além dos quatro ajustes | atendido no que li | ver observações |

## Apontamentos

1. **Trocar para a aba "Orçamento padrão" durante o envio do SINAPI destrói o formulário e perde a recarga — o mesmo dano do apontamento 3, por um caminho que ficou aberto.**
   - `apps/web/src/app/features/budgets-page/components/budget-form-modal/budget-form-modal.component.html:30-35`: a aba "Orçamento padrão" não tem `[disabled]`, e o clique faz `sinapiOpen.set(false)`. O `@if` de `:47-50` então remove o `app-sinapi-form`, que é justamente o dono do `confirmed` que dispara a recarga.
   - `budget-form-modal.component.ts:102-114`: o `onBudgetTabKeydown` também permite ir para a aba padrão durante o envio (a guarda `if (next && sinapiTab.disabled) return;` só vale no sentido padrão → SINAPI).
   - Depois disso, `close()` (`budget-form-modal.component.ts:204-210`) já não bloqueia nada, porque `sinapiForm()` é `null` e `?.saving()` é `undefined`: o modal pode ser fechado com o lote em voo.
   - Evidência do efeito: `sinapi-form.component.ts:233-242` assina a confirmação **sem** `takeUntilDestroyed` e chama `this.confirmed.emit()` no `next` de uma instância já destruída — o `OutputEmitterRef` destruído não entrega o evento (e, no modo de desenvolvimento do Angular, lança "Unexpected emit for destroyed `OutputEmitterRef`"). Resultado: `sinapiConfirmed` (`budget-form-modal.component.html:50`) nunca sobe, `onBudgetSaved()` (`budgets-page.component.ts:134-141`) não roda e o painel fica desatualizado com o lote já gravado no servidor.
   - Critério violado: `plan.md:21` ("Após confirmar, a página recarrega os tetos") e decisão aceita na rodada 1 (`tarefa-05-decisoes-r1.md:7`: "a resposta ainda precisa chegar ao painel"), além de "Abandono no meio" da spec (`spec.md:35`: "o orçamento da obra informa quais valores foram salvos").
   - O teste `budget-form-modal.component.spec.ts:247-300` cobre botão, Escape e Cancelar, mas não a troca de aba, então o caso não é pego.

## Sugestões (não bloqueiam)

- O teste que prova o bloqueio (`budget-form-modal.component.spec.ts:247-300`) poderia acrescentar a troca de aba (clique em `budget-form-standard` e `ArrowLeft`/`Home` no tablist) à mesma sequência, fechando o apontamento 1.
- O Javadoc de `SinapiAllocationCalculator.java:16` ainda diz "Sem estado e sem endpoint nesta etapa: a confirmação que usa esta regra é da tarefa 5" — a menção à tarefa já está desatualizada desde a rodada 1 (sugestão de código, não repetida como bloqueio).

## Observações fora do escopo

- `BudgetControllerTest.java:57-59` usa `@WebMvcTest(BudgetController.class)` com os filtros de segurança desligados (`:58`). O `no-store` das asserções depende de o `SinapiNoStoreConfiguration` entrar no slice MVC — o `WebMvcTypeExcludeFilter` inclui `WebMvcConfigurer`, mas isso só fica comprovado com a suíte rodando; não rodei.
- `BudgetControllerTest.java:336-390` e `BudgetSinapiConfirmationIntegrationTest.java:257-290` são as provas que citei; **não foram executados nesta revisão** (shell recusado). Confirmar com `mvn -f apps/api/pom.xml test` e `npm test` em `apps/web` antes da triagem.
- Não consegui inspecionar o índice: se houver alteração não encenada em relação a `5ec086b`, minha leitura pode divergir do que será commitado.
