# Parecer de Código — Tarefa 5

**Veredito:** APONTAMENTOS

## Apontamentos

1. **Teste frontend deixa requisição HTTP pendente**
   - Arquivo: `apps/web/src/app/features/reports/reports-page.component.spec.ts:52-54`
   - Severidade: Medium — bloqueante para a suíte.
   - O teste de formatação chama `money()` sem consumir a requisição iniciada no `beforeEach`. O `afterEach` executa `http.verify()` e falha por haver uma requisição aberta.
   - Execução: 5 testes aprovados e 1 falho: `Expected no open requests, found 1: GET /obracerta/api/projects/project-a/reports`.

## Resultados

- API: aprovada — testes direcionados passaram.
- Web: falhou — 1 teste pendente conforme apontado.
- Não foi identificado outro problema de produção de alta confiança.
