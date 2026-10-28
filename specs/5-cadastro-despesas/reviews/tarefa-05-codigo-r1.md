# Parecer de Código — Tarefa 5

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Teste depende de campo privado do adaptador** — `apps/api/src/test/java/com/obracerta/integration/S3ReceiptStorageTest.java:18`
   
   Regra violada: estratégia de testes com Mockito de `docs/architecture.md`, §9.2, complementada pela proibição explícita do papel `revisor-codigo.md`: “teste acoplado a detalhe de implementação”.
   
   Prejuízo concreto: `getDeclaredField("client")` e `setAccessible(true)` fazem uma simples renomeação ou reorganização interna do cliente quebrar o teste, mesmo preservando integralmente o upload. Disponibilizar a dependência por injeção permite verificar os mesmos bytes sem acessar estado privado.

## Sugestões (não bloqueiam)

- `apps/api/src/main/java/com/obracerta/integration/S3ReceiptStorage.java:51`: preservar a causa ou registrar diagnóstico das exceções convertidas em 503. Hoje, problemas de credenciais, bucket, endpoint e rede perdem sua causa, dificultando identificar a correção operacional.

## Observações fora do escopo deste diff

- Maven alerta sobre o escopo `annotationProcessor` do Lombok; build Angular alerta sobre o orçamento inicial excedido. Os trechos responsáveis não foram introduzidos nesta tarefa.

Verificação executada: **11 testes API passaram**; **build Angular passou**, com o aviso citado. Diff completo revisado pelo comando solicitado. Nenhum arquivo-fonte alterado.
