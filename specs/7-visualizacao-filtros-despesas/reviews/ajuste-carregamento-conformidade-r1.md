# Parecer de Conformidade — Tarefa ajuste-carregamento, rodada 1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA10 — Não apresentar números antigos como atuais; preservar contexto, erro e tentativa manual | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:325`; `accounts-context.spec.ts:145` |
| CA11 — Identificar seleção e carregamento em desktop e mobile | atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:31`; `accounts-page.component.spec.ts:329` |
| Ajuste autorizado — Manter cartões, controles e posição estáveis durante o GET | atendido no cenário geométrico coberto | `apps/web/src/app/features/expenses/accounts-page.component.ts:136`; `accounts-page.component.spec.ts:327` |
| Ajuste autorizado — Impedir aparência de recarga da página ao trocar abas, filtros, ordenação e página | não atendido | `apps/web/src/app/features/expenses/accounts-page.component.ts:137`; `accounts-page.component.ts:173` |
| CA9 — Preservar descarte de respostas antigas e isolamento do contexto | atendido no recorte: guards preservados | `apps/web/src/app/features/expenses/accounts-page.component.ts:328` |
| Mudanças de contrato, backend ou regras financeiras | fora desta tarefa; ausentes do diff isolado | `apps/api/target/ajuste-carregamento.diff` |

## Apontamentos

1. **Bloqueante — O ajuste preserva a geometria, mas ainda substitui todo o corpo dos resultados durante cada GET.** — `apps/web/src/app/features/expenses/accounts-page.component.ts:137` e `apps/web/src/app/features/expenses/accounts-page.component.ts:173`

   Critério violado: complemento expressamente autorizado ao CA11 (`spec.md:90`): “impedir que página inteira pareça recarregar; manter cartões/controles/posição estáveis durante GET esperado, sem exibir dados financeiros antigos como atuais”.

   Evidência: `@if (!loading() && !error() && expenses().length)` desmonta a tabela completa, incluindo cabeçalhos e estrutura visual, e os cards mobile. Durante a espera, resta uma área da mesma altura com duas barras centralizadas e o texto de carregamento. Simultaneamente, os três totalizadores trocam seus valores por placeholders. Portanto, manter a altura impede deslocamentos, mas não elimina a substituição visual ampla que pode produzir a piscada. O autor relatou que ela continua após recarregar e autenticar novamente; não houve reprodução visual independente nesta revisão.

   Os testes novos comprovam identidade dos containers, posição, altura, rolagem e limpeza financeira. Não comprovam continuidade visual da estrutura interna: inclusive exigem a ausência dos registros anteriores. A aprovação desses testes não resolve o comportamento perceptivo que motivou este ajuste. Para encerrar esse bloqueio, é necessário preservar uma estrutura de apresentação localizada durante a atualização, mantendo explícita a indisponibilidade dos dados antigos, e conferir o resultado na aplicação real.

**Sugestões, sem bloqueio adicional:** a verificação de rolagem poderia incluir o contêiner efetivamente usado pela aplicação. O teste mede `frame.contentWindow.scrollY`, enquanto `shared/layouts/main-layout/main-layout.component.html:30` utiliza um contêiner com `overflow-y-auto`. Também seria útil conferir visualmente a sequência Todas → Pendentes → Pagas, pois o novo teste de estabilidade exercita a transição para Pendentes.

Validação considerada: logs centralizados com RED de três falhas, GREEN de 40 sucessos, suíte completa de 388 sucessos e build concluído. Não repeti o ChromeHeadless, conforme o despacho. Escopo delimitado pelo diff isolado; layout anteriormente aprovado e documentos externos ao ciclo não foram tratados como alterações deste ajuste. Nenhum arquivo foi alterado.
