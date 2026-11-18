# Parecer de Conformidade — Tarefa 1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Referência UTC única, classificação de urgência e soma exata | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:38`; `PaymentServiceTest.java:32`. Executei os três testes unitários: passaram. |
| CA1 — Horizonte inclusivo, ordenação, desempate e apresentação real na Home | não atendido — comprovação executável pendente | `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:19`; `PaymentAlertsIntegrationTest.java:47`; `apps/web/src/app/features/home-page/home-page.html:43`; `home-page.spec.ts:115`. Implementado na leitura; integração e specs Angular sem execução válida. |
| CA2 — Exclusões do horizonte e estado vazio positivo | não atendido — comprovação executável pendente | `ExpenseRepository.java:23`; `PaymentAlertsIntegrationTest.java:47`; `apps/web/src/app/features/home-page/home-page.html:66`; `home-page.spec.ts:134`. |
| CA6 — Isolamento da leitura e exclusões lógicas | não atendido — comprovação integrada pendente | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:35`; `ExpenseRepository.java:20`; `PaymentAlertsIntegrationTest.java:91`. A autorização antes da leitura foi comprovada pelo teste unitário; os filtros reais dependem da integração PostgreSQL. |
| CA8 — Erro distinto de vazio, repetição manual e timeout finito | não atendido — comprovação Angular pendente | `apps/web/src/app/core/services/payment.service.ts:15`; `apps/web/src/app/features/home-page/home-page.ts:131`; `home-page.html:46`; `payment.service.spec.ts:39`; `home-page.spec.ts:141`. |
| CA9 — Sem consulta sem obra, descarte de respostas antigas inclusive A → B → A e fluxo existente de 401 | não atendido — comprovação Angular pendente | `apps/web/src/app/features/home-page/home-page.ts:125`; `home-page.spec.ts:156`; `home-page.spec.ts:165`; `apps/web/src/app/core/services/payment.service.spec.ts:51`. |
| CA3, CA4, CA5, CA7 e partes de escrita/modal de CA6, CA8 e CA9 | fora desta tarefa | `specs/10-alertas-vencimento-pagamentos/plan.md:35`. Não foi implementada quitação nesta etapa. |

## Apontamentos

1. **Falta concluir a comprovação integrada e Angular dos critérios da tarefa** — `apps/api/src/test/java/com/obracerta/controller/PaymentAlertsIntegrationTest.java:22`; `apps/web/src/app/features/home-page/home-page.spec.ts:115`; `apps/web/src/app/core/services/payment.service.spec.ts:39`  
   Critério violado: comprovação dos comportamentos de CA1, CA2, CA6, CA8 e CA9, em `specs/10-alertas-vencimento-pagamentos/spec.md:20`, `:21`, `:25`, `:27` e `:28`.  
   Evidência: os testes estão presentes e a leitura não revelou desvio funcional nesses comportamentos. Contudo, PostgreSQL indisponível e variáveis `SPRING_DATASOURCE_*` ausentes impediram a execução integrada informada no despacho. ChromeHeadless também não iniciou no sandbox; a tentativa escalada foi cancelada. Não repeti essas operações nem solicitei nova aprovação. Executei `.\mvnw.cmd '-Dtest=PaymentServiceTest' test`: **3 testes passaram, nenhuma falha ou erro**. Isso comprova o serviço isolado, mas não a seleção real no banco, a renderização, o interceptor e as transições da Home. Conforme o método deste papel, teste sem execução válida não conta como critério atendido. O apontamento é de validação pendente, sem correção de código indicada.

As quatro alterações documentais preexistentes foram lidas e excluídas da avaliação da tarefa, conforme o despacho. Nenhum arquivo foi alterado.
