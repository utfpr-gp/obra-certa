# Parecer de Conformidade — Tarefa correção-upload-http, rodada 1

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Restaurar progresso intermediário do envio de comprovantes — US03 CA3 e item 1 aceito da auditoria | atendido | `apps/web/src/app/app.config.ts:19`; `apps/web/src/app/app.config.spec.ts:61–94` |
| Preservar autenticação Bearer nos uploads | atendido | `apps/web/src/app/app.config.ts:19`; `apps/web/src/app/app.config.spec.ts:81` |
| Preservar encerramento da sessão em 401 — US05 CA10 e abandono da US03 | atendido | `apps/web/src/app/app.config.spec.ts:97–109`; interceptor existente preservado |
| Preservar Fetch e autenticação na configuração do servidor | atendido | `apps/web/src/app/app.config.server.ts:10–14`; `apps/web/src/app/app.config.spec.ts:125–138` |
| Corrigir somente a regressão autorizada, sem acrescentar funcionalidades | atendido | Patch `apps/api/target/correcao-upload-http-final.diff`, limitado às três fontes despachadas |
| Ajustar integração, código ou histórico da US04 | fora desta tarefa | Proibição expressa registrada em `auditoria-final-decisoes-r1.md` |
| Reavaliar integralmente os demais critérios da US05 e alterações externas US15 | fora desta tarefa | Recorte explícito desta revisão |

A configuração do navegador volta a selecionar `HttpXhrBackend`. O teste usa os providers reais da aplicação e mantém o backend Angular: controla apenas a fronteira `XMLHttpRequest`, entrega progresso de 25/100 e exige `UploadProgress` antes de qualquer `Response`. Assim, verifica o comportamento que regrediu, sem substituir o backend por `HttpTestingController`.

A configuração do servidor acrescenta Fetch após mesclar os providers compartilhados. Os testes verificam tanto a seleção de `FetchBackend` quanto a permanência do header Bearer. O interceptor existente permanece responsável por logout e propagação de 401.

Foram conferidos os logs centralizados: RED com três falhas e dois sucessos, GREEN com cinco sucessos, suíte completa com 395 sucessos e build concluído com seis rotas prerenderizadas. O registro de validação informa exit 0. Não repeti ChromeHeadless ou GUI, conforme o despacho. O aviso NG0505 dos testes e o aviso preexistente de orçamento do bundle estão registrados e não representam critério descumprido neste recorte.

A aprovação cobre exclusivamente a correção do item 1. A integração manual da US04 permanece sob controle do autor e não constitui apontamento contra esta correção.

## Apontamentos

## Sugestões não bloqueantes

Nenhuma.
