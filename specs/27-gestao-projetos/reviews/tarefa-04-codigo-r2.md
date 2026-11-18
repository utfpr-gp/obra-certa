# Parecer de Código — Tarefa 4, rodada 2

**Veredito:** APONTAMENTOS

## Apontamentos bloqueantes

1. **`Clock` não é injetado no service** — `apps/api/src/main/java/com/obracerta/service/ProjectService.java:96`

   O método `delete` usa diretamente `LocalDateTime.now()`, contrariando a exigência arquitetural de relógio injetável.

2. **A migration nova usa `TIMESTAMP(6)` em vez de `timestamptz`** — `apps/api/src/main/resources/db/migration/V3__add_soft_delete_to_project_links.sql:2-4`

   O parecer considera que isso pode perder informação de fuso e divergir da convenção arquitetural.

## Verificações realizadas

- Controller → Service → Repository → Entity atendido.
- DTOs e Anti-IDOR atendidos.
- Transação e soft delete propagado atendidos.
- Migration versionada atendida.
- O teste `ProjectLifecycleTest` foi considerado válido pelo revisor com 2 testes, 0 falhas, 0 erros e `BUILD SUCCESS`.

## Sugestões

- Expandir o teste para inserir um PendingPayment.
- Passar o mesmo instante obtido pelo Clock aos updates.
