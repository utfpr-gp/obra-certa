# Parecer de Conformidade — Tarefa 1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1–CA6 — comportamentos financeiros de produção | fora desta tarefa | `specs/8-relatorios-graficos-gastos/spec.md:30` |
| CA7 — tela demonstrativa com filtros, quatro indicadores, rosca, barras, resumo e detalhamento | atendido na inspeção; validação visual desktop/360px pendente | `apps/web/src/app/features/reports/reports-page.component.html:1`; `apps/web/src/app/features/reports/reports-page.component.css:63` |
| CA8 — massa única, cálculos consistentes, categoria excedida e arredondamento na apresentação | atendido | `apps/web/src/app/features/reports/reports-demo.data.ts:9`; `apps/web/src/app/features/reports/reports-page.component.ts:22` |
| CA9 — período fixo, atualização conjunta ao filtrar e aviso de PDF sem download | não atendido na comprovação por testes: teste do filtro falha | `apps/web/src/app/features/reports/reports-page.component.spec.ts:68` |
| CA10 — estado temporário descartado e cenário inicial restaurado | atendido | `apps/web/src/app/features/reports/reports-page.component.ts:17`; `apps/web/src/app/features/reports/reports-page.component.spec.ts:84` |
| Premissa — massa fictícia identificada com `TODO #8` | atendido | `apps/web/src/app/features/reports/reports-demo.data.ts:9` |

## Apontamentos

1. **O teste de atualização conjunta ao filtrar não passa** — `apps/web/src/app/features/reports/reports-page.component.spec.ts:72`  
   Critério violado: CA9 — “seleção de categoria atualiza as visualizações de forma consistente”.  
   Evidência: na execução fora do sandbox informada pelo orquestrador, passaram 6 dos 7 testes; este falhou porque esperava `-1.000,00`, enquanto a apresentação monetária retornou `-R$ 1.000,00`. A falha está na expectativa de formatação e não demonstra erro no saldo calculado. Contudo, interrompe o teste antes das verificações seguintes da rosca, barras, resumo e detalhamento, deixando incompleta a comprovação conjunta exigida pelo plano. O implementador confirmou que GREEN não foi alcançado.

Minha execução de testes no sandbox terminou com código 1 sem diagnóstico adicional; a tentativa escalada foi interrompida antes de fornecer resultado. O resultado detalhado acima vem da execução do orquestrador. O build concluiu com sucesso, também confirmado pelo orquestrador, com avisos de tamanho do bundle e CSS.

A validação visual em desktop e 360px permanece pendente: o navegador redirecionou para login sem sessão vigente. A inspeção confirma regras para coluna e cartões mobile, mas não comprova ausência de transbordamento em execução. Nenhum arquivo foi alterado.
