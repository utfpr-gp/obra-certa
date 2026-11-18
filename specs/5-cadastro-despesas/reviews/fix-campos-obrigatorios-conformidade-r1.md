# Parecer de Conformidade — Tarefa campos obrigatórios

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Pedido: asterisco vermelho junto ao nome dos campos obrigatórios | atendido: dez marcadores correspondem aos controles com `Validators.required` | expense-form.component.html:17 |
| CA1 e CA10: descrição, data, categoria e fornecedor | atendido: marcação acompanha fornecedor existente ou nome/CNPJ no cadastro inline | expense-form.component.html:22 |
| CA1 e CA10: obrigatoriedade conforme modo de valor | atendido: total no modo direto; quantidade e valor unitário no calculado | expense-form.component.html:82 |
| CA2 e CA9: vencimento obrigatório no pagamento pendente | atendido: marcador e `aria-required` aparecem no mesmo ramo condicional do campo | expense-form.component.html:106 |
| Preservar comportamento e acessibilidade | atendido: validadores e eventos preservados; marcadores decorativos com `aria-hidden` e controles com `aria-required="true"` | expense-form.component.html:18 |
| Não marcar controles sem obrigatoriedade de preenchimento | atendido: modo e pagamento mantêm opções predefinidas; comprovante permanece opcional | expense-form.component.html:76 |

Conferência independente do HTML contra os validadores de `expense-form.component.ts:47` e `:154`. Validação fornecida pelo agente principal: 57 testes aprovados e build com código 0; não reexecutados neste parecer.

## Apontamentos
