# Parecer de Código — Tarefa 4 (rodada 1)

**Veredito:** APONTAMENTOS

Não rodei os testes: o shell está bloqueado para mim. A análise é de leitura do diff, do plano, do `architecture.md` e do `prd.md`.

## Apontamentos (bloqueiam)

1. **Teste de descarte ao cancelar não prova o que diz.** `apps/web/src/app/features/budgets-page/components/sinapi-form/sinapi-form.component.spec.ts:202-222`
   - Regra violada: `.agents/rules/utf-rules.md` §4 ("teste deve provar o que diz") e o plano, tarefa 4 ("cancelamento e reabertura").
   - Evidência: o teste se chama "discards the edited rateio when cancelled…", mas só verifica que `cancelled` foi emitido e que o serviço não foi chamado de novo. A "reabertura" usa `mount()`, que cria uma instância nova. Nenhuma asserção mostra que a instância antiga é destruída ou que os percentuais editados somem do estado. O descarte real depende de `budget-form-modal.component.html` (`@if (showBudgetTabs() && sinapiOpen())`), e a spec do modal (`budget-form-modal.component.spec.ts:236-243`) só confere área e prévia, não os percentuais.
   - Prejuízo concreto: se alguém trocar o `@if` por `[hidden]`, o rateio editado sobrevive ao fechar e esta suíte continua verde.
   - Correção sugerida (fica com o implementador): no próprio spec, afirmar que o componente é destruído ao sair do `@if`, ou que o rateio volta à tabela do PRD depois de reexibido, sem trocar a fixture. Renomear o teste se ele continuar só cobrindo a reabertura.

2. **Prévia some sem mensagem quando a estimativa não tem forma decimal simples.** `sinapi-form.component.ts:90-91`
   - Regra violada: `architecture.md` §5.1 e §5.1.5, "tratamento de erro que engole a falha silenciosamente" (`revisor-codigo.md`, "O que reprova").
   - Evidência: `if (estimate === null) return null;` esconde a seção inteira sem `allocationError` nem aviso. `estimateCents(1e-7, 1)` devolve `null` (`sinapi-allocation.spec.ts:54-55`), e área digitada como `0.0000001` chega aqui.
   - Prejuízo concreto: o usuário digita área pequena, a prévia desaparece e nada indica o motivo.
   - Correção sugerida: tratar o `null` como erro explícito de entrada, com mensagem na tela, ou cobrir o caso no template.

## Sugestões (não bloqueiam)

- **Limite de inteiros seguros no front.** `sinapi-allocation.ts`, `allocateCents` (`products = hundredths.map(v => totalCents * v)`) e `shareCents`. A partir de ~R$ 9 bilhões, `totalCents * 10000` passa de 2^53 e a aritmética perde exatidão sem aviso. `estimateCents` devolve `Number(...)` sem `Number.isSafeInteger`; um valor grande cai no `RangeError` de `allocateCents` dentro do `computed` (`sinapi-form.component.ts:109`), e isso quebra o template. Sugestão: checar `Number.isSafeInteger` no produto e na estimativa, ou usar BigInt até o fim.
- **Parcelas na prévia inválida.** `sinapi-form.component.ts:113` usa `shareCents` por linha quando o rateio está inválido, então as parcelas podem não somar o total exibido. O PRD (linha 549) exige essa soma. O teste existente `budget-form-modal.component.spec.ts:222` fixa o valor `R$ 33.315,90` nesse estado. Se for mudar, mostrar `—` nas parcelas e atualizar esse teste.
- **Desempate fora da tabela não existe no back.** `SinapiAllocationCalculator.allocate` decide o desempate só pela posição na lista e não conhece a ordem do PRD. O front manda categorias fora da tabela para o fim (`prdOrder`). A paridade vale somente se quem chamar o back (tarefa 5) ordenar pela tabela antes. Vale registrar esse contrato na tarefa 5 e, se possível, testá-lo na confirmação.
- **Validação do custo unitário no back.** `SinapiAllocationCalculator.estimate` aceita custo negativo, enquanto o front rejeita (`plainDecimal` devolve `null` para negativo). A divergência ainda não é alcançável pela API, mas deve ser fechada na tarefa 5.
- **Estilo do teste Java.** `SinapiAllocationCalculatorTest.java` usa `new java.util.ArrayList<>()` totalmente qualificado em dois pontos. Preferir `import`.
- **Tipos de domínio nos records.** `Share` e `Parcel` estão aninhados no service. Quando forem para a API, devem ir para `model/dto/` (`architecture.md` §1 e §5.2.2).

