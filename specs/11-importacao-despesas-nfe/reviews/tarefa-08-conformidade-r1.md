APROVADO

# Parecer de Conformidade — Tarefa 8

**Veredito:** APROVADO (sem bloqueantes; 3 sugestões não bloqueantes)

> Nota de execução: o shell deste subagente foi negado (`Permission denied: shell`) nas duas tentativas, então **não rodei `git diff` nem a suíte de testes**. A revisão foi feita lendo os arquivos do diff diretamente. O resultado de 17 testes verdes é o reportado pelo orquestrador; não foi reconfirmado por mim. As 28 falhas de `payment-modal` não foram atribuídas a esta tarefa, e nada no diff toca esse componente.

## Critérios verificados

| Critério | Situação | Onde |
| --- | --- | --- |
| CA1 — envio de XML válido abre a conferência com fornecedor (razão social e CNPJ) | atendido | `nfe-import-dialog.component.html:78,82`; teste `nfe-import-dialog.component.spec.ts:116-117` |
| CA1 — data de emissão, chave de acesso | atendido | `html:86,90`; `component.ts:131-145`; teste `.spec.ts:118-119` (data `10/07/2026` e chave de 4 em 4) |
| CA1 — lista de todos os itens (descrição, quantidade, unidade, valor unitário, valor total) | atendido (com ressalva de teste) | `html:102-151`; teste `.spec.ts:122-128` (2 itens, descrição, unidade, totais) |
| CA2 — XML corrompido/não NF-e exibe motivo da falha e oferece cadastro manual | atendido | `component.ts:159-163,165-172`; `html:38-47`; teste `.spec.ts:131-145` |
| CA2 — cadastro manual navega para `/contas/nova` e fecha o diálogo | atendido | `component.ts:113-116`; teste `.spec.ts:140-144` |
| CA9 (tela) — troca de obra fecha o diálogo e descarta a resposta antiga | atendido | `component.ts:45-46,56-64,96-105,153-157`; `accounts-page.component.ts:344-349,381`; testes `.spec.ts:210-238` e `nfe-import-entry.spec.ts:49-60` |
| CA9 (tela) — A → B → A também descarta resposta antiga | atendido | `accounts-page`/`active-project.service.ts:60-64` (versão incrementa em toda transição, inclusive A→B→A); teste `.spec.ts:223-238` |
| Borda — timeout de 30 s, sem retry automático | atendido | `nfe-import.service.ts:17`; testes `nfe-import.service.spec.ts:90-101` e `.component.spec.ts:177-191` |
| Borda — 401 propagado ao interceptor (logout + login), sem alerta/retry próprio | atendido | `nfe-import.service.spec.ts:103-121`; `.component.spec.ts:193-208`; `component.ts:153-157` |
| Borda — 409 de chave já registrada como alerta informativo, sem cadastro manual | atendido | `component.ts:161-162,173-177`; `html:49-58`; teste `.spec.ts:147-159` (`nfe-manual` é `null`) |
| Decisão — total da nota aparece na conferência | atendido | `html:92-95`; teste `.spec.ts:120` (`170,00`) |
| Decisão — `accept=".xml"` e arquivo vazio sem chamar a API nem duplicar parse | atendido | `html:19`; `component.ts:86-88`; testes `.spec.ts:91-104` |
| Decisão — erro de rede/500/timeout com "Tentar novamente" reenviando o mesmo arquivo | atendido | `component.ts:109-111`; `html:60-68`; teste `.spec.ts:161-175` |
| Decisão — design-tokens aplicados (cores, raios, tipografia, 44px, mobile-first, tabela→cartões) | atendido | `html:1-160` (tokens `#007A80`/`#E6F2F3`, `rounded-2xl`/`rounded-md`, `min-h-11`, `lg:hidden` para cartões e tabela no desktop); `styles.css:6-44` |
| Decisão — nenhuma chamada a `/nfe/imports` e nenhum botão de confirmar | atendido | `nfe-import.service.ts` só expõe `preview()`; template não tem confirmação; grep sem `/nfe/imports` em `apps/web` |
| Nada de gravação entrou | atendido | Só `POST .../nfe/preview` (`service.ts:14-17`), operação de leitura; sem `import()` |

## Apontamentos

_Nenhum bloqueante._

## Sugestões

1. **Teste de CA1 não afirma quantidade nem valor unitário individualmente** — `nfe-import-dialog.component.spec.ts:122-128`. O template renderiza os dois campos (`html:110-111,118-119`), mas o teste só verifica descrição, unidade e os totais; se o binding de `quantity` ou `unitPrice` quebrasse, o teste continuaria verde. Sugiro afirmar `2 saco` e `25,00`/`80,00` explicitamente.
2. **404 (obra alheia/excluída) cai no estado genérico de rede** — `component.ts:159-180`. Hoje um 404 vira `failure` com "Verifique a conexão e tente novamente", o que é enganoso para obra removida/estrangeira; vale tratamento próprio quando a Tarefa 9 mexer no serviço.
3. **`nfe-import-entry.spec.ts` não cobre o estado sem obra ativa** — o botão é desabilitado sem obra (`accounts-page.component.ts:34`), mas nenhum teste afirma isso, embora CA1 fale em "obra ativa".

## Execução do orquestrador

O orquestrador rodou as três suítes novas em ChromeHeadless: **17 SUCCESS, 0 falhas**. A suíte completa tem 28 falhas, todas em `payment-modal.component.spec.ts`, que falham também isoladamente e não referenciam `accounts-page` nem `nfe` — defeito pré-existente.
