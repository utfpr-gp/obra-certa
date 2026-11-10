REPROVADO

# Parecer de Código — Tarefa 4

**Veredito:** APONTAMENTOS

Não rodei o teste: o `shell` foi negado nesta sessão. Os números de linha da `NfeImportService` são aproximados, exceto onde indicado.

## Apontamentos (bloqueiam)

1. **Expense não paga é criada sem `PendingPayment`.** — `NfeImportService.java` (montagem da `Expense`, ~linha 118-124, `.paid(false)`)
   Regra violada: invariante de `ExpenseService.create` (`ExpenseService.java:148-155`), que cria `PendingPayment` quando `paid == false`. O `architecture.md` §5.2 exige o mesmo par de vencimento e pagamento para despesa pendente (linha 305, edição de despesa, que segue a mesma regra).
   Prejuízo concreto: a despesa importada fica com `paid=false` sem registro de pagamento. Ela não aparece nas abas e nos totais de pendentes que dependem de `pending_payments`, e não entra no alerta de 7 dias. Se a intenção do spec for importar como pendente, falta o vencimento; se for importar como paga, o `paid` está errado. Confirme contra o spec antes de corrigir.

2. **Regra duplicada de `ExpenseService.create`.** — `NfeImportService.java` (busca de fornecedor por CNPJ ~linha 102-104; orçamento ~linha 118-119); origem em `ExpenseService.java:137-143`
   Regra violada: `nfeKeyGuard`/revisão, critério "duplicação de regra que já existe em outro lugar do repo". O `architecture.md` §5.2.1 manda concentrar regras no service, e a mesma regra não pode viver em dois lugares.
   Prejuízo concreto: quando a regra de orçamento ou de fornecedor mudar (ex.: soft-delete de fornecedor, normalização de CNPJ), `create`, `update` e `confirm` divergem silenciosamente.
   Sugestão de correção (não aplique agora): extrair `resolveBudget(projectId, categoryId)` e `findOrCreateSupplier(owner, emitter)` para um componente compartilhado, chamado por `ExpenseService` e `NfeImportService`.

## Sugestões (não bloqueiam)

- **Comentário do `preview` (`NfeImportService.java:58`)**: o texto ficou com "nada e gravado" e "confirmacao" sem acento. Não há regra contra ASCII, mas o repo usa acento em comentários (`NfeKeyGuard.java:18`, `ExpenseService`). "e" no lugar de "é" muda o sentido. Restaure o texto original do `5c5e541`, que é a versão correta.
- **Atomicidade e lock — conforme**: `confirm` é `@Transactional`, `NfeKeyGuard.ensureNotRegistered` também é (`NfeKeyGuard.java:19`) e entra na mesma transação via proxy de outro bean. O `lockActiveById` segura a trava até o commit, e a validação (`categories`, `withoutCategory`, `outsideXml`) acontece antes dela. Nenhum problema aqui.
- **Preview — lógica preservada**: o corpo do `preview` é idêntico ao de `5c5e541`. Só o comentário mudou.
- **Supplier com CNPJ nulo**: `suppliers.findFirstByUserIdAndDocument(owner.getId(), emitter.document())` com `null` vira `IS NULL` no Spring Data. Se o parser aceitar nota sem CNPJ, o sistema reaproveita qualquer fornecedor do usuário sem CNPJ. Garanta CNPJ obrigatório no parser ou trate o caso.
- **`categoryId` mal formado**: `categories.findById(chosen.get(number))` com string não-UUID pode lançar exceção de conversão e virar 500. `ExpenseService.create` tem o mesmo comportamento, então é padrão do repo; registre como observação.
- **Itens duplicados no request**: `chosen.put` sobrescreve em silêncio quando o mesmo `itemNumber` aparece duas vezes. Valide e devolva 400.
- **`Location` ausente**: `architecture.md` §6.1 pede `201` com header `Location` em `POST` de criação. O `confirm` retorna lista sem `Location`. Decida e documente a exceção.
- **Helpers `invalid`/`join` duplicados**: `NfeImportService` replica `ExpenseService.invalid` (linha 333). Extraia junto com o item 2.
- **Teste acoplado a SQL bruto**: `NfeImportControllerConfirmTest` lê via `JdbcTemplate` com nomes de coluna. Isso quebra se o mapeamento mudar. Considere `ExpenseRepository`.
- **Cobertura faltante**: não há teste para `items` ausente ou JSON inválido, nem para `categoryId` em branco (só nulo). O teste de categoria mal formada também falta.
- **Estilo**: `org.mockito.Mockito.verifyNoInteractions` está inline; importe.
- **Controlador**: magro e sem repositório, conforme §5.2.1.
- **DTO**: `NfeImportRequestDTO` é record, conforme §5.2.2.
- **Testes de 400/404/409**: afirmam o corpo (`status`, `path`, `message`) e a contagem de linhas. O 404 afirma o corpo.

## Observações fora do escopo deste diff

- `NfeKeyGuard.ensureNotRegisteredWithoutLock` e `ProjectRepository.countActiveExpensesByProjectIdAndNfeKey` (`ProjectRepository.java:28`): o método de repositório está em `ProjectRepository`, não em `ExpenseRepository`. Vale revisar o local da consulta em uma issue de manutenção.
