# Parecer de Conformidade — Tarefa 12

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA8 — Falha na confirmação não deixa gravação parcial | Não atendido em caso de falha no rollback após perda da resposta do PUT. A reconciliação preserva a pendência quando reconhece a incerteza, mas a confirmação pode classificar esse caso como upload concluído. | `NfeImportService.java:148`, `NfeReceiptCleanupService.java:54` |

## Apontamentos

1. **Uma falha no rollback pode fazer a API descartar a pendência de um PUT ainda em andamento** — `apps/api/src/main/java/com/obracerta/service/NfeImportService.java:148`  
   Critério violado: `specs/11-importacao-despesas-nfe/spec.md:40` (CA8).  
   Evidência: o serviço usa a classe da exceção devolvida pelo `TransactionTemplate` para decidir se o resultado do PUT é incerto. Se o PUT perder a resposta e o rollback também falhar, a exceção do rollback pode substituir a `ReceiptException`. Quando a transação de compensação voltar a funcionar, ela poderá marcar a pendência como certa e encerrá-la após um DELETE bem-sucedido. Um PUT que conclua depois desse DELETE deixará o XML sem pendência de limpeza. Os testes de PUT tardio e interrupção não simulam a substituição da exceção durante o rollback.
