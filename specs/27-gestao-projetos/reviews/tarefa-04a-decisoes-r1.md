# Decisões — Tarefa 4A, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | O teste usa `@MockBean Clock` em vez de uma instância real `Clock.fixed()`. | conformidade | aceito | Corrigir na rodada 2 para comprovar o relógio fixo real. |
| 2 | `projects.deleted_at` permanece como `LocalDateTime`/`TIMESTAMP(6)`. | conformidade/código | aceito | Corrigir na rodada 2 com migration versionada e mapeamento Java alinhado. |
