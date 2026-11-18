# Parecer de Conformidade — Tarefa 5

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA5 — Preservar filtros e ordenação após quitação | atendido | `apps/web/src/app/features/expenses/accounts-page.component.spec.ts:865`. Os controles reais aplicam filtros, aba e ordenação; o teste verifica os parâmetros da recarga e os resultados apresentados. |
| CA5 — Preservar ajuste para página existente após quitação e nova consulta | atendido | `accounts-page.component.ts:411`; `accounts-page.component.ts:455`; `accounts-page.component.spec.ts:945`; `accounts-page.component.spec.ts:1008`. |
| CA5 — Aviso anterior não permanece ao iniciar quitação de outra conta | atendido | `accounts-page.component.ts:372`; `accounts-page.component.spec.ts:918`. O cenário conclui quitação e recarga, abre a outra conta pelo botão da linha e verifica a ausência do aviso anterior. |
| CA5/CA8 — Distinguir falha de recarga pós-quitação e oferecer nova consulta | atendido | `accounts-page.component.ts:406`; `accounts-page.component.spec.ts:977`. |
| CA8 — Erro comum posterior mantém mensagem e tentativa genéricas | atendido | `accounts-page.component.ts:460`; `accounts-page.component.spec.ts:1047`. A aba Pagas é acionada pelo botão visível. |
| Tarefa 5 — Substituir parâmetros posicionais ambíguos por opções nomeadas | atendido | `accounts-page.component.ts:415`; `accounts-page.component.ts:457`. |
| Tarefa 5 — Cenários revisados acionam bindings pelos controles reais, sem chamar handlers diretamente | atendido | `accounts-page.component.spec.ts:755`; `:819`; `:836`; `:865`; `:950`; `:1013`; `:1058`. Eventos DOM sintéticos seguem a autorização revisada; paginação e abas usam botões do template. |
| Tarefa 5 — Manter Jasmine/Karma, contratos e escopo de manutenção | atendido | `specs/10-alertas-vencimento-pagamentos/reviews/tarefa-05-validacoes-r2.md:5`; alterações avaliadas restritas aos dois arquivos da listagem. |
| Demais critérios e implementação da tarefa 4 | fora desta tarefa | Delimitação expressa do despacho e `plan.md:56`. Não foram reavaliados. |

O apontamento aceito da rodada 1 foi resolvido nos cenários da tarefa 5: a preparação das páginas usa “Próxima”, a seleção de Pagas usa o botão da aba e as verificações observam requisições e interface.

Conferi o registro das execuções atuais realizadas pela raiz: **38/38 testes focados e 501/501 da suíte completa aprovados**, além de TypeScript e build com saída zero. Não repeti testes redundantes.

O snapshot complementar informado não estava acessível, tanto pelo Git quanto pela leitura de arquivo. A avaliação utilizou o diff solicitado, os pareceres anteriores, o critério revisado e o código atual, limitada aos cenários da tarefa 5. Chamadas internas em cenários preexistentes da tarefa 4 e anteriores ficaram fora desta avaliação. As quatro alterações documentais preexistentes também foram excluídas. Nenhum arquivo foi alterado.

## Apontamentos
