# Parecer de Conformidade — Tarefa 4, rodada 2

**Veredito:** APONTAMENTOS

## Apontamentos bloqueantes

1. **O teste obrigatório não foi executado** — `apps/api/src/test/java/com/obracerta/service/ProjectLifecycleTest.java`

   O revisor não conseguiu executar o comando no ambiente dele. No ambiente principal, porém, o comando foi executado contra PostgreSQL 16 real:
   `.\mvnw.cmd -B -Dtest=ProjectLifecycleTest test`
   Resultado: 2 testes, 0 falhas, 0 erros, `BUILD SUCCESS`.

2. **A implementação não usa `Clock` injetável para o soft delete** — `apps/api/src/main/java/com/obracerta/service/ProjectService.java:95`

   O código utiliza diretamente `LocalDateTime.now()`, enquanto a arquitetura recomenda relógio injetável para serviços que operam sobre datas.

## Sugestão

- O teste cobre budgets e expenses, mas não cria nem verifica um registro em `pending_payments`.

## Critérios atendidos observados

- Propagação do soft delete para budgets, expenses e pending_payments, com migration.
- Anti-IDOR em PUT e DELETE, mantendo a obra alheia intacta.
