# Parecer de Código — Tarefa 1

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Respostas antigas ainda podem sobrescrever a consulta atual** — `apps/web/src/app/features/expenses/accounts-page.component.ts:75-111`  
   Regra violada: `docs/architecture.md:358-365`, especialmente o contexto de despesas, que exige ignorar respostas antigas inclusive no ciclo A → B → A.  
   Prejuízo concreto: a validação compara apenas o `projectId` atual. Após A → B → A, uma resposta atrasada da primeira consulta de A é aceita como atual. O mesmo ocorre com consultas concorrentes da paginação da mesma obra. Isso pode exibir dados obsoletos após troca de contexto.

## Sugestões (não bloqueiam)

- **Validação dos parâmetros HTTP incompleta** — `apps/api/src/main/java/com/obracerta/controller/ExpenseController.java:29-35`  
  `@Min`/`@Max` não têm `@Validated` no controller, e `ExpenseService.list` aceita `size <= 0`, podendo gerar erro interno em `PageRequest`. Validar explicitamente página e tamanho e retornar erro estruturado.
- **Resumo financeiro ausente do DTO de paginação** — `ExpensePageResponseDTO.java:5-12`  
  O contrato geral de `architecture.md:419-434` prevê `summary`. Como totalizadores pertencem a tarefa posterior, pode ser mantido fora desta tarefa, mas deve ser incorporado antes da entrega correspondente.
- **Testes não cobrem a regressão aceita de respostas obsoletas nem o N+1** — `accounts-page.component.spec.ts` e `ExpenseListingIntegrationTest.java`  
  Adicionar teste A → B → A com respostas atrasadas e, se possível, teste de consultas SQL/projeção para confirmar desempenho paginado.
- **Pipes genéricos em vez dos pipes compartilhados** — `accounts-page.component.ts:48-50`  
  A arquitetura prevê pipes visuais centralizados para data e moeda.

## Pontos verificados

- A consulta segue `Controller → Service → Repository → Mapper`.
- O acesso HTTP está centralizado em `ExpenseService`.
- `@EntityGraph` em `ExpenseRepository.java:15-24` carrega categoria, fornecedor e pagamento junto à página, corrigindo o N+1 aceito sem `fetch join` inadequado para paginação.
- Erros agora limpam a lista, exibem feedback e oferecem retry — `accounts-page.component.ts:91-111`.
- DTOs são records/interfaces tipados e não expõem entidades nem dados de comprovante.
- Testes de integração cobrem posse, exclusão lógica, paginação e despesa paga sem pagamento pendente.

Os comandos Maven/Angular solicitados não puderam ser executados neste ambiente.
