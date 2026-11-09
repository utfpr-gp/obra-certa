# Auditoria Final r6 — Issue #7

**Veredito:** PRONTO PARA PR, com as exceções listadas abaixo.

**Recorte:** HEAD `d26d2b5` mais as alterações não commitadas desta rodada (fuso, estado vazio, testes e documentação). Shell indisponível para o auditor; as verificações de git foram feitas pelo orquestrador.

## Verificações de git

- `origin/develop` (`c34af74`) é ancestral de `HEAD`: confirmado.
- `git diff --name-only origin/develop...HEAD` não contém sidebar nem arquivos da US04 (`expense-edit`, `ExpenseReceipt`, `V10__`).
- Arquivos não rastreados fora da US05 que não devem ir ao PR: `apps/web/tarefa6-audit.json`, `.codex/`, `specs/8-relatorios-graficos-gastos/`, `.agents/skills/source-command-utf-*/`.

## Validação

- Frontend (`npm test -- --watch=false --browsers=ChromeHeadless`): 398 de 398.
- Build de produção (`npm run build`): sem erro; aviso de bundle preexistente.
- API (`./mvnw clean test`, perfil `test`, PostgreSQL 16, banco `obracerta_audit_r2`): 318 de 318.

## Ajustes desta rodada

1. **Fuso `America/Sao_Paulo`:** `ClockConfiguration.BUSINESS_ZONE`; `ExpenseService` usa o mesmo fuso. `LocalDate.now(clock)` é o único uso de data calendário; `clock.instant()` não depende de fuso. Testes: `ClockConfigurationTest` e `referenceDateFollowsBusinessDayInSaoPauloNotUtcInLateEvening`.
2. **Estado vazio:** "Cadastrar" aparece só quando a obra não tem nenhuma despesa, sabido pela última consulta sem filtros na aba Todas. Aba filtrada com despesas mostra "Nenhum resultado encontrado". Bloco de vazio oculto enquanto o formulário de filtros estiver inválido. Testes: "offers registration in a filtered tab only when the project has no expenses at all" e "does not claim the project is empty when an invalid interval blocks the query".

## Critérios de aceite

CA1 a CA11 atendidos pela leitura do código atual. CA6 segue a decisão do autor sobre o cadastro. CA11 sem reteste visual.

## Exceções para registrar no PR

1. "Marcar como Pago" desabilitado: decisão do autor; a ação pertence à US08.
2. Tooltips "(US05)" e `TODO #7` nos atalhos de orçamento: dívida da Issue #9, porque o texto é contrato da spec 09.
3. Fuso `America/Sao_Paulo`: decisão do autor, opção B.
4. Sem reteste visual de desktop e mobile.

## Não bloqueantes (dívida conhecida)

- Se a primeira consulta sem filtros falhar, o estado de obra vazia fica indefinido, e um filtro numa obra realmente vazia mostra "Nenhum resultado" em vez de cadastro. Não exibe dado antigo nem informação falsa; decisão do autor se quer tratar agora.
- Faltam testes de reset de `projectHasExpenses` ao trocar de obra e de obra vazia com intervalo inválido.
- `DemoDataSeederService.java` (fora do diff da US05) tem o comentário `TODO #7` e a frase "sem listagem de despesas" defasados. Registrar como dívida da Issue #7 para ajuste em PR próprio ou junto com a US07.

## Próximos passos

1. Commit com mensagem da entrega.
2. Push de `feature/7-visualizacao-filtros-despesas`.
3. Abrir PR contra `develop`, com as exceções acima na descrição.
