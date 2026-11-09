# Auditoria Final r4 e r5 — Issue #7

**Veredito r4:** NÃO PRONTO. Bloqueio: `docs/prd.md` (US04, linha 170) e `specs/README.md` (US04, coluna PR) diziam que a integração do PR #36 estava pendente. Corrigido depois do parecer.

**Veredito r5:** NÃO PRONTO PARA PR, com os pontos abaixo. Os dois bloqueios foram tratados depois do parecer (ver "Ajustes posteriores").

## Ajustes posteriores ao parecer r5

- Ponto 1 (mensagem falsa após data inválida): o bloco de vazio não aparece mais enquanto o formulário de filtros estiver inválido (`accounts-page.component.ts`). Teste: "does not claim the project is empty when an invalid interval blocks the query".
- Ponto 2 (CA6): decisão do autor. "Cadastrar" aparece em qualquer aba somente quando a obra não tem nenhuma despesa, conhecido pela última consulta sem filtros. Quando há despesas e a aba ou filtro não traz resultado, a tela mostra "Nenhum resultado encontrado". Teste: "offers registration in a filtered tab only when the project has no expenses at all".
- Validação após os ajustes: frontend 398 de 398 (ChromeHeadless); build de produção sem erro; API 318 de 318 (sem mudança nesta etapa). O número 396 que aparece na validação acima é o da r5, anterior aos dois testes novos.

**Recorte:** HEAD `d26d2b5`, com alterações não commitadas desta rodada. Shell indisponível para o auditor; validação feita pelo orquestrador.

## Mudança de fuso (opção B)

- `ClockConfiguration.BUSINESS_ZONE = America/Sao_Paulo`; bean `clock()` usa `Clock.system(BUSINESS_ZONE)`.
- `ExpenseService` (construtor de seis argumentos) usa o mesmo fuso.
- `LocalDate.now(clock)` é o único uso de data calendário na listagem; `ProjectService` e os instantes de `deletedAt`/`paidAt` usam apenas `clock.instant()` e não mudam.
- Testes novos: `ClockConfigurationTest` (bean em `America/Sao_Paulo`) e `ExpenseSituationListingIntegrationTest.referenceDateFollowsBusinessDayInSaoPauloNotUtcInLateEvening` (instante 2026-11-10T01:30Z, referência 2026-11-09, vencimento 11-08 em Vencidas e 11-09 fora).

## Validação

- API: `./mvnw clean test`, perfil `test`, PostgreSQL 16, banco `obracerta_audit_r2`: 318 de 318, `BUILD SUCCESS`.
- Frontend: 396 de 396, sem mudança nesta rodada.

## Pontos abertos antes do PR

1. **Estado vazio após data inválida (recomendado corrigir).** `showInvalidFilters` zera a lista sem alterar `filters()`. Se nenhum filtro foi aplicado, `isEmptyProject()` vira verdadeiro e a tela mostra "Nenhuma despesa cadastrada" mesmo em obra com despesas. Não exibe dado antigo, mas é informação falsa. Sem teste.
2. **CA6, obra sem despesas com aba Pendentes ou Vencidas.** `isEmptyProject()` exige aba Todas sem filtros. Nessas abas, a tela mostra "Nenhum resultado encontrado" e não a orientação de cadastrar. Decisão do autor: aceitar a leitura atual ou adotar a leitura estrita da CA6.
3. **Registro de exceções no PR:** "Marcar como Pago" desabilitado (decisão do autor); TODO #7 nos atalhos de orçamento como dívida da Issue #9; fuso `America/Sao_Paulo`; sem reteste visual de desktop e mobile.
4. **Verificações de git pendentes:** `git merge-base --is-ancestor origin/develop HEAD` (confirmado antes, em `d26d2b5`) e `git diff --stat origin/develop...HEAD`, que não deve incluir sidebar nem arquivos da US04.

## Não bloqueantes

- Sidebar "Fornecedores" já vinha de `develop` e não está no diff da US05.
- Dívida da Issue #9: tooltips e TODOs nos atalhos de orçamento.
