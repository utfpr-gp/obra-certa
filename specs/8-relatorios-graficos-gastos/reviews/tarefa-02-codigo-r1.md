# Parecer de Código — Tarefa 2

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Uso incorreto de Signal no template** — `apps/web/src/app/features/reports/reports-page.component.html:18`  
   `@for (category of categories; ...)` deveria iterar `categories()`. Signals precisam ser lidos por invocação no template; isso pode impedir a compilação/teste do frontend.

2. **Cobertura TDD incompleta para o contrato planejado** — `specs/8-relatorios-graficos-gastos/plan.md:35-36`, testes em `apps/api/src/test/.../ReportServiceTest.java` e `ReportControllerTest.java`  
   Não há teste específico de repositório comprovando exclusão lógica/posse na query, nem teste frontend para resposta `401`. O teste de serviço apenas mocka os repositórios e não valida as queries ativas.

## Sugestões (não bloqueiam)

- Extrair o carregamento HTTP comum de `ReportsPageComponent` para evitar duplicação entre o `effect()` e `retry()` (`reports-page.component.ts:61-94`).
- Evitar converter valores reais para centavos no componente (`reports-page.component.ts:28,36`), já que o contrato HTTP já entrega valores monetários em reais.
- Alinhar a recarga ao identificador da obra, não à referência completa do objeto ativo, conforme `docs/architecture.md:5.1`.

## Observações fora do escopo deste diff

- Os comandos `git diff --cached ...` e de testes solicitados não puderam ser executados pela interface disponível; portanto, não há resultado de execução a registrar.