## Verificações (sem apontamento)

1. **Distribuição de centavos.** Confere nos dois lados: piso da fração exata, resto nas maiores frações, empate pela posição. Categoria com parcela zero nunca recebe centavo, porque a soma das frações é igual ao resto (inteiro menor que a quantidade de frações positivas). Java: `SinapiAllocationCalculator.java:52-72`. TS: `sinapi-allocation.ts`, `allocateCents`.
2. **Floats no dinheiro.** Percentuais e totais ficam em inteiros (centésimos e centavos). A entrada passa por `String(value)`, sem divisão. A única divisão por 100 é a exibição (`formatCents`, `percentText`), que não entra em cálculo. Sobre o limite de inteiros seguros, ver a sugestão acima.
3. **`compareTo` no Java.** Ordenação de frações com `Comparator.comparing` (usa `compareTo`), `signum()` e `compareTo(FULL)`. Os testes usam `usingElementComparator(BigDecimal::compareTo)`.
4. **Estimativa.** Java: `multiply` seguido de `setScale(2, HALF_UP)`. TS: BigInt com `(2N + D) / (2D)`, que é o HALF_UP para valores não negativos. Casos 0,05 × 0,5 = 0,03 e 1,01 × 1,01 = 1,02 batem nos dois lados.
5. **Signals.** `preview` é `computed` com dependências em signals e `toSignal` de `valueChanges`. `allocation.controls` é lido sem ser reativo, mas o `effect` chama `updateValueAndValidity()`, que emite `valueChanges` e atualiza o `percentages`. `takeUntilDestroyed` e o `toSignal` cuidam da limpeza. Sem `*ngIf`/`*ngFor`, sem `HttpClient` no componente, sem construtor com injeção.
6. **Casos equivalentes.** Mesma entrada, mesma saída nos dois lados:
   - 10 centavos com 33/33/34 → 3, 3, 4 (front `sinapi-allocation.spec.ts` e componente; back `splitsTenCentavosAt33_33_34…`).
   - 10 centavos com 25/25/50 → 3, 2, 5 (front e back).
   - 102 centavos com 33,33/33,33/33,34 → 34, 34, 34 (front `allocateCents(102, …)`; back `givesLeftoverCentavosToTheLargestFractions`).
   - R$ 0,05 × 0,5 = 3 centavos, e R$ 0,01 × 0,4 = 0 (front e back).
   - Soma inválida, negativo e mais de duas casas: os dois lados rejeitam.
   - Mesma varredura de 0 a 250 centavos com os mesmos quatro conjuntos de percentuais.
7. **Tabela do PRD.** Idêntica no front (`PRD_RATEIO`, `PRD_ROWS` do spec do componente) e no back (`PRD_PERCENTAGES`): 25, 14, 8, 9, 10, 10, 24, 0, 0, totalizando 100. Os nomes de `PRD_RATEIO` batem com a seed `V7__seed_predefined_expense_categories.sql`, então `prdOrder` funciona contra o banco.

## Observações fora do escopo deste diff

- O cálculo da soma dos percentuais dentro de `sinapi-form.component.ts` passa por `percentages()` como `toSignal` de `valueChanges`. Se, no futuro, o formulário ganhar `setValue` com `emitEvent: false`, o `preview` deixa de atualizar sem aviso. Vale um teste de regressão quando a tarefa 5 mexer no fluxo de confirmação.
- A tabela do PRD está duplicada em três lugares: `sinapi-allocation.ts`, `sinapi-form.component.spec.ts` e `SinapiAllocationCalculatorTest.java`. Hoje é aceitável, mas uma mudança no PRD exige atualizar os três. Candidata a Issue de manutenção se o PRD mudar.
