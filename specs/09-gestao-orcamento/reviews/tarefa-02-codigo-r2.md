# Parecer de Código — Tarefa 2

**Veredito:** APROVADO

**Execução de testes:** não consegui rodar. `.\mvnw.cmd` continua barrado pelo harness (`permission denied: shell`), inclusive com `workdir=apps/api`. Limitação de sandbox já registrada e recusada na rodada 1 (`reviews/tarefa-02-decisoes-r1.md`, Apontamento 1); a suíte foi executada pelo orquestrador (39/39, BUILD SUCCESS). Este parecer é **estático**.

## Apontamentos (bloqueiam)

Nenhum.

O apontamento da rodada 1 foi corrigido no que foi aceito:

- `PREDEFINED_CATEGORY_NAMES` não existe mais; não há terceira cópia da lista da V7 em `DemoDataSeederService` (`:49-246`).
- Os nomes exigidos são derivados da união de `DEMO_BUDGETS` (`:60-66`) e `DEMO_EXPENSES` (`:68-80`), com `distinct()` e sem lista fixa (`requiredCategoryNames()`, `:184-190`).
- `loadCategoriesByName()` valida exatamente esses nomes e a mensagem concatena todos os faltantes (`:167-175`). Como `createBudgets`/`createExpense` usam `categories.get(...)` (`:202`, `:224`), o guard também elimina o `category = null` que estourava como violação de `NOT NULL` no flush.
- O caminho feliz do teste fornece **5** categorias (`DemoDataSeederServiceTest.java:296-303`) — se a guarda voltasse a exigir as 9, o teste quebraria.
- A guarda passou a ser exercitada: `failsWhenACategoryUsedByTheDemoScenarioIsMissing` (`:201-217`) remove “Hidráulica”, espera `IllegalStateException` contendo o nome e prova ausência de saves parciais com `never()` nos seis repositórios.
- Ordem do `seed` (`:108-128`): retorno antecipado antes de carregar categorias e de qualquer save (`:109-113`); usuário existente + obra ausente não re-codifica a senha (`:117-119`); usuário ausente valida categorias antes de salvar (`:115` vem antes de `:118`); `findByUserIdAndDeletedAtIsNull` só é chamado no curto-circuito de `user != null` (`:111`, `:135-137`), sem stub morto no teste. `@Transactional` segue no método público chamado pelo runner (`:107`).
- Sem regressão de escopo: valores, datas, chave de idempotência, `DEMO_*`, runner, `SupplierRepository` e `application-dev.properties` estão idênticos ao que a rodada 1 descreveu; nenhuma sugestão não bloqueante foi implementada.
- Não há código morto: `createDemoUser` (`:130`) é usado em `:118`; não existe `findOrCreateDemoUser` no arquivo final. `requiredCategoryNames()` é indireção com ganho — é o ponto único de derivação da lista.

## Sugestões (não bloqueiam)

- **O ramo “usuário existe, obra não” não tem teste próprio** — `DemoDataSeederService.java:111-119`. O caso de usuário ausente está coberto (`DemoDataSeederServiceTest.java:201-217`) e o de tudo existente também (`:170-200`), mas o caminho intermediário — o que motivou a reordenação — só é verificável por leitura. Prejuízo concreto: se uma refatoração futura mover `loadCategoriesByName()` para depois de `createDemoUser()` ou passar a chamar `passwordEncoder.encode` nesse ramo, nenhum teste fica vermelho; a quebra só aparece ao subir o dev com um usuário demo já existente. Um caso com `findByEmail` retornando usuário e `findByUserIdAndDeletedAtIsNull` vazio, com `never()` em `userRepository.save` e `never()` em `encode`, fecharia isso.

## Observações fora do escopo deste diff

- Execução de Maven pelo revisor continua indisponível — melhoria de allowlist já registrada e recusada como bloqueio nesta tarefa (`reviews/tarefa-02-decisoes-r1.md:3-14`). Não reabro.
- As sugestões não bloqueantes da rodada 1 (idempotência por nome de obra, datas fixas sem `Clock`, asserção fraca do fornecedor, visibilidade das constantes `DEMO_*`, log do runner, nome de `findFirstByName`, `matchIfMissing = false`) continuam pendentes por decisão explícita (`reviews/tarefa-02-decisoes-r1.md:32-34`). Candidatas a Issue de manutenção.
- Divergências pré-existentes registradas na rodada 1 (`Supplier` sem `user_id`, seed sem `pending_payments`, nome `DevDemoDataSeeder` na spec) permanecem inalteradas.
