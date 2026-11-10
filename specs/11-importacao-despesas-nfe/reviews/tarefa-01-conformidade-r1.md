REPROVADO (por falta de evidência de execução dos testes, não por defeito de código; ver apontamento 1)

**Observação:** o shell me foi negado (`Permission denied: shell`), então não rodei `git diff` nem os testes. A análise abaixo é estática, feita com leitura de arquivos e grep sobre o estado atual do repositório. Os trechos do diff vieram do `git diff --cached 4cf5b4b` que você passou, lidos pelo conteúdo que ele mostrou.

# Parecer de Conformidade — Tarefa 1

**Veredito:** APONTAMENTOS (REPROVADO na linha acima pela ausência de execução)

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — chave já ativa na obra é recusada com mensagem "A nota fiscal já foi registrada" | parcialmente atendido: a guarda recusa e a mensagem está certa, mas "não grava nenhuma linha" depende de quem chama a guarda (Tarefa 4), que ainda não existe | `NfeKeyGuard.java:21-23`; `NfeAlreadyRegisteredException.java:6`; `NfeKeyGuardTest.java:43-50` |
| CA3 — mesma chave em outra obra é aceita | atendido (teste) | `NfeKeyGuardTest.java:52-61` |
| CA11 — linha ativa mantém a chave bloqueada | atendido (teste), com `ExpenseService.delete` real | `ExpenseServiceDeleteNfeTest.java:67-72`; `ExpenseService.java:84-107` |
| CA11 — excluir todas as linhas libera a chave | atendido (teste, via `setDeletedAt` direto na entidade, não pelo serviço) | `NfeKeyGuardTest.java:70-82` |
| Plano T1 — despesas sem chave não contam | atendido (teste) | `NfeKeyGuardTest.java:63-68` |
| Plano T1 — trava por obra (`SELECT ... FOR UPDATE` em `projects`) | atendido, por leitura do código | `ProjectRepository.java:20-22`; `NfeKeyGuard.java:19-21` |
| Plano T1 — "Migration: nenhuma" | atendido: nenhum arquivo de migration no diff; `ExpenseNfeKeyIndexTest` não existe mais | — |
| Escopo: sem conversão para 409, sem endpoint, sem controller | atendido: nenhum handler de exceção, controller ou DTO no diff | — |

## Apontamentos

1. **Execução dos testes não comprovada.** O plano manda "Teste que não roda não conta como critério atendido". Não consegui rodar `NfeKeyGuardTest` nem `ExpenseServiceDeleteNfeTest` (shell negado). Esta revisão não tem evidência de que compilam e ficam verdes contra o PostgreSQL de teste.
   Critério violado: plano, Tarefa 1 ("Teste primeiro: integração PostgreSQL do `NfeKeyGuard`") e método do revisor, passo 3.
   Evidência: o único retorno de shell foi `Permission denied`. Para destravar, o autor deve anexar a saída verde de algo como `mvn -f apps/api/pom.xml test -Dtest=NfeKeyGuardTest,ExpenseServiceDeleteNfeTest` (com o Postgres de teste no ar). Com isso, o veredito passa a APROVADO, desde que nenhum outro ponto abaixo mude.

## Sugestões não bloqueantes

- `NfeKeyGuard.ensureNotRegistered` recebe só `projectId`, sem checar o dono. A checagem de "obra deste usuário" fica para o chamador (Tarefa 3/4). Como a chave é por obra e a obra tem um único dono, o resultado está correto; vale um comentário dizendo que o chamador valida a propriedade antes.
- O teste "despesas sem chave não contam" (`NfeKeyGuardTest.java:63-68`) só prova que uma linha com chave nula não bloqueia uma chave diferente. Seria mais forte também checar que a própria chave nula não dispara a exceção, mas a guarda nunca recebe nulo, então isso não é crítico.
- `NfeKeyGuardTest.java:70-82` libera a chave marcando `deletedAt` direto na entidade. O CA11 e o plano falam de excluir pelo `ExpenseService`; o teste de `ExpenseServiceDeleteNfeTest` cobre esse caminho, então não é bloqueante.
- `docs/architecture.md:330-331` ainda descreve o índice único parcial que o plano descartou. O plano já deixa a atualização para o Passo 4, então não é desta tarefa.
