# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Referência UTC única, horizonte inclusivo, soma e quantidade do mesmo conjunto | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:39`; `apps/api/src/test/java/com/obracerta/service/PaymentServiceTest.java:32`; `apps/api/src/test/java/com/obracerta/controller/PaymentAlertsIntegrationTest.java:47`. |
| CA1 — Ordenação crescente, desempate por identificador e ausência de truncamento | atendido | `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:25`; `PaymentAlertsIntegrationTest.java:47`; `PaymentAlertsIntegrationTest.java:81`. |
| CA1 — Banner, descrição, vencimento, valor e urgência por texto e cor | atendido | `apps/web/src/app/features/home-page/home-page.html:54`; `apps/web/src/app/features/home-page/home-page.spec.ts:115`. |
| CA2 — Excluir pagas, sem vencimento e posteriores a +7; vazio positivo e acesso a Contas a Pagar | atendido | `apps/api/src/main/java/com/obracerta/repository/ExpenseRepository.java:23`; `PaymentAlertsIntegrationTest.java:47`; `apps/web/src/app/features/home-page/home-page.html:66`; `home-page.spec.ts:134`. |
| CA6 — Leitura restrita ao proprietário e obra, 404 e exclusões lógicas | atendido | `apps/api/src/main/java/com/obracerta/service/PaymentService.java:36`; `ExpenseRepository.java:20`; `PaymentAlertsIntegrationTest.java:91`. |
| CA8 — Erro distinto de vazio, repetição manual e timeout finito | atendido | `apps/web/src/app/core/services/payment.service.ts:15`; `apps/web/src/app/features/home-page/home-page.ts:145`; `home-page.html:46`; `apps/web/src/app/core/services/payment.service.spec.ts:31`; `home-page.spec.ts:141`. |
| CA9 — Invalidar respostas antigas, inclusive A → B → A, e não consultar sem obra | atendido | `apps/web/src/app/features/home-page/home-page.ts:125`; `home-page.spec.ts:156`; `home-page.spec.ts:165`. |
| CA9 — Preservar logout, limpeza da obra e login em 401, sem reenvio automático | atendido | `apps/web/src/app/core/services/payment.service.spec.ts:51`; `apps/web/src/app/core/services/payment.service.ts:12`. |
| CA3, CA4, CA5 e CA7 | fora desta tarefa | `specs/10-alertas-vencimento-pagamentos/plan.md:30`. |
| Partes de quitação, modal e envio de CA6, CA8 e CA9 | fora desta tarefa | `specs/10-alertas-vencimento-pagamentos/plan.md:30`. |

A pendência de validação da rodada 1 foi resolvida: conferi os registros `tarefa-01-validacoes-r1.md` e `tarefa-01-validacoes-r2.md` e os relatórios Surefire atuais. Foram aprovados **40 testes Angular** e, após a extração do mapper, **6 testes Java**, incluindo **3 integrações PostgreSQL**, sem falhas, erros ou testes ignorados. Nesta revisão, usei essas execuções verificadas, sem repetir operações canceladas.

A extração em `apps/api/src/main/java/com/obracerta/mapper/PaymentMapper.java:11` preserva os campos e o contrato consumido pela Home. A integração substitui a identidade e desabilita os filtros HTTP; comprova o isolamento no serviço/repositório, sem constituir teste JWT real. O fluxo 401 do cliente foi exercitado com o interceptor existente.

As alterações documentais preexistentes permanecem excluídas da avaliação. Nenhum arquivo foi alterado.

## Apontamentos
