# Parecer de Código — Tarefa 4A, rodada 1

**Veredito:** APONTAMENTOS

## Apontamento bloqueante

1. **Representação temporal inconsistente para `deleted_at` da obra** — `apps/api/src/main/java/com/obracerta/service/ProjectService.java:95-97` e `apps/api/src/main/java/com/obracerta/model/entity/Project.java:38-40`

   O instante é obtido como `Instant`, mas convertido para `LocalDateTime` antes de ser salvo no projeto, enquanto os vínculos financeiros usam `Instant`. A arquitetura define alinhamento com `timestamptz`/`Instant`.

## Sugestões

- Validar o tipo SQL das colunas após o Flyway.
- Considerar filtros de registros já excluídos nos updates em lote.

## Evidências

- `Clock` injetado por configuração.
- Mesmo instante propagado aos três repositories financeiros.
- V4 forward-only usando `timestamptz(6)`.
- `PendingPayment` explicitamente testado.
- Teste PostgreSQL: 2 testes, 0 falhas, 0 erros, `BUILD SUCCESS`.
