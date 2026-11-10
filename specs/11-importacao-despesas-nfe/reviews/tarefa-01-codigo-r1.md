REPROVADO

**Limitação desta revisão:** o shell foi negado no meu ambiente, então não rodei `git diff --cached 4cf5b4b` nem os testes. Li os cinco arquivos da tarefa no working tree. Se o conteúdo staged diferir do working tree, este parecer não cobre a diferença. Também não há evidência de execução dos testes.

# Parecer de Código — Tarefa 1

**Veredito:** REPROVADO (um apontamento bloqueante)

## Apontamentos (bloqueiam)

1. **O ramo de obra inexistente ou excluída não tem teste.** `NfeKeyGuard.java:21` lança `ResourceNotFoundException` quando `lockActiveById` não acha a obra ativa. Nenhum dos quatro testes em `NfeKeyGuardTest.java:43-87` cria uma obra excluída ou usa um id inexistente. O comportamento de 404 que `docs/architecture.md` exige para obra inexistente, excluída ou alheia (§6, linhas 444 e 457; §5.2.3) não é provado. Isso viola a regra de TDD (`utf-rules.md` §4: o teste vem antes da lógica, na camada onde o comportamento vive).
   - Prejuízo concreto: se o `orElseThrow` for removido, trocado por um `Optional.empty()` silencioso ou o filtro `deletedAt is null` do `ProjectRepository.java:21` regredir, nada quebra. A guarda passaria a aceitar importações em obra excluída sem nenhum teste acusar.
   - Correção sugerida ao implementador: um teste em `NfeKeyGuardTest` com obra excluída (`setDeletedAt`) e outro com id inexistente, esperando `ResourceNotFoundException`.

## Sugestões (não bloqueiam)

- **Propagação da transação (`NfeKeyGuard.java:19`).** O `@Transactional` padrão (REQUIRED) cria uma transação própria se nenhuma existir. Sem transação externa, o `FOR UPDATE` é liberado logo após o `count` e a trava deixa de proteger a gravação. Com `@Transactional(propagation = Propagation.MANDATORY)` o uso fora de transação falha na hora. O Javadoc da linha 18 já afirma esse contrato, mas o código não o garante. Prejuízo: duas importações concorrentes passam pela checagem e gravam a mesma nota duas vezes. Vale fixar antes de a Tarefa 2 chamar a guarda, e cobrir com o teste de concorrência previsto no plano.
- **Pré-condição de autorização não documentada.** A guarda recebe `projectId` e não verifica a posse da obra. O chamador precisa autorizar antes, como manda `architecture.md` §7.2 (linhas 580-581). Sem isso, a guarda devolve 409 para uma chave existente em obra alheia e 404 para as demais, o que vira um oráculo de existência. Vale registrar a pré-condição no Javadoc.
- **Sem handler para a exceção de domínio.** `NfeAlreadyRegisteredException` não tem `@ExceptionHandler` em `GlobalExceptionHandler.java:15-122`. `architecture.md` §5.2.3 (linha 402) exige 409 para violação de unicidade. Como ainda não há endpoint, não há prejuízo nesta tarefa. Mas o handler precisa entrar na mesma branch do endpoint de importação, senão a duplicata sai como 500.
- **Bloqueio sem prova de comportamento.** Nenhum teste demonstra que `PESSIMISTIC_WRITE` serializa duas transações. O plano coloca essa prova no teste de concorrência de uma tarefa posterior, então está ok para esta tarefa. Só registro para não esquecer.

## Verificações que passaram

- Nenhuma migration nem índice `idx_expenses_project_nfe` nas migrations. O grep não achou nada. `ddl-auto` não foi alterado (`utf-rules.md` §4.1; `architecture.md` §8, linhas 605-607).
- O teste `ExpenseNfeKeyIndexTest` descrito no plano (`plan.md:37`) não existe mais.
- Os nomes seguem o padrão do repo: `lockActiveById` segue `findActiveByIdAndOwner`, e a guarda fica em `service/` com `@Service`.
- Não há duplicação da regra: `nfeKey` só aparece no mapeamento de `Expense` e nesta tarefa.
- O `ExpenseService.delete` existe (`ExpenseService.java:84`), e o teste de delete usa o caminho real do serviço.
- Os asserts de `ExpenseServiceDeleteNfeTest` e de `NfeKeyGuardTest` checam o resultado observável (exceção, `deletedAt`, ausência de exceção), não detalhe de implementação.

## Observações fora do escopo deste diff

- Quando o endpoint de importação entrar, criar o handler de 409 para `NfeAlreadyRegisteredException` e um teste de contrato de API para ele (candidato a Issue ou tarefa da própria importação).
- Confirmar a regra de cada chamador da guarda (autorização da obra antes da chamada) quando a Tarefa 2 entrar.
