# Parecer de Conformidade — Tarefa 3

**Veredito:** APONTAMENTOS

Observação de método: o shell foi negado neste ambiente (`permission.rejected`), então não rodei `git diff` nem `ng test`. Usei o diff já capturado no despacho (`git diff --cached ed42d3a`) e leitura estática do código. O RED do teste do serviço e a compilação ficam **não verificados**.

## Critérios verificados

| Critério (da spec / plano) | Situação | Onde |
| --- | --- | --- |
| Plano T3: trocar a opção `timeout` do `HttpClient` por `.pipe(timeout(15000))` | atendido | `apps/web/src/app/core/services/budget.service.ts:26-28` (`timeout` removido de `get`, encadeado com `.pipe(timeout(15000))`, import em `:3`) |
| Plano T3 (2): serviço prova o prazo: 14.999 ms sem erro, 1 ms depois com erro | atendido | `apps/web/src/app/core/services/budget.service.spec.ts:94-107` (`tick(14999)` → `failed` falso; `tick(1)` → verdadeiro; `req.cancelled` verdadeiro) |
| Plano T3 (2): teste do serviço foi RED antes da mudança | não verificado | Não rodei o teste. Por leitura, o `HttpClientTestingBackend` ignora a opção `timeout`, então o teste antigo não teria erro em 15 s. Confirmar com `ng test` no commit anterior |
| CA5: tempo limite exibe estado de erro com nova tentativa | atendido | `budget-form-modal.component.spec.ts:290-327`; estado de erro em `sinapi-form.component.ts:126-130` e `sinapi-form.component.html:48-57` (`sinapi-error` e `sinapi-retry`); repetição com sucesso em `:322-327` |
| CA5: "impede a confirmação até obter um valor válido" | **não provado pelo teste** | `budget-form-modal.component.spec.ts:320` (`budget-form-submit` nulo). Ver apontamento 1 |
| Plano T3: `budget-form-modal.component.spec.ts` "se necessário" | atendido | arquivo alterado, tocado dentro do escopo previsto |
| Escopo: nada fora da tarefa foi alterado | atendido | o diff toca só os 3 arquivos previstos. `plan.md` não está no diff e as tarefas 2 e 3 seguem `[ ]` (ver observações) |
| Glossário / padrão do repo: timeout por `pipe(timeout(...))` como `payment.service.ts:30,45,63` | atendido | `payment.service.ts:63` usa o mesmo padrão |

## Apontamentos

1. **O teste diz provar "confirmação bloqueada", mas a asserção é verdadeira por ausência de controle.** — `apps/web/src/app/features/budgets-page/components/budget-form-modal/budget-form-modal.component.spec.ts:320` (e `:322-327`)
   Critério violado: CA5 — "impede a confirmação até obter um valor válido para a seleção atual." Também a regra de "teste que não prova o critério que diz provar".
   Evidência: o trecho da aba SINAPI (`budget-form-modal.component.html:47-49`) renderiza só `<app-sinapi-form>`, e o `budget-form-submit` está no ramo `@else` (`:50` em diante). O próprio `sinapi-form.component.html` só tem os botões "Tentar novamente" (`:54`) e "Cancelar" (`:107-108`). Não existe botão de confirmação na aba SINAPI nesta tarefa (a gravação é da tarefa 5). Logo `expect(query('budget-form-submit')).toBeNull()` passa com ou sem o bloqueio. O teste também não verifica `sinapi-finish` desabilitado após o erro, nem que a prévia não reaparece sem um valor válido. Já `expect(setBudget).not.toHaveBeenCalled()` (`:328`) também é trivial, porque o componente nunca chama `setBudget` nesta tela.
   Correção sugerida ao autor (não feita aqui): ou renomear o teste e remover a afirmação de bloqueio de confirmação (deixando-a para a tarefa 5, que cria o botão), ou afirmar o que de fato bloqueia hoje (`sinapi-preview` nulo e `sinapi-finish` desabilitado após o erro).

## Sugestões (não bloqueiam)

- `budget-form-modal.component.spec.ts:293`: o `timeout(15000)` está dentro do mock (`lookup.pipe(timeout(15000))`), não no componente nem no serviço real. Assim, o teste do formulário prova o tratamento do erro, mas não o prazo. Quem garante os 15 s é o teste do serviço (`budget.service.spec.ts:94-107`), o que está correto. Considere comentar essa divisão no teste, ou usar `throwError(() => new TimeoutError())` no mock para deixar explícito que o formulário só vê o erro.
- `budget.service.spec.ts:94`: o nome "ends a SINAPI lookup without response at 15 seconds with a retryable error" usa "retryable" no serviço, que não tem retry (o retry fica no formulário). Ajuste de nome, sem impacto.

## Observações fora do escopo

- O plano pede "Ao concluir, marcar também a tarefa 2 como feita" (`plan.md:39`). Os checkboxes das tarefas 2 e 3 continuam `[ ]` e o `plan.md` não está no diff. Isso é do fechamento da tarefa 3, não um apontamento agora.
- Não rodei `ng test` nem `tsc` (shell negado). Antes de aprovar, rodar `budget.service.spec.ts` e `budget-form-modal.component.spec.ts` e confirmar que o teste do serviço falha no commit anterior (RED).
