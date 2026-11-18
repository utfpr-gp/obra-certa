# Parecer de Código — Tarefa 11 — Rodada 1

**Veredito: APROVADO COM RESSALVAS**

Somente leitura: li `docs/architecture.md`, o diff inteiro de `d2d5b51`, os dois arquivos completos, o componente + template do modal, `ProjectUpdateDTO`/`ProjectCreateDTO`, `ProjectController`, `ProjectService` e `GlobalExceptionHandler`. **Não consegui executar as suítes**: o terminal deste ambiente só libera `git` — `mvnw`/`npm test` retornaram *permission denied*. A análise abaixo é estática, mas cobre o comportamento alegado.

## Confirmações de escopo e de força

- Diff composto **exclusivamente** pelos dois specs: nenhuma produção alterada, nenhum teste existente enfraquecido, nenhum `@Disabled`, nenhum `skip`. `git status` confirma só os dois `M`.
- **Os testes falham se `save()` deixar de bloquear** (conferi o caminho): sem o `if (this.form.invalid) return`, o spy é chamado e `expectNothingWasSaved` cai. Ressalva: o spy devolve `undefined` e o `request.subscribe` estoura `TypeError` antes da assertiva — o teste fica vermelho, mas pelo motivo errado; a mensagem de falha não aponta a regressão.
- **`touched` + `invalid` são os sinais certos**: o template usa exatamente `form.controls.name.touched && form.controls.name.invalid` (template:14 e 17), e `touched` só pode vir do `markAllAsTouched()` dentro de `save()` — `setValue` não toca. Boa escolha.
- **Interação com o `effect` está na ordem correta**: `switchToCreateMode()` → `detectChanges()` (o `effect` roda e faz `form.reset` + limpa `errorMessage`) → só então `setValue`. Se a ordem fosse invertida, o reset apagaria a montagem; no caso do tipo o teste quebraria alto (`hasError('required')` falharia), o que é o comportamento desejado. Não há teste passando por causa do reset.
- **Backend**: `put("/api/projects/project-1")` bate com `@PutMapping("/{id}")` + `@PathVariable String`; `RENOVATION`/`IN_PROGRESS` são válidos nos enums; os campos `path`, `status`, `error`, `message` coincidem com `GlobalExceptionHandler` e a mensagem de `ProjectUpdateDTO`. `verifyNoInteractions(projectService)` é o sinal correto para "não persistiu" **nesta camada** (service mockado; persistir exigiria chamar o service). Estilo 4 espaços, imports e nomes consistentes com `ProjectControllerTest`/teste POST preexistente.

## Achados

| # | Severidade | Arquivo:linha | Achado | Impacto |
| --- | --- | --- | --- | --- |
| 1 | Baixo | `project-modal.component.spec.ts:213-224` | O teste "blocks the creation when the type is missing" deixa o **nome vazio** (o reset de criação preenche `''`), então o formulário já está inválido por nome. A assertiva `hasError('required')` no tipo ainda prova que o `Validators.required` existe, mas o teste não isola "sem tipo bloqueia" — o título promete mais do que ele demonstra. | Se `save()` passasse a checar só o nome, este teste continuaria verde (o de edição ainda pegaria, via `TypeError`). Correção de 1 linha: preencher nome válido antes de anular o tipo. |
| 2 | Baixo | `project-modal.component.spec.ts:149-152` | `switchToCreateMode()` não afirma que o modo mudou (nem `component.project()` nulo, nem título "Cadastrar nova obra"). | Se o `effect` deixar de reagir a `project()`, os três testes de criação viram cópias dos de edição sem falhar. Mitigado pelos testes preexistentes (110-140) que provam o caminho `createProject`, por isso é baixo. |
| 3 | Baixo | `project-modal.component.spec.ts:183-193` e `213-224` | Bloco de assertiva do tipo duplicado nos dois modos; não há `expectInvalidTypeBlockedSubmission` análogo ao helper de nome. O cast + comentário também aparecem duas vezes. | Manutenção: qualquer ajuste na verificação de tipo precisa ser feito em dois lugares. |
| 4 | Baixo | `project-modal.component.spec.ts:161` | `expect(component.form.invalid).toBeTrue()` é genérico e não fixa o validador de cada caso; a distinção `required` vs `minlength` só existe implicitamente pelo par de testes. | Um validador trocado por outro que também invalide (ex.: `pattern`) passaria. Assertiva por chave (`hasError('required')` / `hasError('minlength')`) fecharia. |
| 5 | Baixo | `project-modal.component.spec.ts:164` | `fixture.nativeElement.textContent` varre o host inteiro, sem escopo ao campo. `docs/architecture.md` §9.1 recomenda `data-testid` para resiliência. | A string é única hoje e o padrão `textContent` já existe no arquivo (linha 230), então não há falso positivo atual; mas mudança de copy quebra 4 testes e a assertiva não garante que a mensagem está junto do input de nome. Dívida aceitável. |
| 6 | Baixo | `project-modal.component.spec.ts:186, 217` | `null as unknown as ProjectType`: o cast é **necessário e justificado** (o controle é `nonNullable`, `setValue` tipa `ProjectType`, e `reset()` restauraria o default em vez de `null`). O comentário, porém, explica o *porquê* do cast e não *de onde* viria um tipo nulo em runtime, e o cast duplo é repetido. | Nada bloqueia. Alternativas sem `any`/`@ts-ignore`: `null!` ou um helper `setTypeToNull()` que concentre cast + comentário uma vez. |
| 7 | Baixo | `project-modal.component.spec.ts:167-224` | Os testes chamam `component.save()` direto, não submetem o formulário; `(ngSubmit)` e `type="submit"` não são exercitados. Consistente com o restante do arquivo. | Se o `(ngSubmit)` do template sumir, nenhum teste do spec cai. O plano fala em "quando submete o formulário" — um único caso via `dispatchEvent(new Event('submit'))` cobriria o fio. |
| 8 | Baixo | `ProjectValidationTest.java:79-115` | Duplicação quase integral do teste POST: cadeia de 8 assertivas e o triplete de casos repetidos (só muda o verbo, a URL e `location`↔`status`). | Já existe precedente de helper no repo (`assertNotFoundPayload` em `ProjectControllerTest:84`); extrair `assertValidationErrorPayload(...)` alinharia e reduziria a chance de o PUT e o POST divergirem. Duplicação aceitável, mas é a única dívida relevante do diff. |
| 9 | Baixo | `ProjectValidationTest.java:97` | `verifyNoInteractions` prova "controller não delegou", não "banco não escreveu". Correto para `@WebMvcTest`, mas a classe não tem o javadoc de camada que `ProjectControllerTest:27-32` tem. | Leitor futuro pode superestimar a prova. Um javadoc de 3 linhas resolve. |
| 10 | Baixo | `ProjectValidationTest.java:100-115` | Nenhum caso com `status` ausente, embora `ProjectUpdateDTO` tenha `@NotNull` em `status`. | Fora do texto do CA6/plano (nome e tipo); só completude do contrato. |
| 11 | Baixo | `ProjectValidationTest.java:94-95` | `hasItem(...)` em `fieldErrors` não fixa a quantidade de erros; um campo extra inesperado passaria. | Baixo risco: o payload de validação é determinístico. |

