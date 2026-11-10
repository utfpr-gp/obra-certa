# Parecer de Código — Tarefa 12

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **A reconciliação encerra a pendência após um DELETE que pode anteceder a gravação remota.** A intenção guarda apenas a chave e a data da tentativa. A reconciliação sempre chama `delete(key, false)` e remove a intenção após um DELETE bem-sucedido, mesmo que o PUT anterior ainda possa concluir. Os dez minutos são uma espera local. A integração com o Storage S3 descrita na arquitetura não estabelece um prazo remoto de conclusão. Se o armazenamento concluir o PUT após o DELETE diferido, o XML reaparece sem registro que permita recuperá-lo. Esse é o mesmo estado órfão que motivou a tarefa. [NfeReceiptCleanupService.java](C:/Users/panic/dev/obra-certa/apps/api/src/main/java/com/obracerta/service/NfeReceiptCleanupService.java:66) · [Migração V12](C:/Users/panic/dev/obra-certa/apps/api/src/main/resources/db/migration/V12__create_nfe_receipt_cleanups.sql:1) · [Arquitetura do Storage](C:/Users/panic/dev/obra-certa/docs/architecture.md:611)

## Sugestões (não bloqueiam)

- Avaliar o impacto das chamadas de armazenamento dentro das transações. Cada PUT ou DELETE em espera retém uma conexão do PostgreSQL. A arquitetura registra um pool padrão de cinco conexões em produção. [NfeImportService.java](C:/Users/panic/dev/obra-certa/apps/api/src/main/java/com/obracerta/service/NfeImportService.java:134) · [Configuração do pool](C:/Users/panic/dev/obra-certa/docs/architecture.md:619)
- Documentar a migração V12 e o ciclo da pendência no fechamento documental da US09. [Contrato da US09](C:/Users/panic/dev/obra-certa/docs/architecture.md:539)

## Observações fora do escopo deste diff

Nenhuma.

## Verificação

`git diff --check` passou. A suíte PostgreSQL está sob execução do orquestrador.
