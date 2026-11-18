# Auditoria final — Issue #11, rodada 2

**NÃO PRONTO PARA PR.**

Parecer do subagente auditor-final sobre o diff completo de `develop` (`b8978bc`) até `b9fb7b6`, após o rebase, comparado à spec da Issue #11.

## Bloqueantes

1. A spec (linha 28) afirma que não há limite definido. A API impõe 10 MiB por arquivo e 11 MiB por requisição em `application.properties`. O proxy também limita a requisição a 11 MiB em `nginx.conf`.
2. CA8 parcialmente atendido. `NfeImportService.java:133` não compensa um PUT aceito pelo armazenamento quando a resposta falha. Se a gravação no banco falhar e a remoção compensatória falhar também, o serviço registra um aviso sem reconciliação persistente. Ambos podem deixar XML fiscal órfão. `NfeImportAtomicityTest` cobre o rollback com compensação bem-sucedida.
3. A arquitetura descreve a trava por obra, mas não registra os endpoints multipart de `NfeImportController.java:15`, a migração V11 e os tipos MIME do comprovante XML na primeira linha.

## Critérios e observações

- CA1–CA2: conferência e XML inválido cobertos por `NfeImportControllerPreviewTest` e pelo diálogo. Upload acima do limite segue a divergência descrita no primeiro bloqueante.
- CA3–CA5: proteção contra duplicidade, categoria por item, pagamento único e XML na primeira linha conferidos em `NfeKeyGuard`, `NfeImportControllerConfirmTest` e `NfeImportPaymentTest`.
- CA6–CA7: fornecedor pelo CNPJ e orçamento conferidos em `NfeImportSupplierTest` e `NfeImportBudgetTest`.
- CA9–CA11: autorização e obra ativa, concorrência e proteção contra exclusão conferidas. A exclusão tem cobertura em `ExpenseServiceDeleteNfeTest`, sem teste HTTP de DELETE.
- Os apontamentos da primeira rodada sobre trava e índice, índice de specs, escopo XML e renomeio restrito à importação foram conferidos. A aprovação da spec pelo autor está registrada na rodada 1.
- O PRD ainda usa “Extração híbrida” e duplica CA3 e CA5. O título da spec mantém “Chave ou XML”. Distinguir a decisão sobre notas canceladas de hipóteses futuras sem TODO ou issue.
- O ajuste de Shift+Tab no modal de pagamento e a cor do aviso de quitação pertencem ao fluxo da US08. Justificar a presença no diff ou separar.
