# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

Revisão de conformidade da Issue 48, tarefa 2, rodada 2, contra `specs/48-orcamento-cub/spec.md` (CA1, CA5, CA7). O diff foi lido inteiro com `git diff --cached 13390bc`. Não rodei testes: o acesso a shell foi negado na sessão. A contagem de 24 testes de API e 578 do frontend é do registro do orquestrador e não pude confirmá-la.

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — consulta com área positiva, UF, mês, projeto e acabamento | atendido | Chamada: `sinapi-form.component.ts:124-125`. Validação e rota: `BudgetController.java:34-42`, `SinapiReferenceService.java:41-46`. Área positiva: `sinapi-form.component.ts:82`. |
| CA1 — prévia com fonte, custo/m² da tabela 647 variável 51 e estimativa = custo × área | atendido | Fonte: `sinapi-form.component.html:66`. Custo e estimativa: `html:69-74`. Cálculo: `sinapi-form.component.ts:84`. URL `t/647/…/v/51`: `SidraClient.java:24`. Teste: `budget-form-modal.component.spec.ts:169`. |
| CA1 — rótulo "SINAPI" da aba (pedido da rodada 1) | atendido | `budget-form-modal.component.html:40` |
| CA5 — falha, timeout ou resposta incompatível vira erro temporário, não lista vazia (apontamento 1 da rodada 1) | atendido | `SidraClient.java:58-62` (RestClientException → 503), `SidraClient.java:64-66` (cabeçalho inválido ou não-array → 503). Só cabeçalho válido sem combinações retorna lista vazia: `SidraClient.java:64-66` e `71-86`. Testes: `BudgetControllerTest.java:170-178` (sem dados), `:180-191` (timeout), `:193-205` (`[]`, `{"error":…}`, cabeçalho incompleto). |
| CA5 — informa a situação e permite nova tentativa | atendido | Mensagem: `sinapi-form.component.html:49`. Botão: `html:53-56`. `catchError` marca `lookupFailed`: `sinapi-form.component.ts:126-129`. Teste: `budget-form-modal.component.spec.ts:247-285`. |
| CA5 — impede a confirmação até valor válido | atendido no escopo da tarefa | Sem prévia em erro: `sinapi-form.component.ts:82` e teste em `budget-form-modal.component.spec.ts:274`. A confirmação só existe na tarefa 4. |
| CA5 — timeout da consulta da UI | atendido | Timeout de 15 s no serviço: `budget.service.ts:28`. Qualquer erro cai no mesmo `catchError`. |
| CA7 — oito projetos em "Casa popular" e "Casa residencial" | atendido | `sinapi-form.component.ts:35-53`, idêntico ao PRD (`docs/prd.md:559-566`). Teste: `budget-form-modal.component.spec.ts:195-196`. Mapeamento no backend: `SinapiReferenceService.java:31-32`. |
| CA7 — só acabamentos com custo numérico e positivo | atendido | Filtro: `SidraClient.java:80-81` e `:95-100` (`signum() > 0`). Testes: `BudgetControllerTest.java:143-168`, com valores `-`, `0`, `-10.01`, e as dimensões de outra UF, mês, projeto ou acabamento. |
| CA7 — mudança de seleção invalida a prévia anterior | atendido | `switchMap` cancela a consulta anterior e zera `references`: `sinapi-form.component.ts:116-122`. Teste de resposta atrasada: `budget-form-modal.component.spec.ts:247-273` (`previous.next` não entra na tela). |
| CA7 — só habilita após valor da combinação atual | atendido | `finish.enable()` só com lista não vazia: `sinapi-form.component.ts:137`. |
| CA7 — nenhum acabamento aplica CA5 | atendido (ver sugestão 2) | `sinapi-form.component.html:50-51` e `:53-56`. Teste: `budget-form-modal.component.spec.ts:226`. |
| Titularidade antes da chamada ao SIDRA (tarefa 2) | atendido | `SinapiReferenceService.java:48-49` antes de `sidra.getFinishes` na linha 50. Teste: `BudgetControllerTest.java:131-141`. |
| Validação de parâmetros antes de consultar (tarefa 2) | atendido | `SinapiReferenceService.java:42-46`. Teste: `BudgetControllerTest.java:119-129`, com `verifyNoInteractions(projectRepository)`. |
| Erro e nova tentativa no frontend (tarefa 2) | atendido | `sinapi-form.component.ts:71`, `:141-143`. Teste: `budget-form-modal.component.spec.ts:279-285`. |
| Rodada 1, apontamento 2: import `tick` sem uso | atendido | Sem `tick(` em `apps/web/src/app/features/budgets-page`. Import removido em `budgets-page.component.spec.ts:1` e `budget-form-modal.component.spec.ts:1`. |
| Provedor de exemplo fora do fluxo normal (plano, tarefa 2) | atendido | Removidos `sinapiDemoAvailable` e `isDevMode`. Sem textos "exemplo" ou "Demonstração" em `budgets-page`. Aba exibida com `projectId`: `budget-form-modal.component.ts:94`. |
| CA2, CA3, CA4, CA6, CA8 | fora desta tarefa | `plan.md:38-54` (tarefas 3, 4 e 5) |

## Apontamentos

Nenhum apontamento bloqueante.

## Sugestões (não bloqueiam)

1. **Timeout do frontend sem teste próprio.** `budget-form-modal.component.spec.ts` cobre erro 503, mas não um `HttpErrorResponse` de timeout (status 0). O `catchError` é genérico e cobre o caso. Um teste com esse status fecharia a prova do "erro/tempo limite" da tarefa 2 sem depender da lógica implícita.
2. **Mensagem de lista vazia (CA7 → CA5).** O CA7 manda aplicar o CA5 quando nenhum acabamento está disponível. Hoje a lista vazia mostra "Nenhum acabamento disponível para esta seleção" com botão de nova tentativa. Isso informa a situação e não libera prévia, então atende. Se a intenção do autor for tratar esse caso como indisponibilidade, o texto poderia se aproximar do erro (`sinapi-form.component.html:51`).
3. **Teste de timeout do backend simulado.** `BudgetControllerTest.java:180-191` lança `SocketTimeoutException` no mock, em vez de exercitar o timeout real de 5 s de `SidraClient.java:24`. Serve para provar o mapeamento para 503, sem provar o tempo limite em si.

## Observações fora do escopo deste diff

- O diff inclui os pareceres e decisões da rodada 1 em `specs/48-orcamento-cub/reviews/`. São artefatos do fluxo, não código da tarefa.
- Não encontrei código fora da tarefa 2 no diff.
