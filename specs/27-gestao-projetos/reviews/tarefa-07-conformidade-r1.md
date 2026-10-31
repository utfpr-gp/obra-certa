# Parecer de Conformidade — Tarefa 7 — Rodada 1

## Veredito

Apontamentos bloqueadores.

## Apontamentos

1. **[Alta]** A Home trata toda obra ativa como sem orçamento porque `emptyDashboard()` sempre retorna orçamento total zero; não há fonte real para distinguir obras com e sem orçamento.
2. **[Média]** O teste de onboarding apenas força `activeProject` para `null` e não prova que a lista de obras retornou vazia.
3. **[Média]** O backdrop do `ConfirmModal` chama `onCancel()`, mas a spec exige bloquear cliques externos acidentais.

