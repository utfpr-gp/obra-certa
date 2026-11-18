# Parecer de Conformidade — Tarefa 12

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA8 — Falha na confirmação não deixa dados parciais ou comprovante órfão | não atendido. A intenção sobrevive ao rollback e protege a importação ativa ou confirmada, mas pode ser encerrada antes da conclusão de um PUT remoto. | `NfeImportService.java:132`, `NfeReceiptCleanupService.java:66` |

## Apontamentos

1. **A reconciliação pode encerrar a pendência antes de o PUT remoto terminar** — `apps/api/src/main/java/com/obracerta/service/NfeReceiptCleanupService.java:70`  
   Critério violado: `specs/11-importacao-despesas-nfe/spec.md:40` (CA8).  
   Evidência: após perda de resposta ou interrupção durante o PUT, o armazenamento ainda pode gravar o XML. A reconciliação chama `delete(key, false)` e remove a pendência ao primeiro DELETE diferido bem-sucedido. Se o PUT terminar depois desse DELETE, o XML fica órfão, sem registro para retomar a limpeza. O intervalo de 10 minutos agenda a tentativa, mas o código não estabelece um prazo máximo de conclusão do PUT no armazenamento. O teste `NfeImportServiceAtomicityTest.java:99` registra a chave antes de lançar a exceção e verifica chamadas de DELETE, sem simular um objeto que só aparece depois da última exclusão.
