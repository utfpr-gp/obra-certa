# Parecer de Conformidade — Tarefa 6B — Rodada 1

## Veredito

Apontamentos bloqueadores.

## Apontamento

1. **[Alta]** A Home ainda resolve os dados dependentes em `ObraMockService` por IDs numéricos, enquanto os `Project` reais da API usam UUIDs. Com uma obra real, `getObraById(project.id)` não encontra dados e o dashboard fica vazio. Os testes cobrem apenas IDs artificiais compatíveis com o mock.

