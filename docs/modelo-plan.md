<!-- 📐 MODELO — não é um plano de verdade, e por isso mora em `docs/`, e não em `specs/`.
     O `/utf-issue <n>` gera `specs/<numero-da-issue>-<slug>/plan.md` com esta forma,
     depois de você aprovar a spec. O `/utf-task` lê as caixas `- [ ]` daqui para saber
     qual é a próxima tarefa, e marca `- [x]` quando você autoriza o commit. -->

# Plano — Issue #00

## Decisões técnicas

<!-- O que precisa estar decidido antes da primeira linha de código. Nada de regra de
     negócio (isso é a spec) nem de padrão global (isso é o `docs/architecture.md`):
     aqui é só o que esta história concretiza. -->

### Backend (`apps/api`)

<!-- - Endpoints: método, rota e o que devolve (ex.: `POST /api/obras` → 201 + ObraResponse).
     - DTOs de entrada e saída, com as validações de Bean Validation de cada campo.
     - Entidades e relacionamentos novos ou alterados.
     - Regra de autorização: quem pode chamar, e onde isso é imposto no servidor. -->

-

### Migração de schema

<!-- Toda mudança de modelo carrega a sua migration Flyway, na MESMA tarefa que a usa —
     `V<N>__<descricao>.sql` em `apps/api/src/main/resources/db/migration/`.
     Confira o número da última migration no disco antes de escolher o próximo.
     Migration já aplicada é imutável: corrigir é criar outra, nunca editar aquela.
     Se esta história não toca o schema, escreva "nenhuma" — a linha vazia parece esquecimento. -->

-

### Frontend (`apps/web`)

<!-- - Componentes e rotas novos ou alterados; o que é lazy.
     - Signals de estado, e quem os possui.
     - O Service de `core/services/` que fala com os endpoints acima — componente nenhum
       chama HTTP direto. -->

-

## Tarefas

<!-- 📏 O tamanho certo: cada tarefa é UM critério de aceite inteiro, ponta a ponta,
     ou um passo técnico que sozinho não prova nada mas destrava o próximo.
     Se ao descrever você usa "e" duas vezes, são duas tarefas.
     Mais de 10 tarefas: a história é grande demais, divida em duas Issues.

     ⚠️ "Ponta a ponta" aqui atravessa três camadas: Angular → HTTP → controller →
     service → repository → Postgres. Uma tarefa que entrega só o endpoint, ou só a
     tela contra dado falso, é fatia horizontal — o critério não fica provado.
     A exceção é o passo técnico declarado como tal (uma migration que destrava a
     tarefa seguinte, por exemplo), que não cobre critério nenhum e diz isso.

     Toda tarefa começa pelo teste (RED), então toda tarefa cita o critério que prova
     e em qual suíte o teste nasce — `apps/api` (JUnit), `apps/web` (.spec.ts), ou as duas. -->

- [ ] **Tarefa 1 — [título curto, um verbo]**
  - Cobre: CA1
  - Teste primeiro: [o que o teste vai provar, em qual suíte, e por que ele falha antes do código]
  - Migration: [`V<N>__<descricao>.sql`, ou "nenhuma"]
  - Arquivos previstos: [caminhos, dos dois lados quando for o caso]

- [ ] **Tarefa 2 — [título]**
  - Cobre: CA2
  - Teste primeiro:
  - Migration:
  - Arquivos previstos:

<!-- ⚠️ Confira antes de aprovar: TODO critério de aceite da spec aparece em alguma
     tarefa? Critério sem tarefa passa em todas as revisões — nenhuma delas está
     olhando para o que ninguém implementou. O auditor final pega isso, mas tarde. -->

## Critérios sem tarefa

<!-- Precisa ficar vazio. Se sobrou critério aqui, falta tarefa. -->

-
