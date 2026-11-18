REPROVADO

# Auditoria final — Issue 11 (rodada 1)

Auditor: auditor-final, somente leitura. Base: 4cf5b4b. Shell do auditor negado; checagens de git feitas pelo orquestrador.

## Bloqueantes e resolução

- **B1** `docs/architecture.md`: índice único de nfe_key descrito como existente. Resolvido: texto trocado para trava por aplicação com `SELECT … FOR UPDATE`.
- **B2** `specs/README.md` sem a Issue 11. Resolvido: linha #11 adicionada.
- **B3** `docs/prd.md` US09 com digitação de chave e dígito verificador. Resolvido: critérios 1, 3 e 4 ajustados ao escopo somente XML; status atualizado.
- **B4** Cadastro manual renomeava fornecedor existente. Decisão do autor: renomear só na NF-e. Resolvido em TDD: `ExpenseReferenceResolver.findOrCreateSupplier(…, updateName)`; manual passa `false`, importação `true`. Teste novo `ExpenseServiceTest.manualCreateWithKnownCnpjReusesSupplierWithoutRenaming` (RED: "Nome Antigo" esperado). 22 testes verdes (NfeImportSupplierTest, ExpenseServiceTest, NfeImportControllerConfirmTest).
- **B5** `spec.md` alterado em dc1e799 após a aprovação em 6f18e2e. Decisão do autor: texto atual aprovado.

## Sugestões registradas
- S1: Tarefa 4A sem item de desvio explícito em plan.md.
- S2: CA11 sem teste HTTP de DELETE sobre linha importada.
- S3: paid_at em UTC pode aparecer um dia antes em pt-BR; conferir exibição.
- S4: premissas de "Assume que" sem TODO; documentar no PR.
- S5: expenses.paid das linhas 2..N com o mesmo valor do checkbox; mencionar na defesa.
- S6: CNPJ sem validação de 14 dígitos na importação.
- S7: tokens e alvos de 44px conferidos.

## Pendente para a reauditoria
Rodar a auditoria final r2 contra o diff completo com as correções.
