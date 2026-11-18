# Parecer de Conformidade — Tarefa 3, rodada 2

**Veredito:** APROVADO

**Ressalva:** o shell foi negado nesta sessão (`permission.rejected`), então não rodei `git diff` nem `ng test`. Os diffs foram lidos a partir do `git diff --cached 1abf67b` que o despacho informou, e o resto por leitura estática. A aprovação depende de `ng test` passar nos dois specs. Quem orquestra precisa confirmar isso antes do PR.

## Critérios verificados

| Critério (da spec / plano) | Situação | Onde |
| --- | --- | --- |
| Apontamento 1 (r1): o teste do formulário não reimplementa o `timeout(15000)`; o mock devolve o erro | atendido | `budget-form-modal.component.spec.ts:291-294` (`throwError(() => new TimeoutError())`); nenhum `timeout(` restou no arquivo |
| Apontamento 1 (r1): asserção vacua `budget-form-submit` nulo removida | atendido | ausente no `it` de `:290-324`; as ocorrências restantes são `:399` e `:460`, em outros testes |
| Apontamento 1 (r1): asserção vacua `setBudget` não chamado removida | atendido | ausente no `it` de `:290-324` |
| Asserções que sobraram são verdadeiras e provam algo | atendido | `:309` (chamada única com `project-1, PR, 2026-09, 7101`); `:310-314` (loading nulo, `sinapi-error` e `sinapi-retry` presentes, prévia nula, `sinapi-finish` desabilitado). Esse último vale porque o `finish` é desabilitado em `sinapi-form.component.ts:117`, e só é habilitado no `subscribe` de sucesso (`:137`); no `catchError` (`:126-130`) ele continua desabilitado |
| Asserções após a repetição | atendido | `:319-323` (duas chamadas, último argumento `7101`, erro some, `sinapi-finish` habilitado, duas opções) |
| CA5 / plano T3 (1): timeout no formulário exibe erro com nova tentativa | atendido | `budget-form-modal.component.spec.ts:290-324`; estado em `sinapi-form.component.html:48-57`, `catchError` em `sinapi-form.component.ts:126-130` |
| Plano T3 (2): serviço prova 15 s e erro `TimeoutError` | atendido | `budget.service.spec.ts:94-106`: `tick(14999)` deixa `failure` indefinido; `tick(1)` gera `toBeInstanceOf(TimeoutError)`; `req.cancelled` verdadeiro |
| Plano T3: `.pipe(timeout(15000))` no lugar da opção do `HttpClient` | atendido | `apps/web/src/app/core/services/budget.service.ts:3` (import), `:26-28` (fora do diff desta rodada, já presente) |
| Plano T3: teste do serviço foi RED antes da mudança | não verificado | Por leitura, o `HttpClientTestingBackend` ignora a opção `timeout`, então sem `.pipe(timeout)` o teste não recebe erro em 15 s. Não rodei para confirmar |
| CA5: "impede a confirmação até obter valor válido" | atendido no escopo da tarefa | Não existe botão de confirmação na aba SINAPI nesta tarefa (ele vem nas tarefas 4 e 5). O que o teste prova hoje é prévia oculta e `sinapi-finish` desabilitado após o erro |
| Escopo: nada fora da tarefa foi alterado | atendido | `git diff --cached 1abf67b --stat`: só `budget.service.spec.ts` e `budget-form-modal.component.spec.ts`, ambos `.spec.ts` |

## Apontamentos

Nenhum apontamento bloqueante.

## Sugestões (não bloqueiam)

1. **`budget.service.spec.ts:94`:** o título "with a retryable error" usa "retryable", mas o serviço não tem retry (ele fica no formulário). Já tinha sido sugerido na r1; não é bloqueante.
2. **`budget-form-modal.component.spec.ts:290`:** o título diz "keeps the preview hidden until a retry succeeds", mas o teste não verifica a prévia depois da repetição (`:319-323` cobre só o `finish` e o erro). Se quiser que o título bata com o que é provado, troque por algo como "shows the retryable error when the SINAPI lookup times out and enables the finish selection after a retry".

## Observações fora do escopo

- O shell foi negado, então o RED do serviço e a execução dos specs ficam como pendência do orquestrador (ver ressalva acima).
- `plan.md` continua com as tarefas 2 e 3 em `[ ]`. Isso é do fechamento da tarefa 3, não desta rodada.
