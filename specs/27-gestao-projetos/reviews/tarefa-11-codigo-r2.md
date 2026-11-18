# Parecer de Código — Tarefa 11 — Rodada 2

**Veredito: APROVADO**

Diff contra `d2d5b51`: `128 insertions(+), 0 deletions`, restrito aos dois specs de teste. O backend está **byte-a-byte** com o que revisei na rodada 1 (mesmas 39 linhas adicionadas, nenhuma alteração nova). Nenhuma produção tocada, nenhum teste existente enfraquecido, nenhum `@Disabled`. (As suítes continuam sem execução possível neste ambiente — shell liberado só para `git`; a análise é estática.)

## Os quatro ajustes — fechados

| Item r1 | Status | Verificação |
| --- | --- | --- |
| **#1** criação com tipo ausente não isolava o tipo | **Fechado** | `spec.ts:219-229`: `switchToCreateMode()` → `name.setValue('Nova obra')` (válido, 9 chars) → `setTypeToNull()`. O form fica inválido **só** pelo tipo. Se `type` perder o `Validators.required`, `hasError('required')` em `:227` cai — vermelho. Se `save()` deixar de bloquear, `form.invalid` continua `true` (passa), mas `createProject` é chamado e `expectNothingWasSaved()` (`:228`) cai, além do `TypeError` no `subscribe` do spy sem retorno. Sem falso positivo. |
| **#2** `switchToCreateMode()` não provava o modo | **Fechado** | `spec.ts:149-153`: afirma `textContent` contendo "Cadastrar nova obra". O heading do template é `project() ? 'Editar obra' : 'Cadastrar nova obra'` (template:5), e no fixture deste componente essa string só existe ali — a assertiva distingue os modos de fato. |
| **#4** `form.invalid` genérico não fixava o validador | **Fechado** | `expectInvalidNameBlockedSubmission('required' \| 'minlength')` (`:167-173`), com o mapeamento correto nos quatro casos: `''` → `required` (`:180`, `:207`); `'AB'` → `minlength` (`:188`, `:216`). Confere com o Angular: `minLength` ignora vazio (`isEmptyInputValue`), então `''` produz apenas `required`; `'AB'` produz apenas `minlength`. O parâmetro é union literal, sem `any` nem string solta. |
| **#6** cast/comentário duplicados e comentário que não dizia a origem do nulo | **Fechado** | `setTypeToNull()` (`:155-159`) centraliza cast e comentário; o texto agora explica a origem ("o select não oferece opção vazia e o controle é `nonNullable`") e o propósito (provar que `save()` bloqueia). O `as unknown as` continua necessário e justificado — `null!` seria a única alternativa mais curta, e não vale reabrir. |

## Achados novos ou remanescentes relevantes

| # | Severidade | Local | Descrição | Impacto |
| --- | --- | --- | --- | --- |
| A | **Baixo** | `spec.ts:152` | A assertiva do heading acopla o helper a uma string de copy do template. | É o mesmo padrão já usado no arquivo (`:235` "Definir Orçamentos") e a string é um heading estável; `component.project()` nulo seria acoplamento menor, mas não há ganho material. **Dívida aceitável**, não bloqueia. |
| B | **Baixo** | `spec.ts:196-198` e `226-228` | O bloco de três assertivas do tipo continua duplicado; não existe `expectInvalidTypeBlockedSubmission` (item #3 da r1 ficou **parcialmente** endereçado — o cast/comentário foi centralizado, o bloco de assertivas não). | Manutenção: mudança na verificação de tipo exige editar dois testes. Duplicação explícita em teste é aceitável; registrar como dívida. |
| C | **Baixo** | `spec.ts:175-229` | Os testes ainda chamam `component.save()` direto, sem submeter o formulário (item #7 da r1). | `(ngSubmit)`/`type="submit"` seguem sem cobertura; padrão preexistente do arquivo. Dívida. |
| D | **Baixo** | `spec.ts:172` | `textContent` global para a mensagem de nome (item #5 da r1), sem `data-testid` (§9.1 do architecture). | Dívida aceitável; copy alterada quebra 4 testes. |
| E | **Baixo** | `ProjectValidationTest.java:79-115` | Duplicação da cadeia de assertivas e dos três casos entre POST e PUT (item #8), sem o javadoc de camada de `ProjectControllerTest` (item #9), sem caso de `status` ausente (item #10) e com `hasItem` sem fixar a contagem de `fieldErrors` (item #11). | Permanecem idênticos à r1; nenhum bloqueia. |

**Nenhum achado médio ou alto novo.** Não há bloqueador.

## Dívidas explicitamente deferidas (não bloqueiam)

- R1 #5 (escopo do `textContent`), #7 (`save()` direto), #8–#11 (backend): inalteradas.
- R1 #3: parcialmente endereçada (cast centralizado); o bloco de assertivas do tipo segue duplicado.
- Fora do escopo, mantidas: template sem mensagem visível para tipo inválido; tipo nulo inalcançável pela UI; architecture × Karma/Vitest; `@MockBean` deprecado.

## Conclusão

Os itens #1, #2, #4 e #6 estão fechados sem falso positivo introduzido; o caso "criação com tipo ausente" agora falha tanto se o tipo deixar de ser obrigatório quanto se `save()` deixar de bloquear. Aprovo a tarefa com as dívidas acima registradas.
