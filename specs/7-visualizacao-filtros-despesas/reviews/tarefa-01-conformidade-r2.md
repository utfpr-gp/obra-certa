# Parecer de Conformidade — Tarefa 1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Listagem real e paginação | não atendido | `accounts-page.component.ts:54-57`; `accounts-page.component.spec.ts:29-35` |
| CA8 — Isolamento e exclusão lógica | atendido | `ExpenseRepository.java:18-27`; `ExpenseListingIntegrationTest.java:92-136` |

## Apontamentos

1. **O teste frontend não comprova todos os campos exigidos pela CA1** — `apps/web/src/app/features/expenses/accounts-page.component.spec.ts:29-35`  
   Critério violado: CA1 exige descrição, categoria, fornecedor, data de compra, vencimento, valor e situação de pagamento.  
   Evidência: o teste verifica apenas descrição, categoria e fornecedor; não contém asserções para data de compra, vencimento, valor ou situação. A implementação renderiza esses campos em `accounts-page.component.ts:54-57`, mas eles não estão comprovados pelo teste solicitado.

Os testes backend cobrem paginação máxima, despesa paga sem `PendingPayment`, exclusão lógica, isolamento e ausência de dados de comprovante (`ExpenseListingIntegrationTest.java:55-136`). A consulta não acessa `ReceiptStorage` e mantém o link de consulta individual e “Cadastrar conta”.

Não foi possível executar os comandos Maven/Angular nesta sessão; o log disponível da suíte web registra uma suíte diferente com `1 FAILED` (`web-r2-green.log:53-72`).
