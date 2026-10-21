# Decisões da Tarefa 11 — Rodada 1

## Recorte aprovado antes da implementação

| # | Decisão | Justificativa |
| --- | --- | --- |
| 1 | Testar o submit inválido em **criação e edição** | O CA6 fala em “salvar ou editar”; os caminhos chamam `createProject` e `updateProject`, e só os dois provam o critério inteiro. |
| 2 | Para “sem tipo” no frontend, **manter o default** e forjar `type = null` programaticamente | O `<select>` nasce com `NEW_CONSTRUCTION` e não tem opção vazia; o usuário não consegue limpar o tipo. O backend é a prova autoritativa do caso. Adicionar opção vazia/mensagem seria mudança de UX fora do escopo. |
| 3 | PUT inválido no backend com **três casos** (nome em branco, nome curto, tipo ausente), todos com `status` válido | Espelha o teste de POST existente e cobre exatamente os casos do CA6. `status` ausente é obrigatório no DTO, mas não é citado pelo critério; fica fora do recorte. |

## Triagem da rodada 1

Pareceres: `tarefa-11-conformidade-r1.md` (**APROVADO**, com baixos) e `tarefa-11-codigo-r1.md` (**APROVADO COM RESSALVAS**, todos baixos, sem bloqueadores).

| Achado | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- |
| #1 — criação com tipo ausente deixava o nome vazio e não isolava o tipo | código | **corrigir** | O teste prometia provar “sem tipo” e poderia passar por causa do nome. Como a tarefa é de prova, o caso precisa isolar o tipo. |
| #2 — `switchToCreateMode()` não afirmava o modo | código | **corrigir** | Sem a afirmação, os testes de criação poderiam virar cópias dos de edição se o `effect` deixasse de reagir. A asserção pelo título renderizado prova o modo. |
| #4 — `form.invalid` genérico não fixava `required`/`minlength` | código | **corrigir** | Um validador trocado por outro que também invalide passaria; a chave específica fecha o falso positivo. |
| #6 — cast/comentário do tipo duplicados | código | **corrigir** | O helper `setTypeToNull()` centraliza o cast e explica a origem do estado inválido, sem `any`. |
| #3 — bloco de assertivas do tipo duplicado | código | **aceitar como dívida** | O helper centralizou o cast; a duplicação restante é explícita e de baixo custo. |
| #5 — `textContent` global para a mensagem de nome | código | **aceitar como dívida** | Segue o padrão já existente no arquivo; a string é única hoje. |
| #7 — testes chamam `save()` direto, sem `(ngSubmit)` | código | **aceitar como dívida** | Padrão preexistente do spec; o recorte aprovado exercita `save()` + `detectChanges()`. |
| #8–#11 — duplicação POST/PUT, javadoc de camada, `status` ausente, `hasItem` sem contagem | código | **aceitar como dívida** | Baixos, fora do CA6 ou de completude do contrato; `status` ausente não é citado pelo critério. |
| Tipo sem mensagem/destaque no frontend | conformidade | **aceitar como dívida** | Decisão #2: a UI não permite limpar o tipo; o backend rejeita o payload forjado. |
| Nome composto só por espaços não coberto no frontend | conformidade | **aceitar como dívida** | Fora dos três casos aprovados; o backend rejeita e persiste a prova em `ProjectValidationTest`. Dívida de UX. |

**Nenhuma alteração de produção foi necessária.** Os testes passaram contra o comportamento existente; a tarefa fechou lacunas de prova.

## Estado da rodada 1

- Frontend: **106/106**, build OK (warning de budget pré-existente).
- Backend: **23/23**, BUILD SUCCESS.
- Arquivos alterados: apenas os dois specs previstos.
- Nenhum commit nesta rodada.
