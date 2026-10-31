# Parecer de Código — Tarefa 6

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum.

O diff mantém a divisão de responsabilidades do `docs/architecture.md`, §5.2: a regra RN02 fica no `BudgetService`, a exceção representa o conflito de negócio e o `GlobalExceptionHandler` traduz a falha para 409 no formato `ApiErrorResponse`.

A comparação usa `BigDecimal.compareTo`, aceita igualdade com escalas decimais diferentes e ocorre antes de alterar ou persistir o orçamento. O gasto consultado é reutilizado no DTO, evitando uma segunda consulta para montar a resposta. A consulta existente filtra despesas ativas da obra.

No frontend, o tratamento permanece no componente de formulário e a comunicação HTTP continua passando pelo serviço. O novo estado usa signal; a apresentação usa `@if`. A resposta 409 produz feedback visível, preserva os campos e reabilita o envio. Não há segredo, URL de ambiente fixa ou abstração adicional sem necessidade.

Os testes verificam respostas HTTP, ausência de persistência no bloqueio e comportamento visível do formulário. O teste da página exercita o atalho no contexto real de abertura e submissão do modal.

**Validação executada nesta revisão:** `.\mvnw.cmd test`, em `apps/api`, com perfil `test` e PostgreSQL local: **70 testes, zero falhas, zero erros e zero ignorados**. A execução restrita falhou por acesso ao banco/logs; a reexecução com permissão ampliada terminou com `BUILD SUCCESS`. Frontend e build não foram reexecutados por este revisor; a execução frontend foi atribuída ao revisor de conformidade.

## Sugestões (não bloqueiam)

Nenhuma.

## Observações fora do escopo deste diff

- A pendência de categoria inexistente em `zeroBudget` permanece na Tarefa 10, conforme decisão registrada pelo autor.
- Permanecem divergências anteriores entre a documentação de arquitetura e o projeto: versões da stack, executor de testes frontend e restrição `CHECK > 0` descrita para orçamento. Este diff não altera essas decisões.
