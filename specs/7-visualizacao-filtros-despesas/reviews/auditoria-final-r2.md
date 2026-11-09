# Auditoria Final r2 — Issue #7

**Veredito:** NÃO PRONTO para PR, na data desta auditoria. Os bloqueios documentais foram corrigidos após o parecer (ver "Ajustes posteriores"); a reconferência (r3) é necessária antes do PR.

**Recorte:** `git diff origin/develop...HEAD`, branch `feature/7-visualizacao-filtros-despesas`, HEAD `fcc3375`. 104 arquivos. A régua foi a spec original aprovada.

## Integração da dependência US04

Resolvida. `origin/develop` (`c34af74`, merge do PR #36) é ancestral de `HEAD`. Nenhum arquivo da US04 aparece no diff contra `develop`.

## Validação

- Frontend (`npm test -- --watch=false --browsers=ChromeHeadless`): 396 de 396 aprovados.
- API (`./mvnw clean test`, perfil `test`, PostgreSQL 16 em banco novo, como na CI): 316 de 316 aprovados, `BUILD SUCCESS`.
- Observação de ambiente: a primeira execução contra o banco `obracerta_test` do container local encontrou dados residuais (21 linhas) e falhou em 9 testes de contagem. Os testes foram refeitos em banco novo (`obracerta_audit_r2`), sem falhas.

## Critérios de aceite

CA1 a CA11 atendidos, conforme a tabela da análise de código (`ExpenseService`, `ExpenseRepository`, `accounts-page.component.ts` e suítes `Expense*ListingIntegrationTest`). Não houve reteste visual de desktop e mobile.

## Bloqueios (registrados na r2)

1. `reviews/correcao-upload-http-validacao.md` citava `app.config.server.ts` e cinco testes. O arquivo não existe na branch (SSR removido por `0cf5dfa`) e o spec tem três testes.
2. `specs/README.md` e `docs/prd.md` traziam números antigos (395/306 e 390) e status de integração defasado.

## Ajustes posteriores ao parecer

- `correcao-upload-http-validacao.md`: corrigido o texto sobre `app.config.server.ts` e o número de testes; os números históricos foram mantidos, com nota de reconferência.
- `specs/README.md`: linha da US05 atualizada com 396/316, link para esta auditoria e status de integração.
- `docs/prd.md`: linha da US05 atualizada com 396/316 e status de auditoria.

## Pontos não bloqueantes

1. "Marcar como Pago" desabilitado (`accounts-page.component.ts`): decisão explícita do autor, mas a spec o exclui. Registrar a exceção no PR.
2. Atalho "Ver despesas desta categoria" em `budget-form-modal.component.html` e `budgets-page.component.html` com tooltip "Disponível após… (US05)" e `TODO #7`. A tela de despesas já existe; atualizar o texto e o TODO.
3. Filtro de data inválido exibe "Nenhum resultado encontrado" (`accounts-page.component.ts`). A mensagem pode confundir.
4. Entrada "Fornecedores" na sidebar aponta para `/fornecedores`, que não tem rota. Já vinha de `develop`; fora do diff da US05.

## Não versionar

Arquivos não rastreados fora do escopo: `apps/web/tarefa6-audit.json`, `.codex/`, `specs/8-relatorios-graficos-gastos/` e `.agents/skills/source-command-utf-*`.
