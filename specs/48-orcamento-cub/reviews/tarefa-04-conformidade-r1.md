# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO, com uma condição: não consegui rodar os testes. O comando `shell` foi negado (`Permission denied`), então a verificação abaixo é por leitura do diff e dos arquivos. Antes de fechar a tarefa, rode `npx ng test --watch=false --browsers=ChromeHeadless` em `apps/web` e `.\mvnw.cmd test` em `apps/api`.

## Critérios verificados

| Critério (da spec / plano) | Situação | Onde |
| --- | --- | --- |
| CA2: tabela inicial do PRD para os oito projetos e todos os acabamentos | atendido. A tabela é a mesma (25, 14, 8, 9, 10, 10, 24, 0, 0; soma 100) e não depende de projeto nem de acabamento. O `resetAllocation` roda em toda mudança de seleção e de acabamento. | `apps/web/.../sinapi-allocation.ts:9-19`; `sinapi-form.component.ts:149-152`; `sinapi-form.component.html:36`; `sinapi-form.component.spec.ts` (loop dos oito projetos) |
| CA2: ajuste editável e parcela visível por categoria | atendido | `sinapi-form.component.html:97-103` |
| CA2: percentuais não negativos | atendido. Bloqueio com mensagem `negative`. | `sinapi-allocation.ts:parsePercent`; `sinapi-form.component.ts:101-104`; `...spec.ts` ("blocks the rateio with a negative percentage") |
| CA2: soma exatamente 100% | atendido. Soma em centésimos inteiros, sem float. Diferente de 100 bloqueia com `sum`, e a correção libera o bloqueio. | `sinapi-allocation.ts:parsePercent, allocateCents`; `sinapi-form.component.ts:100-104`; `sinapi-form.component.html:77-82`; `...spec.ts` ("blocks ... and releases it when corrected") |
| CA2: parcelas em centavos somam exatamente a estimativa | atendido. `allocateCents` distribui o resto pelas maiores frações. Testes cobrem 0..250 centavos para quatro conjuntos de percentuais. | `sinapi-allocation.ts:allocateCents`; `sinapi-allocation.spec.ts` ("keeps the sum..."); `SinapiAllocationCalculator.java:allocate`; `SinapiAllocationCalculatorTest.java:keepsTheSumOfTheParcelsEqualToTheTotalInEveryCase` |
| Desempate pela ordem do PRD (plano, tarefa 4) | atendido no front. Antes de alocar, o código ordena por `prdOrder`. O teste usa uma ordem de categorias que contradiz o PRD, então o teste discrimina. No Java, o desempate segue a posição da lista, que o chamador deve fornecer na ordem do PRD. Isso fica para a tarefa 5. | `sinapi-form.component.ts:108`; `sinapi-allocation.ts:prdOrder`; `...spec.ts` ("breaks equal fractions by the PRD order"); `SinapiAllocationCalculatorTest.java:splitsTenCentavosAt25_25_50...` |
| Conservação dos centavos e arredondamento HALF_UP da estimativa | atendido. Os valores de 0,05 × 0,5 e 1,01 × 1,01 foram conferidos à mão e batem. | `sinapi-allocation.ts:estimateCents, shareCents`; `SinapiAllocationCalculator.java:estimate` |
| Paridade front/back nos casos de centavos | atendido, com ressalva de cobertura (ver sugestões) | `SinapiAllocationCalculatorTest.java` e `sinapi-allocation.spec.ts` têm os mesmos casos 33/33/34, 25/25/50, 33.33/33.33/33.34 |
| CA6: cancelar emite evento e não faz HTTP | atendido. `Cancelar` emite `cancelled` e o `callsBefore` prova ausência de nova chamada. | `sinapi-form.component.html:113-114`; `...spec.ts` ("discards the edited rateio when cancelled") |
| CA6: reabrir volta à tabela do PRD | atendido, mas com teste fraco (ver sugestões) | `...spec.ts` (final de "discards...") |
| Escopo: sem endpoint, sem confirmação, sem gravação | atendido. Não há mudança em `BudgetService`, controller, repositório nem botão de confirmar. A classe Java não tem endpoint. | diff inteiro |
| Nomes do glossário | atendido. Os termos "rateio", "parcela", "estimativa" e "teto" seguem o PRD. | `sinapi-form.component.html` |

## Apontamentos (bloqueiam)

Nenhum.

## Sugestões (não bloqueiam)

1. **O teste de cancelar não prova o descarte.** O componente só emite `cancelled`. O "descarte" é a parent destruir o componente, e o teste de reabertura usa `mount()`, que cria uma nova instância. O que ele prova é que uma instância nova começa com os valores do PRD. Sugestão: um teste em `budget-form-modal.component.spec.ts` que feche o modal (Cancelar e também o X, se houver) e reabra, verificando que `app-sinapi-form` sai do DOM e que a nova instância começa com 14% em Alvenaria. Isso fecha o CA6 de verdade.
2. **Paridade Java.** Não há teste Java equivalente a `roundsTheTotalHalfUp` com o total 0,025 que está no TS via estimativa. O Java tem o caso em `roundsTheTotalHalfUpBeforeSplittingIt`, então a cobertura já existe. Só vale registrar que o desempate do Java depende da ordem da lista, e a tarefa 5 precisa garantir essa ordem.
3. **Mensagem para notação exponencial.** `parsePercent(1e-7)` cai em `precision`, e a mensagem diz "use no máximo duas casas decimais". É um caso que não aparece na prática; não precisa de ação agora.

## Observações fora do escopo

- A mudança de seleção (projeto, UF, mês) e a troca de acabamento zeram a edição manual do rateio. Isso segue o CA7 e a regra da tabela inicial, mas significa que o proprietário perde ajustes feitos se trocar qualquer campo. Vale confirmar que é o comportamento desejado.
- O bloco "Soma dos percentuais: N%" e o `data-testid` no botão Cancelar são acréscimos pequenos de apoio à conferência. Não são escopo inflado, mas a spec não os pede explicitamente.
