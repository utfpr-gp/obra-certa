# Parecer de Código — Tarefa 5 (Issue 48, US15: "Confirmar os novos tetos"), rodada 1

**Veredito:** APONTAMENTOS

Li o diff inteiro (20 arquivos, por arquivo, pois o shell recusou comandos com pipe), `docs/architecture.md`, `utf-rules.md`, `plan.md`, a V6, o `GlobalExceptionHandler` e o caminho de cada apontamento. Não rodei os testes: o escopo deste agente é leitura, e a avaliação abaixo é por leitura de código.

## Apontamentos (bloqueiam)

**1. A prévia marca como "preservado" categorias que não têm teto, e o servidor vai criá-las**
- `apps/web/.../sinapi-form/sinapi-form.component.ts:125` monta `existing` a partir de `existingBudgets()` sem filtrar `hasBudget`. A linha `:148` grava `existingAmount: existing.get(...) ?? null`. O template mostra "Teto atual R$ 0,00 preservado" quando `existingAmount !== null`.
- A origem é `budgets-page.component.html:229` (`[budgetRows]="overview()?.categories"`). Em `apps/api/.../BudgetService.java:97-102`, `getOverview` inclui categorias que só têm despesa, com `hasBudget = false` e `plannedAmount = ZERO` (`:333`).
- No servidor, `writeBudgets` (`BudgetService.java:223-245`) considera preservado só o que existe em `budgets` ativo. Essa categoria recebe um teto novo.
- Regra violada: `plan.md:20` determina "Reutiliza as categorias da página e `hasBudget` para identificar tetos ativos, inclusive zerados".
- Prejuízo concreto: a tela diz ao proprietário que o teto foi preservado e depois o sistema grava um valor. Os testes não pegam isso: `sinapi-form.component.spec.ts` só usa fixtures com `hasBudget: true`.

**2. Fechar o modal durante o envio perde a recarga do painel**
- `budget-form-modal.component.ts:203-207` (`close()`) não verifica o envio do SINAPI. O botão de fechar (`budget-form-modal.component.html:19`), o Escape (`budget-form-modal.component.ts:209-211`) e o `(cancelled)="close()"` funcionam durante o envio.
- Ao fechar, o `sinapi-form` é destruído. Quando a resposta chega, `sinapi-form.component.ts:234` (`this.confirmed.emit()`) não tem mais destinatário. Assim `onBudgetSaved()` (`budgets-page.component.ts:134-141`) não roda e o painel não recarrega.
- Regra violada: `plan.md:21` ("Após confirmar, a página recarrega os tetos") e `architecture.md:369`/`:373` (resposta perdida não prova que o servidor deixou de gravar). O próprio padrão da US08 bloqueia fechamento durante envio (`architecture.md:567`: "Durante envio, confirmação e fechamento ficam bloqueados").
- Prejuízo concreto: o lote fica gravado no servidor, mas a tela mostra o painel antigo até recarregar a página. Um reenvio daria 200 com tudo "preservado", o que confunde.

**3. Entrada válida pelo DTO gera 500, e estouro de NUMERIC(15,2) vira 409 enganoso**
- `SinapiAllocationCalculator.java:49` usa `total.setScale(2,…).unscaledValue().longValueExact()`. Para total acima de cerca de 9,2×10¹⁶ centavos, lança `ArithmeticException`.
- `BudgetService.java:269-275` (`allocate`) só captura `IllegalArgumentException`. Assim, `unitCost = 1E17` com `area = 1` passa por `@Positive`, chega ao `allocate` (que roda antes da consulta ao SIDRA) e cai em 500.
- Regra violada: `architecture.md:403` reserva 500 a erro interno não mapeado. Aqui a entrada é do cliente e deveria ser 400, como o plano decidiu para custos inválidos (`plan.md:53`).
- Outro caso: total acima de 9.999.999.999.999,99 estoura a coluna `NUMERIC(15,2)`. Isso vira `DataIntegrityViolationException`, que o `GlobalExceptionHandler.java:83-93` mapeia para 409 com "O registro entra em conflito com dados existentes". O front (`sinapi-form.component.ts:238`) trata qualquer 409 como "O custo mudou desde a prévia". A mensagem está errada nos dois lados.
- Sugestão de correção (o autor decide): validar o total contra o limite da coluna antes da gravação e responder 400 com mensagem própria. O teste `falhaNoMeioDoLoteRevertTodosOsTetosNovos` continua valendo como prova de rollback, mas hoje ele também fixa o 409 errado.

