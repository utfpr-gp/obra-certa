# Parecer de Conformidade — Tarefa 4A, rodada 1

**Veredito:** APONTAMENTOS

## Apontamentos bloqueantes

1. **O teste não utiliza `Clock.fixed()`** — `apps/api/src/test/java/com/obracerta/service/ProjectLifecycleTest.java:47-54`

   O teste usa `@MockBean Clock` com `when(clock.instant()).thenReturn(DELETION_INSTANT)`, mas não comprova o uso de uma instância real `Clock.fixed()`, exigida pelo plano da Tarefa 4A.

2. **`projects.deleted_at` continua mapeado com `LocalDateTime`** — `apps/api/src/main/java/com/obracerta/model/entity/Project.java:43-44`

   A V4 corrige os vínculos financeiros para `timestamptz(6)`, mas a coluna da obra permanece `TIMESTAMP(6)` na V2 e a entidade permanece com `LocalDateTime`, divergindo do padrão temporal integral da arquitetura.

## Critérios atendidos

- Bean de `Clock` em UTC disponibilizado.
- Nova migration V4 sem editar V3.
- `PendingPayment` criado e verificado explicitamente.
- Propagação de soft delete, Anti-IDOR e teste PostgreSQL atendidos.

## Execução

O teste foi executado contra PostgreSQL 16 real: 2 testes, 0 falhas, 0 erros, `BUILD SUCCESS`.
