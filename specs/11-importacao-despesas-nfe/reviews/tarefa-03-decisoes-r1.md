# Decisões — Tarefa 3, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Teste de 400 só para XML corrompido; falta o motivo "não é NF-e" no nível HTTP (`NfeImportControllerPreviewTest.java:96-107`) | conformidade | aceito | CA2 cobre os dois motivos. Caso 400 com `nfe-outro-documento.xml` afirmando a mensagem. |
| 2 | Regra de "chave já registrada" duplicada entre `NfeImportService.java:30-31` e `NfeKeyGuard.java:22-23` | código | aceito | A regra precisa de um dono. Extraída como método de leitura sem trava em `NfeKeyGuard`, usado pelo preview e pela versão com trava. Desvio em relação à decisão "preview não usa NfeKeyGuard": o preview usa só o método de leitura, que não toma trava. |
| 3 | Ordem "dono antes do parse" sem teste (`NfeImportService.java:27`) | código | aceito | Caso com obra alheia e XML inválido, esperando 404, para proteger o isolamento. |
| — | Testes não executados pelos revisores (shell negado) | conformidade e código | resolvido | O autor rodou `NfeImportControllerPreviewTest`: 6/6, `BUILD SUCCESS`, na rodada 1. |
| — | 401 sem corpo `ApiErrorResponse` | conformidade (sugestão) | não triado | Desvio do plano, a registrar no plano. Não é apontamento bloqueante. |

Sugestões do revisor de código (escopo por obra, prova de escrita em outras tabelas, imports, posição do `@AfterEach`, wildcard, bufferização antes da posse, status 413 literal) não entraram na triagem.
