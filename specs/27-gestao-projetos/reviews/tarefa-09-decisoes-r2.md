# Decisões da Triagem — Tarefa 9 — Rodada 2

Pareceres: `tarefa-09-conformidade-r2.md` (**APROVADO**) e `tarefa-09-codigo-r2.md` (**APROVADO COM RESSALVAS**, sem bloqueadores).

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | A guarda da Navbar não invalida um `GET` em voo quando há criação/edição local (`onProjectSaved`) | código | **aceito como dívida** | Exige que o `GET` sobreviva ao preenchimento do formulário; a guarda cobre o cenário enumerado na r1 (construtor/aberturas anteriores). Candidato a Issue de manutenção (`++loadRequestId` no save). |
| 2 | A obra excluída continua ativa na tela até o `GET` de refresh responder | código | **aceito como dívida** | Janela limitada ao round-trip; o estado final é correto e o CA4/CA8 não são violados nos fluxos testados. Candidato a Issue (initialize otimista ou sinal `deleting`). |
| 3 | A subscription do refresh não está vinculada ao ciclo de vida do componente | código | **aceito como dívida** | Segue o padrão existente do repositório (sem `takeUntilDestroyed` em nenhum lugar); não destoa e o dano é restrito ao mesmo vetor do item 1. |
| 4 | O ramo `error` da guarda da Navbar não tem teste | código | **aceito como dívida** | O código é simétrico ao `next`; a lacuna é de prova, não de comportamento. Candidato a teste na mesma Issue de manutenção. |

## Fechamento

A Tarefa 9 encerra na rodada 2, conforme o limite de duas rodadas de revisão. Os itens acima são de severidade **Baixa**, não bloqueiam o aceite e ficam registrados como dívida aceita. A suíte frontend foi executada no estado final pelo orquestrador: **100/100 SUCCESS**; build OK (warning de budget pré-existente).

Itens de dívida acumulados para eventual Issue de manutenção: os quatro acima, mais a dívida de segurança do T6C (sem número de Issue registrado) e a divergência `docs/architecture.md:42` (`features/projects/` inexistente).
