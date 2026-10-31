# Decisões da Tarefa 11 — Rodada 2

Pareceres: `tarefa-11-conformidade-r2.md` (**APROVADO**) e `tarefa-11-codigo-r2.md` (**APROVADO**).

## Ajustes aplicados

Os quatro itens aprovados na triagem da rodada 1 foram corrigidos apenas no spec frontend:

- **#1:** no teste de criação com tipo ausente, `name = 'Nova obra'` é preenchido antes de `setTypeToNull()`, isolando o erro de tipo.
- **#2:** `switchToCreateMode()` afirma o título `'Cadastrar nova obra'` no DOM, provando o modo criação.
- **#4:** `expectInvalidNameBlockedSubmission('required' | 'minlength')` fixa o validador de cada caso de nome.
- **#6:** `setTypeToNull()` centraliza o cast `null as unknown as ProjectType` e o comentário.

Os dois revisores confirmaram os quatro itens como **fechados**, sem falso positivo novo e sem bloqueadores.

## Fechamento

A Tarefa 11 encerra na rodada 2, conforme o limite de duas rodadas. A conformidade está **APROVADA** e o código **APROVADO**. O CA6 está coberto nos três verbos — impede, destaca e não persiste — em criação e edição, e o PUT inválido está coberto no backend.

Estado final:
- Frontend: **106/106**, build OK (warning de budget pré-existente).
- Backend: **23/23**, BUILD SUCCESS; arquivo intacto desde a rodada 1.
- Nenhuma produção alterada.
- Nenhum commit nesta rodada.

## Dívidas aceitas

- Tipo sem mensagem/destaque no frontend: a UI não permite limpar o tipo; o backend rejeita o payload.
- Nome composto só por espaços não coberto no frontend; o backend bloqueia.
- Bloco de assertivas do tipo duplicado entre os dois modos.
- `textContent` global para a mensagem de nome, sem `data-testid`.
- Testes chamam `save()` direto, sem exercitar `(ngSubmit)`.
- Backend: duplicação POST/PUT, ausência de javadoc de camada no `verifyNoInteractions`, `status` ausente fora do CA6 e `hasItem` sem fixar a contagem de `fieldErrors`.
- Reset do formulário no modo criação não assertado diretamente (o título prova o modo, não o `effect`).
- Observações fora do escopo: template sem mensagem de tipo; `docs/architecture.md` cita Vitest mas o projeto usa Karma/Jasmine; `@MockBean` depreciado.

Não haverá rodada 3.

## Resíduo acumulado para eventual Issue de manutenção

- Tarefa 11: os itens acima.
- Tarefa 10: dois baixos da rodada 2 e itens 5–10 da rodada 1, em `tarefa-10-decisoes-r2.md`.
- Tarefa 9: quatro achados baixos em `tarefa-09-decisoes-r2.md`.
- Segurança: dívida do T6C, sem número de Issue registrado.
- Documentação: `docs/architecture.md:42` cita `features/projects/` inexistente; correção não aprovada pelo autor.
