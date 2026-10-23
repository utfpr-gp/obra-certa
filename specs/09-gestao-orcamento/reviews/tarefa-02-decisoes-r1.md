# Decisões — Tarefa 2, rodada 1

## Apontamento 1 — Conformidade — **RECUSADO**

**Apontamento:** o revisor de conformidade não conseguiu executar `.\mvnw.cmd` nem `mvn`; a allowlist do subagente só libera `git`, `ls`, `cat` e testes de frontend. Por isso o parecer foi emitido apenas por leitura.

**Decisão do usuário:** recusar.

**Justificativa:** é limitação de sandbox do revisor, não defeito de código. A suíte foi executada pelo implementador e, independentemente, pelo orquestrador, com o mesmo resultado:

- `DemoDataSeederServiceTest`: `Tests run: 2, Failures: 0, Errors: 0`
- Suíte completa: `Tests run: 38, Failures: 0, Errors: 0` — BUILD SUCCESS, em duas execuções consecutivas.

Nenhuma alteração de código ou de configuração é necessária para este apontamento. A liberação de `mvn`/`mvnw.cmd` na allowlist dos revisores fica registrada como melhoria de processo para tarefas futuras, sem bloquear a Tarefa 2.

## Apontamento 2 — Código — **ACEITO**

**Apontamento:** `DemoDataSeederService` mantém uma lista própria das 9 categorias da V7 e exige todas, mas o cenário usa apenas 5. Uma V8 que renomeie uma categoria não usada quebraria o boot do perfil dev; o teste fabrica a própria lista de 9 e não exercita a guarda.

**Decisão do usuário:** aceitar.

**Correção exigida (rodada 2):**

1. Remover a lista `PREDEFINED_CATEGORY_NAMES` do serviço.
2. Derivar os nomes exigidos da união das categorias usadas por `DEMO_BUDGETS` e `DEMO_EXPENSES`, sem manter uma terceira cópia dos dados da V7.
3. Validar apenas esses nomes; se faltar algum, lançar `IllegalStateException` com os nomes faltantes.
4. Ajustar o teste para fornecer apenas as 5 categorias usadas no caminho feliz e adicionar um caso “categoria usada ausente → `IllegalStateException` com o nome faltante”.
5. Não implementar as sugestões não bloqueantes desta rodada.

**Consequência:** esta é a rodada 2 de 2. Se a revisão da rodada 2 trouxer novo apontamento bloqueante, o fluxo para e a decisão volta ao usuário.

## Sugestões não bloqueantes

Nenhuma sugestão do parecer de código foi promovida. Elas permanecem registradas em `tarefa-02-codigo-r1.md` para decisão futura, sem alterar o escopo desta tarefa.