## Sugestões (não bloqueiam)

- **Categoria inexistente no payload → 400 "Categoria inválida."** (`BudgetService.java:248-266`). `architecture.md:495` diz que, nas escritas de orçamento, categoria inexistente retorna 404. A regra é escrita para as rotas com `categoryId` no caminho, então 400 pode ser defensável. Vale decidir e registrar no contrato.
- **Sem timeout no POST de confirmação** (`budget.service.ts`, `confirmSinapi`). O padrão do próprio serviço é `.pipe(timeout(...))` (`getSinapiReferences`; US08 usa 30 s). Sem timeout, `saving` fica verdadeiro até a resposta chegar, e o usuário só consegue fechar.
- **`@ExceptionHandler` local no `BudgetController` (item 7).** Funciona e não quebra os testes. Efeitos: (a) o PUT de orçamento com corpo inválido também passa a sair com `no-store`, mudança inócua mas fora da tarefa; (b) o controller passa a depender do `GlobalExceptionHandler`, um bean de camada web. Para o `no-store` ser uniforme no fluxo, o caminho mais limpo é um filtro ou `HandlerInterceptor` restrito a `/api/budgets/*/sinapi/**`, que cobre também erros de parse que o handler local não pega (HTTP 400 de JSON malformado não passa por ele). Não encontrei `headers(` na configuração de segurança, então o default do Spring Security deve adicionar `Cache-Control` a todas as respostas. Confirmar isso antes de decidir.
- **Comentário desatualizado** em `SinapiAllocationCalculator.java:16`: diz "a confirmação que usa esta regra é da tarefa 5", que agora é verdade. Remover a menção à "tarefa" do Javadoc.
- **Teste de concorrência** (`BudgetSinapiConfirmationIntegrationTest`, `awaitTwoSessionsWaitingOnTheBudgetRow`) conta sessões em `pg_stat_activity` filtrando só por `datname`. Em um banco compartilhado por outras suítes, a contagem pode dar falso positivo. Filtrar também por `application_name` ou por usuário de teste.
- **Ordem do PRD em dois lugares** (`SinapiPrdOrder.java` no back, `prdOrder` em `sinapi-allocation.ts` no front). A duplicação entre linguagens é inevitável. O back é a fonte única dentro do back, como o Javadoc afirma.

## Observações fora do escopo deste diff

- Os demais itens da lista de verificação estão corretos:
  - **(1) ON CONFLICT:** o predicado `WHERE deleted_at IS NULL` e as colunas `(project_id, category_id)` batem exatamente com `V6__…sql:41-43`. `DO NOTHING` não aborta a transação, e a corrida espera o commit do concorrente.
  - **(2) TransactionTemplate:** só `writeBudgets` (`BudgetService.java:215`) roda dentro dela. Titularidade, validação de payload, `allocate` e a consulta ao SIDRA ficam fora. Não há HTTP dentro da transação.
  - **(3) Rollback:** exceção de runtime propaga e reverte o lote. `ON CONFLICT` não é exceção, então conflito não é falha. O teste de rollback é válido, porque sem transação única o teto de Fundação ficaria gravado.
  - **(4) Comparação:** `compareTo == 0` em `BudgetService.java:206-212`. A ordem é validada no serviço com `SinapiPrdOrder`.
  - **(5) Erros:** `@Positive` dá 400 antes do serviço, e `IllegalArgumentException` vira 400 em `allocate`. O problema é o `ArithmeticException` (item 3).
  - **(6) Logs e persistência:** nenhum log novo no caminho do SINAPI, e o `SidraClient` não tem logger. Nenhum `@Cacheable`. Só os tetos são persistidos. `show-sql` está ativo só em `dev`, sem parâmetros.
  - **(8) Front, signals:** `preview`, `estimateInput` e `canConfirm` são computed puros, sem escrita de estado. `confirmed.emit()` só roda no `next`, então a recarga é só no sucesso. O 409 vira `stale` e o restante vira `failed`.
