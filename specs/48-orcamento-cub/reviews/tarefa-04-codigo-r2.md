# Parecer de Código — Tarefa 4 (rodada 2)

**Veredito:** APROVADO

Os dois apontamentos da rodada 1 estão resolvidos. Não há violação de `architecture.md` no diff. Não consegui rodar a suíte nem a mutação: o shell me foi negado, então as conclusões sobre a mutação e a regressão vêm da leitura do código.

## Verificações

**1. Teste de descarte no modal (`budget-form-modal.component.spec.ts:247-286`).** Prova o que diz.
- Após `sinapi-cancel`, `app-sinapi-form` deve sumir do DOM (linha 276). A cadeia é: `cancelled` → `close()` (`budget-form-modal.component.ts:199-203`, que zera `sinapiOpen`) → `@if (showBudgetTabs() && sinapiOpen())` (`budget-form-modal.component.html:47`).
- Mutação `@if` → `[hidden]`: o componente fica montado, então `sinapiInstance()` não é nulo na linha 276 e o teste cai. Se a mutação for só zerar `sinapiOpen`, também cai, pelo mesmo motivo. Pela leitura, o teste derruba a mutação.
- Não há asserção vácua. A pré-condição de que o formulário e a prévia existiam antes do cancelamento está implícita: `fillSinapi()` usa `query(...)!` (TypeError se o campo não existir), e a linha 272 lê `sinapi-percent-cat-alvenaria` = `'50'`, que só existe dentro da prévia. Sugestão abaixo para tornar isso explícito.
- A reabertura (linhas 279-284) confere área `''` e alvenaria `'14'`, o que prova a reconstrução a partir da tabela do PRD.

**2. Estimativa inválida.**
- `0.0000001` vira `1e-7` no `NumberValueAccessor`. `String(1e-7)` = `"1e-7"`, que não casa com `PLAIN_DECIMAL`, então `estimateCents` devolve `null`. O teste (`sinapi-form.component.spec.ts:220-232`) verifica prévia nula, linhas de percentual nulas, `role="alert"` e o texto exato.
- A guarda `estimateInvalid` (`sinapi-form.component.ts:93-96`) só é `true` quando há `estimateInput` (referência carregada, área finita e positiva) e `estimateCents` falha. Área vazia, zero ou negativa não disparam o alerta, e o caso válido (`1.01`, `100`, `0.5`) não cai nele. Confirmado pelos testes existentes do modal (`area = '0'`, linha 199) e do `budgets-page` (`area = '100'`, linha 540).

**3. Renomeação de `sinapi-form.component.spec.ts:202`** para "emits cancelled once and does not consult SINAPI again". O nome bate com o corpo: `cancelled === 1` e a contagem de chamadas não muda. Não ficou enganoso. O descarte real agora é provado no modal.

**4. Signals.** `estimateInput`, `estimateInvalid` e `preview` são `computed` puros, sem escrita de estado. A única escrita de estado no fluxo continua no `subscribe` e nos handlers, como antes.

**5. Regressões.** Nenhum teste existente usa uma área que caia no novo ramo de erro. O único `estimateCents(1e-7, 1)` é o de `sinapi-allocation.spec.ts:55`, que testa a função isolada e não muda.

## Apontamentos (bloqueiam)

Nenhum.

## Sugestões (não bloqueiam)

- **Pré-condição explícita no teste de descarte** — `budget-form-modal.component.spec.ts:274`. Antes do `sinapi-cancel`, adicionar `expect(sinapiInstance()).not.toBeNull()` e `expect(query('sinapi-preview')).not.toBeNull()`. Hoje a prova depende do `query!` implícito. Torna o `toBeNull()` da linha 276 e 277 explicitamente significativo.
- **Magnitude fora de inteiro seguro ainda não é coberta pela guarda.** `sinapi-form.component.ts:95` só valida a forma decimal. `estimateCents` pode devolver um número não seguro (ex.: área `1e15` com custo `2221.06`). Então `estimateInvalid` fica `false`, e `allocateCents` lança `RangeError` dentro de `preview` (`sinapi-allocation.ts:76`). Para valores menores, mas acima de ~9×10⁹ reais, as multiplicações `totalCents * value` perdem precisão sem aviso. É o mesmo ponto da sugestão 1 da rodada 1, ainda aberto. Sugestão: fazer `estimateCents` devolver `null` quando `!Number.isSafeInteger(resultado)`, o que faz a magnitude cair na mesma guarda e na mesma mensagem.
- **Mensagem genérica.** `sinapi-form.component.html:61` diz "Revise a área informada". Se a falha vier do custo unitário, a orientação fica errada. Hoje o custo sempre tem forma decimal simples, então é cosmético.
- **Cálculo duplicado.** `estimateCents` é chamado duas vezes para a mesma entrada, em `estimateInvalid` (linha 95) e em `preview` (linha 102). Pode ser lido uma vez, por exemplo expondo o `estimate` a partir de `estimateInput`.

## Observações fora do escopo deste diff

- Desempate fora da tabela e validação de custo negativo no back: já registrados na rodada 1, para a tarefa 5.
- Tabela do PRD duplicada em três lugares (`sinapi-allocation.ts`, `sinapi-form.component.spec.ts`, `SinapiAllocationCalculatorTest.java`). Candidata a Issue de manutenção se o PRD mudar.
- Recomendo rodar `ng test` na suíte do `budgets-page` e fazer a mutação `@if` → `[hidden]` antes do PR, para confirmar a conclusão 1 por execução e não só por leitura.
