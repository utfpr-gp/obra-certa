# Parecer de Conformidade — Tarefa 4 (rodada 2)

**Veredito:** APROVADO

Os dois apontamentos da rodada 1 foram resolvidos. Não encontrei critério da tarefa 4 descumprido nem escopo inflado. Não consegui rodar os testes: o `shell` foi negado nesta sessão (`permission.rejected`), então a verificação é por leitura do diff, do código e dos testes.

## Critérios verificados

| Critério (da spec / plano) | Situação | Onde |
| --- | --- | --- |
| CA6: fechar pelo Cancelar descarta a prévia e os ajustes | atendido. O teste clica em `sinapi-cancel`, o que emite `cancelled` e chama `close()` no modal, que zera `sinapiOpen`. | `budget-form-modal.component.spec.ts:273`; `budget-form-modal.component.ts:199-203` |
| CA6: o componente sai do DOM ao fechar | atendido. O teste afirma `sinapiInstance()` nulo. Pelo `@if (showBudgetTabs() && sinapiOpen())`, a instância some. | `budget-form-modal.component.spec.ts:275`; `budget-form-modal.component.html:47-49` |
| CA6: reabertura começa do PRD, sem ajustes anteriores | atendido. Após reabrir, a instância existe, `sinapi-area` está vazio e, após preencher, Alvenaria marca 14. | `budget-form-modal.component.spec.ts:278-283` |
| CA6: nada gravado ao cancelar | atendido. `setBudget` não é chamado. | `budget-form-modal.component.spec.ts:284` |
| CA2: estado sem prévia mostra mensagem, sem prévia nem linhas de percentual | atendido. A mensagem usa `role="alert"` e é exibida quando `estimateInvalid()` é verdadeiro. A prévia só existe quando `preview()` não é nulo, e as linhas de percentual ficam dentro dela. | `sinapi-form.component.html:60-62`, `:64`; `sinapi-form.component.ts:84-103`; `sinapi-form.component.spec.ts:220-232` |
| CA2: tabela inicial do PRD para os oito projetos e todos os acabamentos | atendido. Os valores batem com a tabela do PRD (25, 14, 8, 9, 10, 10, 24, 0, 0; soma 100). A tabela não depende de projeto nem acabamento, e `resetAllocation` roda em mudança de seleção e de acabamento. | `sinapi-allocation.ts:11-21`; `sinapi-form.component.html:36`; `sinapi-form.component.spec.ts:77-89`; `prd.md:574-584` |
| CA2: percentuais não negativos, soma exata de 100% e parcelas que somam a estimativa | atendido, sem mudança nesta rodada. | `sinapi-allocation.ts:41-49`, `:75-100`; `sinapi-form.component.spec.ts:91-200` |
| Escopo da tarefa 4: sem endpoint, sem confirmação, sem gravação | atendido. O diff não toca `BudgetService`, controller, repositório nem botão de confirmar. | diff inteiro (4 arquivos) |

## Verificação dos itens pedidos

1. **Descarte ao cancelar.** Resolvido. O teste novo fecha pelo Cancelar, afirma a saída do DOM e que a reabertura começa do PRD. O teste antigo em `sinapi-form.component.spec.ts` ficou só com a emissão de `cancelled` e a ausência de nova chamada HTTP, que é o que ele de fato prova.
2. **Prévia sem mensagem.** Resolvido. Com área `0.0000001`, `estimateCents` devolve nulo, a prévia não aparece e a mensagem `role="alert"` aparece no lugar. O teste afirma nulos para `sinapi-preview` e `sinapi-percent-cat-alvenaria`, além do texto exato.
3. **O que o RED provava.**
   - Teste de estimativa inválida: RED real. No estado anterior o componente não tinha `sinapi-estimate-error` nem mensagem, então `expect(error).not.toBeNull()` falharia.
   - Teste de cancelar no modal: não tem RED demonstrável. O `close()` do modal, a remoção do `@if` e o botão Cancelar já existiam no HEAD. O teste fixa comportamento existente, o que atende o CA6, mas não passaria a falhar com o código atual. Ver sugestão 1.
   - Teste "emits cancelled once": renomeado e reduzido. Não tem RED próprio, e não é necessário.
   - Não há registro de RED na pasta `reviews/` nem no plano.
4. **Escopo.** Nada fora da tarefa 4 mudou no diff. O alerta de estimativa é acréscimo de UI com texto que a spec não traz. Foi pedido pelo apontamento R1 #2, então não reprova. Ver observação 1.
5. **Percentuais do PRD.** Conferem com a tabela de `prd.md:574-584`, nas nove categorias, com soma 100.

## Apontamentos (bloqueiam)

Nenhum.

## Sugestões (não bloqueiam)

1. **RED do teste de cancelar no modal.** `budget-form-modal.component.spec.ts:247-285` fixa comportamento que já existia. Para registrar a intenção TDD, vale anotar no próximo registro que ele é de caracterização. Em alternativa, o teste poderia cobrir também o X (`budget-form-close`) e o Escape, que o CA6 cobre de forma parecida ao Cancelar. Hoje só o Cancelar é testado.
2. **Fechar com `isOpen` falso.** O teste do modal não define `isOpen` como falso ao fechar. O pai normalmente faz isso pelo evento `closed`. O teste prova a saída do sinapi, mas não o fechamento do diálogo. Não é exigido pela tarefa.

## Observações fora do escopo

1. **Texto de erro novo.** "Não foi possível calcular a estimativa com estes valores. Revise a área informada." (`sinapi-form.component.html:61`) não consta na spec nem no glossário. Vale o autor confirmar o texto com o PRD ou aceitá-lo como copy de apoio.
2. **Testes não executados.** Não foi possível rodar `npx ng test` nesta sessão, porque o `shell` foi negado. A rodada 1 também não rodou. Antes do PR, convém rodar `npx ng test --watch=false --browsers=ChromeHeadless` em `apps/web` e registrar o resultado.
