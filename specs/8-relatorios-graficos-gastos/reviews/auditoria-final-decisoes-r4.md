# Decisões — Auditoria final da US06, rodada 4

Parecer original: `auditoria-final-r4.md`. Commits de referência: `092d80c` (parecer) e `3761cc3` (correção do CA5).

| # | Apontamento | Decisão | Encaminhamento |
| --- | --- | --- | --- |
| 1 | Testes do HEAD sem comprovação; suíte web de 442 sem log. | Aceito. | `apps/api` não mudou desde `df41c48` (`git diff --stat df41c48 HEAD -- apps/api` vazio), então a suíte de 348 testes continua válida para o código atual. Frontend reexecutado em `3761cc3`: 443 de 443, com build OK. Números atualizados em `specs/README.md`. |
| 2 | TDD das correções de PDF (`f3ece2e` e `76f518f`) sem teste novo. | **Aguarda decisão do autor.** | Os commits `8aafd28`, `f3ece2e` e `76f518f` alteram `report-visual-export.service.spec.ts`. O teste de cada correção falhou antes da mudança (RED) na sessão de implementação, mas esse RED não ficou registrado no repositório. Opções: (a) aceitar com este registro; (b) registrar a exceção do TDD para ajustes de layout validados visualmente. |
| 3 | Atribuição contraditória da validação visual. | Aceito. | `validacao-visual-ca11.md` separa quem gerou e quem inspecionou o PDF. |
| 4 | CA5: PDF de obra não localizada mostrava mensagem genérica. | Aceito. | Corrigido em `3761cc3`, com teste escrito antes da correção (RED confirmado). |
| 5 | `TODO #8` removido sem decisão registrada; `reports-demo.data.ts` sem importador. | Decisão do autor já registrada na conversa: remover o TODO. | O arquivo `reports-demo.data.ts` permanece. A remoção do arquivo fica pendente de nova instrução do autor. |
| 6 | Documentação desatualizada. | Aceito. | `docs/architecture.md` agora diz V1-V10. `specs/README.md` com 443 testes frontend. |
| 7 | Status `🟢 Live` com "auditoria final pendente" em `docs/prd.md:271-272`. | **Aguarda decisão do autor.** | US05 usa o mesmo padrão. Manter o padrão ou ajustar a linha. |

Sugestões não bloqueantes (fallback de nome do PDF, effect que limpa o período ao reeditar a obra, `application-test.properties` duplicado) ficam registradas no parecer e não entraram nesta rodada.
