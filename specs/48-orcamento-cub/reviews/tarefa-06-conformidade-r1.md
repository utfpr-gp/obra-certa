# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

> Nota de execução: o shell foi liberado nas duas primeiras chamadas (`git log`, `git status`, `git diff --stat`) e passou a ser recusado (`permission.rejected`) em todas as seguintes. **Não rodei `mvn test` nem `npm test`** e também não consegui reexecutar `git diff --cached`. Li o diff pelos arquivos da árvore de trabalho — o `git status --short` das quatro entradas retornou `M ` (índice e worktree idênticos), então o que li é o que está staged contra `7afad87`.
>
> Atenção: o texto do prompt diz "Árvore base fixada: d28c450…", mas o diff pedido é contra `7afad87`. Usei `7afad87` (HEAD), como no comando de diff.

## Critérios verificados

| Critério (da spec / plano) | Situação | Onde |
| --- | --- | --- |
| `no-store` no GET 200 de referências | atendido | `apps/api/src/test/java/com/obracerta/controller/BudgetControllerTest.java:165-166` |
| `no-store` no GET 400 (UF/mês/projeto inválidos) | atendido | `BudgetControllerTest.java:217-225` |
| `no-store` no GET 404 (obra alheia/inexistente) | atendido | `BudgetControllerTest.java:229-237` |
| `no-store` no GET 503 (timeout e resposta incompatível) | atendido | `BudgetControllerTest.java:190-205` |
| `no-store` no POST 200 | atendido | `BudgetControllerTest.java:403-414` |
| `no-store` no POST 400 de validação (antes do serviço) | atendido | `BudgetControllerTest.java:418-425` |
| `no-store` no POST 400 de JSON malformado | atendido | `BudgetControllerTest.java:451-455` |
| `no-store` no POST 409 (custo mudou) | atendido | `BudgetControllerTest.java:429-437` |
| `no-store` no POST 503 (SIDRA fora) | atendido | `BudgetControllerTest.java:459-468` |
| `no-store` não vaza para o resto da API | atendido | `BudgetControllerTest.java:441-447` (`putInvalidBodyKeepsItsResponseWithoutNoStore`, `header().doesNotExist`) |
| Banco intacto após consulta de referências | atendido | `BudgetSinapiConfirmationIntegrationTest.java:160-175` |
| Após confirmação: só os 7 tetos, nada mais | atendido | `BudgetSinapiConfirmationIntegrationTest.java:150-156` |
| Após 409 nada parcial | atendido | `BudgetSinapiConfirmationIntegrationTest.java:186-188` |
| Após falha no meio do lote nada parcial | atendido | `BudgetSinapiConfirmationIntegrationTest.java:325-327` |
| Logs sem custo/resposta/memória de cálculo (consulta + confirmação + erro 409) | atendido | `BudgetSinapiConfirmationIntegrationTest.java:371-404` |
| Logs sem parâmetros/resposta no GET do fluxo | atendido | `BudgetControllerTest.java:241-273` |
| Front: dados saem do estado ao fechar | atendido | `sinapi-form.component.spec.ts:461-486` (host com `@if`, espelha o modal) |
| Front: nada em localStorage/sessionStorage/cookie/IndexedDB após consultar, confirmar e falhar | atendido | `sinapi-form.component.spec.ts:388-421`, `sinapi-form.component.spec.ts:423-444`; serviço: `budget.service.spec.ts:163-193` |
| Sem migration, sem `ddl-auto` alterado, sem produção alterada | atendido | `git diff --stat 7afad87`: só 4 arquivos de teste; `application-test.properties:2` e `application-propriedades` seguem `validate` |
| Defeito aberto da tarefa 5 (troca de aba durante o envio) não foi "corrigido" aqui | atendido | `budget-form-modal.component.*` fora do diff; nada em `SinapiFormComponent`/`BudgetService` foi alterado |

## Apontamentos

Nenhum.

**Por que não reprovo as asserções negativas:**

