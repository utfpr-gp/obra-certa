# Parecer de Conformidade — Tarefa 4

**Veredito:** APONTAMENTOS

## Apontamentos bloqueantes

1. **Os vínculos de orçamentos e despesas não são inativados durante a exclusão lógica da obra** — `apps/api/src/main/java/com/obracerta/service/ProjectService.java:79-87`

   A CA4 exige que a exclusão lógica inative os vínculos de despesas e orçamentos. O método observado apenas define `deletedAt` no projeto.

2. **O teste obrigatório não foi executado nesta revisão.**

   O ambiente do revisor não permitiu executar `git diff 8f3ca92` nem `.\mvnw.cmd -B -Dtest=ProjectLifecycleTest test`.

3. **O teste de ciclo de vida não cobre o Anti-IDOR de `PUT` e `DELETE`.**

   O teste exercia somente a obra do próprio usuário e não comprovava `404` nem ausência de alteração para a obra de outro usuário.

## Evidências observadas

- O controller delega ao service sem injetar repository.
- O service usa `findByIdAndUserIdAndDeletedAtIsNull`.
- `PUT` retorna `200 OK` e `DELETE` retorna `204 No Content`.
