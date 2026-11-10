APROVADO

# Parecer de Código — Tarefa 4 (rodada 2)

**Veredito:** APONTAMENTOS

**Limitação desta revisão:** o shell foi negado (`Permission denied: shell`), então não consegui rodar `git diff --cached 5c5e541 -- apps/api` nem o comando de testes. Revisei o estado atual dos arquivos em `apps/api/src/main/java`, não o diff. Os testes não foram rodados. Se o diff tocar outras linhas além das citadas abaixo, a revisão não as cobre.

## Apontamentos (bloqueiam)

1. **A regra de orçamento por categoria ainda aparece duplicada em `ExpenseService.update`.** — `apps/api/src/main/java/com/obracerta/service/ExpenseService.java:181-182`
   Regra violada: §5.2.1 (regra de negócio concentrada e sem duplicação) e o critério de duplicação do revisor. O `ExpenseReferenceResolver` foi criado para ser o ponto único dessa busca, mas `update` repete `budgets.findByProjectIdAndCategoryIdAndDeletedAtIsNull(...).orElse(null)` em vez de chamar `references.resolveBudget(...)`. Prejuízo concreto: se a regra mudar (por exemplo, para considerar um orçamento zerado), o fluxo de criação e o de importação de NF-e mudam e a edição não, e a divergência só aparece em produção.
   Correção sugerida (para a triagem do usuário decidir): trocar a linha 181 por `references.resolveBudget(expense.getProject().getId(), category.getId())`. Se essa linha não foi tocada pelo diff desta tarefa, o item vira observação fora de escopo, mas continua sendo duplicação.

## Pendências da rodada 1

- **Regra em um só lugar:** parcialmente atendida. Criação manual e importação de NF-e usam `ExpenseReferenceResolver` para orçamento e fornecedor (`ExpenseService.java:139, 142`; `NfeImportService.java:106, 114`). A ressalva é o item 1.
- **Comportamento do fluxo manual preservado:** o resolvedor replica a regra antiga. Sem CNPJ, cria sempre fornecedor novo (`ExpenseReferenceResolver.java:26-27`). Com CNPJ, reutiliza o do usuário ou cria (`:28-29`). Na criação manual, o CNPJ chega normalizado (`ExpenseService.java:134-135`). Na importação, o CNPJ vem cru do XML (`NfeXmlParser.java:64`) e não passa por normalização nem validação de 14 dígitos. Como o emitente de NF-e é CNPJ com dígitos, isso funciona na prática; ver sugestão 2.
- **Instanciação com `new` nos construtores:** aceitável. O resolvedor é um wrapper sem estado sobre repositórios, package-private, sem ciclo de vida próprio. O custo é que as dependências são montadas à mão em dois lugares: se o resolvedor ganhar uma dependência nova, os dois construtores mudam. Virar `@Component` injetado daria uma fonte única de wiring, mas exigiria alterar as assinaturas dos construtores que os testes usam (`ExpenseService` com 6 e 7 argumentos e `NfeImportService`). Não é bloqueante.
- **Linha não paga:** `NfeImportService.java:118-125` cria `PendingPayment` com `PENDING`, `dueDate = preview.issueDate()` e `paidAt = null`. `ExpenseService.java:147-153` faz o mesmo com `dueDate` do request. Mesma forma. A data de emissão nunca é anterior à compra porque é a própria data da compra, então a regra de vencimento não é violada.
- **Comentário do preview com acentos:** restaurado em `NfeImportService.java:59` ("Só leitura", "Trava de chave fica para a confirmação"). Ver sugestão 1 sobre o comentário da linha 69.
- **Transação:** `confirm` continua `@Transactional` (`NfeImportService.java:70`). `NfeKeyGuard.ensureNotRegistered` é `@Transactional` (`NfeKeyGuard.java:19`) e é chamado pelo bean, então a trava `lockActiveById` (`:21`) participa da transação de `confirm` e dura até o commit. A chamada `ensureNotRegistered` ocorre depois da validação de categorias e antes das gravações (`NfeImportService.java:103`). Está correto.

## Sugestões (não bloqueiam)

1. `NfeImportService.java:69` mantém "ate" e "dura" sem acento, enquanto o restante dos comentários da mesma classe já tem acentos. Ajuste cosmético.
2. Considere normalizar e validar o CNPJ do emitente na importação, da mesma forma que a criação manual faz (14 dígitos, sem pontuação). Hoje um XML malformado gera um fornecedor com documento inválido e não reutilizável.
3. `ExpenseService.create` ainda faz `invalid(...)` de descrição e data antes de validar a categoria. Não é problema, só ordem diferente de `update`.

## Observações fora do escopo deste diff

- **`ExpenseRegistrationIntegrationTest` com `suppliers.count()` global sem limpeza:** não li esse teste, então não confirmo o defeito. Pelo relato do implementador, é pré-existente e não nasce desta tarefa. Se o diff não o tocou, é candidato a Issue de manutenção (`chore/`): isolamento de dados de teste de integração. Enquanto não for corrigido, a suíte só é confiável com o banco de teste limpo.
- Se o `update` (item 1 dos apontamentos) é pré-existente, a duplicação também vira Issue de manutenção.

## Testes

Não rodei. O comando solicitado é `.\mvnw.cmd -B "-Dtest=NfeImportControllerConfirmTest,NfeImportControllerPreviewTest,NfeKeyGuardTest,ExpenseServiceTest" "-Dspring.profiles.active=test" test` a partir de `apps/api`. Precisa ser rodado manualmente, ou com o shell liberado.
