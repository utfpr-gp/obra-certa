# Parecer de Código — Tarefa 12, rodada 2

**Veredito: APONTAMENTOS**

## Apontamento bloqueante

1. **Um retry interno do SDK pode encerrar a pendência cedo demais.** A arquitetura usa Storage compatível com S3, e o cliente mantém os retries padrão do SDK, inclusive após timeout. Se o primeiro PUT continuar no servidor e o segundo retornar sucesso, uma falha posterior no banco faz a compensação classificar o upload como certo. O DELETE então encerra a pendência. Se o primeiro PUT terminar depois, o XML volta a ficar órfão. Os testes de upload tardio cobrem a chamada de storage que retorna erro, sem exercitar a sequência timeout, retry com sucesso e rollback. [NfeImportService.java](C:/Users/panic/dev/obra-certa/apps/api/src/main/java/com/obracerta/service/NfeImportService.java:148) · [NfeReceiptCleanupService.java](C:/Users/panic/dev/obra-certa/apps/api/src/main/java/com/obracerta/service/NfeReceiptCleanupService.java:54) · [S3ReceiptStorage.java](C:/Users/panic/dev/obra-certa/apps/api/src/main/java/com/obracerta/integration/S3ReceiptStorage.java:49) · [Documentação de retries da AWS](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/retry-strategy.html)

## Sugestões e observações fora do escopo

Nenhuma adicional. A execução dos testes PostgreSQL ficou com o orquestrador.