- **Não há teste mentiroso de `no-store`.** Todos os casos com header afirmado chegam a um handler (validação no próprio controller, `@RestControllerAdvice`, `@Valid`/`@RequestBody` após `preHandle`), então o `preHandle` de `SinapiNoStoreConfiguration.java:24-29` realmente roda. O diff **não** afirma `no-store` em 404/405/415 sem handler nem em `/error` — que é justamente onde o interceptor não cobriria. O teste de escopo negativo no `PUT` prova que o header não é global.
- **As contagens de banco são honestas.** `countAllBudgets` (`BudgetSinapiConfirmationIntegrationTest.java:413-416`) e `countProjectRows` (`:418-426`) não filtram `deleted_at`, então pegam linha soft-deleted/parcial. O `== 7` no sucesso conviveria com 7 ativos + resíduo e falharia. `activeBudgets(...).isEmpty()` sozinho seria fraco, mas é sempre acompanhado da contagem crua.
- **Os testes de log são sensíveis a regressão real.** Não há `logback-spring.xml` no projeto (root default, aditividade ligada, nível INFO), então um `log.info` novo com custo/parâmetro/resposta cairia no `ListAppender` do root e quebraria a asserção. Os valores escolhidos são distintivos (custo `4321.99`, nome `AcabamentoSigilosoXYZ`, mês `199807`/`1998-07`, total `159913` = 4321,99 × 37) e cobrem exatamente custo, resposta bruta e memória de cálculo.
- **O front prova ausência de canal persistente, não só de DOM.** O snapshot compara storage/cookie/IndexedDB antes e depois, então qualquer escrita nova quebra o teste, mesmo que a tela pareça limpa.

## Sugestões (não bloqueiam)

1. **Os testes de log só olham `getFormattedMessage()`** (`BudgetSinapiConfirmationIntegrationTest.java:398`, `BudgetControllerTest.java:266`). Uma exceção logada como *throwable* (`log.warn("falha", ex)`) cujo `message`/stacktrace carregue a resposta bruta passaria batido. Vale acrescentar uma asserção sobre `event.getThrowableProxy()` quando houver.
2. **UF não é afirmada nos logs** — só mês. `"PR"`/`"41"` são curtos demais para `doesNotContain` (falso positivo fácil), então a escolha é defensável; se quiser fechar o parâmetro UF, use um valor distintivo no teste (ex.: mês e UF artificiais) em vez de `PR`.
3. **"Descarta o índice" não está provado por comportamento**: nenhum teste faz duas consultas idênticas e verifica duas chamadas ao SIDRA. Hoje isso é verdade *por ausência* de cache (`grep` não acha `@Cacheable`/`Map` de cache em `apps/api/src/main`), mas é uma garantia por omissão de código, não por teste.
4. **O teste de descarte ao fechar prova destruição do componente, não limpeza de sinais** (`sinapi-form.component.spec.ts:461-486`). É a interpretação correta do modal (`@if`), e a comparação de storage cobre o resto do canal; serviria de reforço só se o componente algum dia for mantido vivo.
5. **`BudgetControllerTest.java:13`**: dois imports colados na mesma linha (`...BudgetCategoryDTO;import ...BudgetSetDTO;`) — compila, mas é sujeira que viaja no commit. É do revisor de código, não meu.

## Observações fora do escopo

- **`apps/web/tarefa6-audit.json` está untracked** na raiz de `apps/web` (saída de `npm audit --json`). Não faz parte do diff, mas precisa ficar de fora do commit.
- O label do teste `keeps the SINAPI lookup, confirmation and failure out of browser storage` está em inglês, enquanto os demais novos testes de API estão em português e os de front já eram em inglês — consistente com o arquivo, sem impacto.
- Não consegui confirmar por execução o relato das 7 mutações de sensibilidade; a avaliação acima é por leitura, e todas as asserções que verifiquei quebrariam se a proteção correspondente sumisse.
