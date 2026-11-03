# Parecer de Código — Tarefa 4

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Falha conhecida do gerador escapa do contrato padronizado de erro** — `apps/api/src/main/java/com/obracerta/service/ReportPdfService.java:56`
   
   Regra violada: `architecture.md` §5.2.3 exige resposta estruturada pelo `@RestControllerAdvice` e status 500 para erro interno.
   
   O gerador converte `IOException` em `UncheckedIOException`, inclusive quando encontra caractere sem glyph, mas `GlobalExceptionHandler` não trata essa exceção nem possui handler genérico.
   
   Prejuízo concreto: uma entrada aceita e persistida pode impedir a exportação e produzir resposta fora do `ApiErrorResponse`. Além disso, a configuração atual não libera o despacho `ERROR`; pela leitura da cadeia de segurança, existe risco de a falha chegar como 401 e acionar logout, em vez de permanecer como erro de geração. Esse status final não foi confirmado por HTTP nesta revisão.
   
   O apontamento restringe-se ao novo caminho de falha da exportação; não exige corrigir genericamente todas as exceções preexistentes.

## Sugestões (não bloqueiam)

- Usar `data-testid` no botão de exportação e nos testes novos, conforme §9.1. Atualmente os cenários dependem de `.export`, por exemplo em `reports-page.component.spec.ts:92`; renomear uma classe visual quebraria testes sem alterar o comportamento.
- Melhorar a composição de páginas em `ReportPdfService.java:101`: quebrar preferencialmente entre palavras e manter descrição com seus metadados quando houver espaço na página seguinte. A paginação atual pode separar uma despesa entre páginas. Trata-se de legibilidade; não identifiquei perda de conteúdo.
- `bold = normal` em `ReportPdfService.java:87` não oferece diferenciação real de peso. Uma fonte em negrito pode melhorar a hierarquia visual.

## Observações fora do escopo deste diff

- As alterações preexistentes em `docs/architecture.md`, `docs/prd.md` e na auditoria da Issue 9 foram excluídas do julgamento, conforme despacho.
- Não executei runners, conforme orientação. A revisão foi somente leitura; nenhum arquivo foi alterado ou salvo.
