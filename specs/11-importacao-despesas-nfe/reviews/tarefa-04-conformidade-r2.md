REPROVADO

# Parecer de Conformidade — Tarefa 4 (rodada 2)

**Veredito:** APONTAMENTOS

**Ressalva de execução:** o `shell` foi negado nesta sessão (`permission.rejected`), então não rodei o `mvnw` nem o `git diff` diretamente. A análise foi feita sobre o diff que o despacho já trazia e sobre a spec e o plano lidos pelo `read`. As quatro classes de teste pedidas não rodaram, e pelo critério do revisor isso não conta como atendido. Peço nova rodada com shell liberado.

## Ajustes da rodada 2

| Ajuste | Situação | Onde |
| --- | --- | --- |
| (1) Linha não paga cria `PendingPayment` com vencimento = emissão | resolvido | `NfeImportService.java` (bloco `if (!paid)`, `dueDate(preview.issueDate())`) |
| (2) `ExpenseReferenceResolver` usado por `ExpenseService.create` e `NfeImportService` | resolvido | `ExpenseReferenceResolver.java`; `ExpenseService.java` (`references.findOrCreateSupplier`, `references.resolveBudget`); `NfeImportService.java` (`references`) |
| (3) Comentário do preview restaurado | resolvido | `NfeImportService.java`, linha `// Só leitura: nada é gravado...` aparece como contexto inalterado no diff |

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 — chave ativa bloqueia, informa e não grava | atendido (teste, não executado) | `NfeImportService.java` (`keyGuard.ensureNotRegistered` antes de qualquer `save`); `NfeImportControllerConfirmTest.java:~245` (`confirm409…`) |
| CA4 — item sem categoria impede gravação e lista os itens | atendido (teste, não executado) | `NfeImportService.java` (`withoutCategory` → `"Itens sem categoria: N"`); `NfeImportControllerConfirmTest.java` (`confirm400QuandoUmItemNaoTemCategoriaSemGravarNada`) |
| CA5 — uma linha por item, com categoria, `nfe_key`, data de emissão e fornecedor | atendido (teste, não executado) | `NfeImportService.java` (loop com `.purchaseDate(preview.issueDate()).nfeKey(...)`, `supplier`); `NfeImportControllerConfirmTest.java` (`confirm201GravaUmaLinhaPorItem…`) |
| CA5 — pagamento e comprovante | fora desta tarefa | Tarefa 5. Não há DTO de pagamento, não há `ReceiptStorage` no `confirm`, o XML não é gravado. O teste usa `verifyNoInteractions(storage)`. |
| CA9 — obra alheia → 404 sem gravar | atendido (teste, não executado) | `NfeImportService.java` (`findByIdAndUserIdAndDeletedAtIsNull` primeiro); `NfeImportControllerConfirmTest.java` (`confirm404ParaObraDeOutroProprietario`) |
| CA9 — obra inexistente ou excluída → 404 | não provado no `confirm` | ver apontamento 2 |
| Fluxo manual `ExpenseService.create` sem mudança de comportamento | atendido | `ExpenseService.java:~138–146`: a lógica de fornecedor (CNPJ null cria, CNPJ existente reutiliza) e a de orçamento (`findByProjectIdAndCategoryIdAndDeletedAtIsNull`) são idênticas às de antes, só movidas |
| Preview sem trava e sem escrita | atendido | `NfeImportService.preview` sem alteração; `ensureNotRegisteredWithoutLock` mantido |
| Tarefa 4 não invadiu a Tarefa 5 | atendido | sem DTO de pagamento, sem comprovante, sem XML gravado; `paid` fixo em `false` conforme decisão (2) do plano |

## Apontamentos

1. **Rota diverge do plano registrado** — `NfeImportController.java:~31` (`@PostMapping("/confirm")`)
   Critério violado: plan.md, Decisões técnicas, linha 8: "`POST /api/projects/{projectId}/nfe/imports` … retorna 201".
   Evidência: o código expõe `/nfe/confirm`. Os testes também usam `/nfe/confirm`. A divergência não está registrada no plano, e as Tarefas 6, 7 e 8 vão depender da rota. Ou o código volta para `/imports`, ou o plano é corrigido por decisão do autor.

2. **CA9 não provado para obra inexistente ou excluída no endpoint de confirmação** — `NfeImportControllerConfirmTest.java` (só há `confirm404ParaObraDeOutroProprietario`)
   Critério violado: spec, CA9: "obra alheia, inexistente ou excluída → 404".
   Evidência: o `confirm` usa `findByIdAndUserIdAndDeletedAtIsNull`, que cobre os três casos, mas o teste só exercita a obra alheia. Isso é gap de teste, não de código. O plano da Tarefa 4 não listava CA9 na cobertura, então não bloqueia esta tarefa. Ainda assim, vale cobrir antes da Tarefa 5.

3. **Testes não executados** — sem arquivo; ver ressalva acima.
   Critério: revisor, método passo 3 ("Teste que não roda não conta como critério atendido").

## Sugestões (não bloqueantes)

- `NfeImportService.java:~51` — `categories.findById(chosen.get(number))` recebe string bruta do cliente. Se o id da categoria for UUID tipado no Postgres e o cliente mandar algo que não seja UUID, a exceção de conversão pode virar 500 em vez de 400. Vale confirmar o tipo da coluna e cobrir com um teste de id malformado.
- `NfeImportControllerConfirmTest.java` — o teste `confirm201LinhaNaoPagaCriaPendingPaymentComVencimentoNaEmissao` e o de par coerente se sobrepõem em boa parte. Não é problema, só redundância.
