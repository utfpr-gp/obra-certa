# Decisões — Auditoria final US05, rodada 1

| # | Apontamento | Decisão | Autorização do autor |
| --- | --- | --- | --- |
| 1 | O backend HTTP configurado com `withFetch()` não fornece os eventos usados no progresso de upload dos comprovantes. | aceito | “Realize o ajuste desses pontos”. |
| 2 | O diff da US05 contra `develop` inclui a dependência US04 ainda não integrada. | integração manual pelo autor | Após o aceite inicial, o autor esclareceu: “A US04 ainda vou dar merge manual. Não realize nenhum ajuste relacionada a ele”. |

Encaminhamento do item 1: correção de regressão com TDD, preservando autenticação, upload e renderização da aplicação, seguida de duas revisões independentes. Não é funcionalidade nova nem alteração dos critérios da spec aprovada.

Encaminhamento do item 2: a US04 e seu PR #36 permanecem sob controle exclusivo do autor para merge manual. Nenhum ajuste de código, CI, base de PR, histórico ou branch da US04 será feito pelo agente. A consulta somente leitura confirmou o PR aberto; não foram enviados comentários, mudanças ou merges. Após a integração manual, será necessário conferir novamente o diff da US05 contra a `develop` atual. Não foi autorizado PR conjunto.
