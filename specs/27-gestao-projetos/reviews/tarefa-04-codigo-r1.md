# Parecer de Código — Tarefa 4

**Veredito:** APONTAMENTOS

## Apontamentos bloqueantes

1. **A exclusão lógica não propaga `deleted_at` para os recursos filhos** — `apps/api/src/main/java/com/obracerta/service/ProjectService.java:79-85`

   A arquitetura determina que a exclusão de uma obra propague o carimbo para `budgets`, `expenses` e `pending_payments`. O método observado apenas marca o projeto.

2. **Uso direto de `LocalDateTime.now()` em vez de `Clock` injetável** — `apps/api/src/main/java/com/obracerta/service/ProjectService.java:84`

   A arquitetura define relógio injetável para classes de serviço que operam sobre datas.

## Sugestões

- Adicionar testes específicos para a propagação do soft delete.
- Adicionar testes Anti-IDOR para `PUT` e `DELETE`.
- Validar uma segunda exclusão como `404`.

## Observação de execução

O revisor não conseguiu executar `git diff 8f3ca92` nem `.\mvnw.cmd -B -Dtest=ProjectLifecycleTest test` no próprio ambiente.
