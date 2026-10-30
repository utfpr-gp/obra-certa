# Parecer de Conformidade — Tarefa 9

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA5 — Salvar e alertar ao atingir ou ultrapassar 100% de teto positivo, inclusive quando o comprovante falha | não atendido | `apps/web/src/app/features/expenses/expense-form.component.ts:118`; o fluxo habitual está coberto em `expense-flow.spec.ts:278`, mas permite sobrescrita por consulta anterior |
| CA6 — Preservar salvamento, mensagem de falha e acesso à consulta/reenvio | atendido no recorte desta tarefa | `apps/web/src/app/features/expenses/expense-form.component.ts:245`; `expense-form.component.html:141`; `expense-flow.spec.ts:306` |
| CA11 — Descartar respostas de contexto anterior, inclusive A → B → A | atendido no recorte desta tarefa | `apps/web/src/app/features/expenses/expense-form.component.ts:118`; `expense-context.spec.ts:66` |
| CA1–CA4 e CA7–CA10; demais comportamentos de persistência e reenvio do CA6 | fora desta tarefa | Sem mudanças de backend ou contratos financeiros neste delta |

Diff completo revisado com `git diff 65ca4e5c624e3538d130a24923c8a986e3f1682a`. Os registros de auditoria e decisão foram considerados documentos históricos e de autorização. A revisão respeita a nova tarefa 9 e a retirada das antigas funcionalidades de idempotência e recuperação de sessão.

Validação: executei `npx.cmd ng test --watch=false --browsers=ChromeHeadless` em `apps/web`. A compilação concluiu, mas o ChromeHeadless não iniciou; comando terminou com código 1, sem executar os testes. O agente principal informou execução própria sobre o mesmo delta com **270 testes aprovados, código 0**, e build aprovado. Essa evidência é atribuída ao agente principal.

## Apontamentos

1. **Uma resposta de orçamento anterior ao salvamento pode apagar o alerta de teto após falha do comprovante** — `apps/web/src/app/features/expenses/expense-form.component.ts:118`  
   Critério violado: `specs/5-cadastro-despesas/spec.md:24` — CA5 exige alerta visual quando a despesa salva leva o consumo a pelo menos 100% do teto positivo.  
   Evidência: o construtor inicia `loadBudgets()` em `:87`, mas `save()` não aguarda essa consulta (`:257`). Após confirmar a criação, a nova chamada em `:284` consulta o agregado atualizado. Ambas as respostas podem escrever em `budgetCategories`, pois `:118` verifica somente a versão do contexto da obra. Cenário permitido: a consulta inicial captura gasto de 90/100 e fica atrasada; a despesa é criada; a consulta pós-criação retorna 110/100 e mostra o alerta; o upload falha; por último, a consulta inicial retorna 90/100 e sobrescreve o agregado. O cálculo de `budgetExceeded` em `:48` passa a falso e o alerta desaparece, embora o gasto salvo tenha ultrapassado o teto. Os novos testes encerram a consulta inicial antes de salvar e não exercitam essa inversão de respostas dentro do mesmo contexto.
