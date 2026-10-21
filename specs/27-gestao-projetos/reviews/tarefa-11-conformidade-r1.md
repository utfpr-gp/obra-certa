# Parecer de Conformidade — Tarefa 11 — Rodada 1

**Veredito:** APROVADO (com ressalvas não bloqueantes)

## Critérios verificados

| Critério (CA6 / Tarefa 11) | Situação | Onde |
| --- | --- | --- |
| Criação: nome vazio bloqueia o salvamento | atendido | `project-modal.component.spec.ts:195-202`; helper `:160-165`; `project-modal.component.ts:52-54` |
| Criação: nome com menos de 3 caracteres bloqueia | atendido | `project-modal.component.spec.ts:204-211` |
| Criação: tipo ausente bloqueia | atendido, por simulação declarada | `project-modal.component.spec.ts:213-224` |
| Edição: nome vazio bloqueia | atendido | `project-modal.component.spec.ts:167-173` |
| Edição: nome curto bloqueia | atendido | `project-modal.component.spec.ts:175-181` |
| Edição: tipo ausente bloqueia | atendido, por simulação declarada | `project-modal.component.spec.ts:183-193` |
| `save()` retorna antes de chamar o serviço | atendido: os três modos/casos provam ausência de chamada | `project-modal.component.spec.ts:154-158` |
| Mensagem de nome realmente renderizada | atendido: `touched` + `invalid` + texto no DOM | `project-modal.component.spec.ts:162-164`; `project-modal.component.html:17` |
| Caminho real `save()` + `detectChanges()` (não apenas `form.invalid`) | atendido | `project-modal.component.spec.ts:144-146, 167-224` |
| Não persiste no cliente (create/update/setActive) | atendido nos dois modos | `project-modal.component.spec.ts:154-158` |
| Backend PUT nome em branco | atendido | `ProjectValidationTest.java:102-105` |
| Backend PUT nome curto | atendido | `ProjectValidationTest.java:106-109` |
| Backend PUT tipo ausente com `status` válido | atendido | `ProjectValidationTest.java:110-113` |
| 400 + `Validation failed` + `fieldErrors` + `path` | atendido | `ProjectValidationTest.java:88-95`; `GlobalExceptionHandler.java:31-50` |
| Backend não persiste (nenhuma interação com o serviço) | atendido | `ProjectValidationTest.java:97` |
| POST existente intacto | atendido: o diff só adiciona, não altera o bloco POST | `ProjectValidationTest.java:41-77` |
| Escopo: só os dois testes previstos, sem produção | atendido | `git diff --stat`: 2 arquivos, 123 inserções, 0 remoções; `git status`: apenas os dois `M` |
| Sem `@Disabled`, `xit`, `fdescribe` ou remoção de testes | atendido | busca em `apps/` sem ocorrências; diff sem deleções |
| Resultados reportados (106/106, 23/23, build OK) | coerentes com o diff; não rerodados conforme o despacho | backend: 6 invocações de `ProjectValidationTest` + 17 testes dos demais arquivos = 23; frontend: 6 casos novos, sem remoções |

## Achados

| Severidade | Arquivo:linha | O que falta | Por que não bloqueia |
| --- | --- | --- | --- |
| Baixo — dívida aceita | `project-modal.component.spec.ts:183-193, 213-224`; `project-modal.component.html:18-22` | O caso "tipo ausente" é um estado forjado (`setValue(null as unknown as ProjectType)`) e não há mensagem nem destaque visual para o tipo no template. | Decisão aprovada: o select tem default e nenhuma opção vazia, então o usuário não consegue limpar o tipo pela UI. O backend cobre o contrato real com `@NotNull` (`ProjectUpdateDTO.java:13`). Não compromete o CA6 no recorte. |
| Baixo — observação fora do recorte | `project-modal.component.spec.ts:167-211`; `project-modal.component.ts:23` | Não há caso de nome composto apenas por espaços (`"   "`): `Validators.required` do Angular aceita esse valor (comprimento 3), enquanto o backend rejeita com 400. Nesse cenário o frontend não destacaria o campo; exibiria o erro genérico de conexão. | Fora dos três casos aprovados e da correção obrigatória (a tarefa não previa alteração de produção). A persistência continua bloqueada pelo backend, que já tem prova do caso em `ProjectValidationTest.java:102-105`. É dívida de UX, não falha da tarefa. |

**Nenhum achado bloqueador ou médio.**

## Ressalvas e dívida

- **Tipo sem mensagem no frontend:** débito aceito pela decisão registrada no despacho. A simulação é declarada em comentário e não se apresenta como caminho de UX real. Não compromete o CA6 porque a UI não permite apagar o tipo e o backend rejeita o payload forjado.
- **Nome só com espaços:** a validação local do frontend não cobre `"   "`; o backend cobre e impede a persistência. Fica como dívida de baixa prioridade, fora do recorte aprovado.
- **Invocação direta de `save()`:** os testes não disparam o evento DOM de submit, mas exercitam `save()` + `detectChanges()`, exatamente o caminho aprovado no recorte; o template já liga `(ngSubmit)="save()"` (`project-modal.component.html:8`).
- **Resultados:** não rerodei a suíte, conforme orientação do despacho. A contagem backend fecha em 23; a contagem frontend é compatível com 6 casos novos e nenhuma remoção, e não há mudança de produção que possa quebrar o build.
