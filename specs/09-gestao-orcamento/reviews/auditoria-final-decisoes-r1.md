# Decisões — Auditoria final, rodada 1

Em 26/10/2026, o autor solicitou “realize os ajustes”, aceitando os dois apontamentos de `auditoria-final-r1.md`. Execução exclusivamente local, conforme orientação anterior.

| # | Apontamento | Decisão | Encaminhamento |
| --- | --- | --- | --- |
| 1 | Expiração real do JWT não garante 401 e não aciona o logout do frontend (CA10). | Aceito | Configurar a resposta de autenticação e comprovar a cadeia real com teste integrado, preservando 403 para falta de permissão e as rotas públicas. |
| 2 | Premissas adiadas não possuem TODOs vinculados às Issues. | Aceito | Registrar os vínculos locais após confirmar com o autor os números de US03, US04 e US05. Não consultar o GitHub nem inventar números; o estado remoto permanece sem confirmação. |

Os pareceres originais permanecem inalterados. Estes ajustes não autorizam commit: a entrega será submetida a revisão e ao aceite final do autor.

O autor confirmou nesta conversa: US03 = Issue #5, US04 = Issue #6, US05 = Issue #7. Essa confirmação fornece os vínculos para os TODOs; o estado remoto das Issues não foi consultado.