## Dívida aceitável (o que **não** bloqueia)

- Duplicação POST/PUT (item 8) e helper de tipo ausente (item 3): em teste, cópia explícita é frequentemente preferível a abstração prematura; aqui há dois casos, então a extração seria ganho, não necessidade.
- `textContent` (item 5) e `save()` direto (item 7): seguem o padrão já estabelecido no spec; não introduzem fragilidade nova.
- `null as unknown as` (item 6): sem alternativa limpa real, dado o `nonNullable`; o comentário impede que o próximo leitor "conserte" o cast.

## Respostas diretas às perguntas do despacho

1. **Qualidade**: nomes claros e no mesmo inglês do arquivo; assertivas fortes (serviço + obra ativa + estado do form + mensagem). Robusto o suficiente; ver itens 1, 4 e 5.
2. **Cast**: justificado e comentado; único ponto é o cast duplo repetido e o comentário não citar a origem do `null` (item 6).
3. **Estrutura**: helpers legíveis e sem estado compartilhado; ficam no meio do `describe` (linha 142), o que é permitido mas foge do layout do resto do arquivo — cosmético.
4. **`effect`**: ordem correta e reset não apaga a montagem; os testes de criação não afirmam o modo (item 2).
5. **Backend**: `path`/`status` corretos; `verifyNoInteractions` é suficiente **na boundary MVC** (a prova de persistência real já reside em `ProjectLifecycleTest`); o custo é duplicação (item 8) e falta de javadoc de camada (item 9).
6. **Escopo**: limpo — só testes, nenhum enfraquecido, nenhum `@Disabled`.
7. **Manutenção**: quebram de forma **ruim** — mudança na copy de "Informe um nome com ao menos 3 caracteres." (4 testes), na mensagem de validação do DTO em inglês, em "Validation failed", no `nonNullable` do form ou no default de `ProjectType` (o cast continua compilando; o estado nulo passaria a ser "legítimo" e o comentário ficaria obsoleto). Reagem bem a: remoção de `@Valid` no PUT, remoção de `Validators.required` de `name`/`type`, remoção do `if (this.form.invalid) return` — todos ficam vermelhos.

## Observações fora do escopo deste diff

1. **Template não destaca erro de tipo** (`project-modal.component.html:18-22` não tem bloco de mensagem): o CA6 pede "destaca as pendências"; para tipo, só existe a borda vermelha do nome. Os testes de tipo, corretamente, não inventam uma mensagem — mas a lacuna de produção fica registrada. Candidata a Issue.
2. **Tipo nulo é inalcançável pela UI**: o `<select>` só oferece 3 opções e o form é `nonNullable`. Os dois testes de tipo documentam defesa em profundidade, não um caminho do usuário. Vale comentário explícito para não gerar dúvida futura.
3. `docs/architecture.md` §9.1 declara **Vitest**, mas `apps/web/package.json` usa **Karma/Jasmine** (`ng test`, `@types/jasmine`, `karma-*`). Divergência de documentação, pré-existente.
4. `@MockBean` está deprecado no Spring Boot atual (o projeto declara 4.1.x). Pré-existente em todos os `@WebMvcTest` da casa — candidata a Issue de manutenção.
5. `project-modal.component.spec.ts:110-117` ainda repete o par `setInput('project', null); detectChanges()` inline; poderia consumir o novo `switchToCreateMode()`. Preexistente, não deve ser mexido nesta tarefa.
