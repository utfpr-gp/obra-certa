# Parecer de Conformidade — Tarefa 11 — Rodada 2

**Veredito:** APROVADO

## Delta da rodada 1

| Achado aprovado | Correção no diff atual | Situação |
| --- | --- | --- |
| **#1** — criação com tipo ausente não isolava o tipo | `name = 'Nova obra'` é definido **antes** de `setTypeToNull()` | **Fechado** — `project-modal.component.spec.ts:219-229`; nome válido, o único erro restante é o tipo |
| **#2** — `switchToCreateMode()` não provava o modo | Passou a asserir `'Cadastrar nova obra'` no DOM após o `detectChanges()` | **Fechado no escopo do achado** — `spec.ts:149-153`; o texto vem do template condicionado a `project()` (`project-modal.component.html:5`) |
| **#4** — `form.invalid` genérico | `expectInvalidNameBlockedSubmission('required' \| 'minlength')` com `name.hasError(errorKey)` | **Fechado** — `spec.ts:167-173`; chaves usadas em `:180, 188, 207, 216` |
| **#6** — cast duplicado | `setTypeToNull()` centraliza cast e comentário | **Fechado** — `spec.ts:155-159`; usado pelos dois testes de tipo |

## Confirmações

1. **Isolamento do tipo na criação:** confirmado. O formulário de criação é resetado, recebe `name = 'Nova obra'` (válido para `required` e `minLength(3)`), e só então o tipo vira `null`. `form.invalid`, `type.hasError('required')` e `expectNothingWasSaved()` provam que `save()` bloqueia e que `createProject`, `updateProject` e `setActiveProject` não são chamados. Se `save()` passasse a validar só o nome, o spy de `createProject` seria acionado e o teste falharia.
2. **Prova do modo criação:** o título é lido do DOM e o template o deriva de `project()`; portanto a assertiva prova que a troca de modo chegou à renderização, não apenas que `setInput` foi chamado. **Precisão:** o título não prova o `form.reset` executado pelo `effect` — se o efeito parar de resetar, o título continua correto. Isso não afeta o CA6 porque os testes de criação montam explicitamente os campos que usam; fica como dívida baixa de cobertura do estado inicial de criação.
3. **Chaves `required`/`minlength`:** corretas nos dois modos. Nome vazio (`''`) → `required` (`:180, :207`); nome curto (`'AB'`) → `minlength` (`:188, :216`). O caso vazio também gera `minlength`, mas a chave assertada é a que identifica o erro esperado.
4. **CA6 continua coberto nos três verbos:** ver tabela abaixo. O PUT inválido segue coberto e o arquivo backend está intacto desde a rodada 1.
5. **Escopo:** o delta da rodada 2 está só no spec frontend; o backend mantém as 39 linhas da rodada 1; não há produção alterada, teste removido/enfraquecido, `@Disabled` ou foco.

## Cobertura final do CA6

| Verbo | Criação | Edição | Prova |
| --- | --- | --- | --- |
| **Impede a gravação** | nome vazio, nome curto e tipo nulo | idem | `save()` retorna em `project-modal.component.ts:52-54`; os testes provam `hasError` e ausência de chamadas |
| **Destaca as pendências** | mensagem de nome renderizada + `touched` + erro específico | idem | `spec.ts:162-172`; `project-modal.component.html:17`; tipo sem mensagem segue como decisão aceita |
| **Não persiste** | sem `createProject`/`updateProject`/`setActiveProject` | idem | `spec.ts:161-165` |
| **Backend PUT** | nome em branco, nome curto e tipo ausente com `status` válido | — | `ProjectValidationTest.java:79-115`; `verifyNoInteractions` em `:97`; arquivo intacto |

## Achados novos

| Severidade | Local | Achado |
| --- | --- | --- |
| **Baixo** — precisão, não CA6 | `project-modal.component.spec.ts:149-153` | A assertiva do título prova o modo criação no DOM, mas não o reset do formulário pelo `effect`. Não há teste do estado inicial de criação (`name === ''`, `type === NEW_CONSTRUCTION`). Não compromete os três verbos do CA6 nem o achado #2, que pedia apenas a prova do modo. |

**Nenhum achado bloqueador ou médio.**

## Dívidas que permanecem

- **#3** do parecer de código: os dois testes de tipo ainda duplicam o trio `form.invalid` / `type.hasError` / `expectNothingWasSaved`; `setTypeToNull()` centralizou só o cast e o comentário.
- **#5**: `textContent` do host inteiro para a mensagem de nome; padrão já existente no arquivo.
- **#7**: os testes chamam `save()` diretamente, sem exercitar `(ngSubmit)`; aceito no recorte aprovado.
- **#8–#11** do backend: duplicação POST/PUT, ausência de javadoc de camada no `verifyNoInteractions`, caso de `status` ausente fora do CA6 e `hasItem` sem fixar a quantidade de erros.
- **Conformidade da rodada 1**: tipo sem mensagem/destaque no frontend (decisão aceita) e nome composto só por espaços não coberto no frontend (o backend bloqueia).
- **Nova, baixa**: reset do formulário no modo criação não assertado diretamente.

Nenhuma dessas dívidas compromete o CA6 no recorte aprovado. O frontend reportado em 106/106 é coerente com o delta (nenhum teste novo, apenas assertivas mais fortes); o backend permanece 23/23 e não foi alterado.
