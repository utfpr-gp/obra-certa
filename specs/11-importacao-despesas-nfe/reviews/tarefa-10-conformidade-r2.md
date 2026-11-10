APROVADO

# Parecer de Conformidade — Tarefa 10 (rodada 2)

**Veredito:** APROVADO, sem bloqueantes.

Verificado por leitura: 404 do preview terminal (`ts:303-304`, `:321`, `:327-330`; `html:19-22`), bloco de upload oculto em `notFound` (`html:26`); teste do 401 com estado observado no momento do flush (logout espionado, `closedCount` 0, fase `preview`, `confirmError` nulo, sem reenvio), sensível ao `return` de `ts:199`; `aria-describedby` do Confirmar com `missingSummary()` (`html:268`); flag `nfeImportRefreshPending` consumida depois das guardas (`accounts-page:464-468`); avisos com `emerald`; backdrop inerte; Shift+Tab com container em dialog e payment-modal (`payment-modal.ts:102`); escopo proibido intacto (apenas `apps/web`).

Sugestões: rodar os specs antes do PR; grep exato por `onBackdrop`; remover asserção redundante no teste do 401.

Limitação: revisor sem shell. Testes verificados pelo orquestrador: 62 SUCCESS (dialog 42, entry 12, service 8); build OK.
