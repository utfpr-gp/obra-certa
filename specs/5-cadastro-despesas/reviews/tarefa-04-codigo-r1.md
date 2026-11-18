# Parecer de Código — Tarefa 4

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum. O diff respeita os padrões de signals, `inject()`, controle de fluxo moderno e comunicação HTTP pelos serviços (§5.1). Reutiliza o `BudgetState` calculado no servidor, sem duplicar cálculos financeiros (§5.2 e §6). A falha na consulta orçamentária recebe feedback próprio e preserva a despesa carregada.

Verificações independentes executadas:

- `npm.cmd run build`: aprovado, exit 0.
- `ExpenseServiceTest,ExpenseValidationContractTest`: 14 testes aprovados, sem falhas, erros ou testes ignorados.

Karma e a integração PostgreSQL alterada ficaram com o outro revisor, conforme o despacho.

## Sugestões (não bloqueiam)

Nenhuma.

## Observações fora do escopo deste diff

- O build apresenta o aviso já conhecido de bundle inicial: 595,69 kB para limite de 500 kB.
- Maven apresenta aviso sobre o escopo `annotationProcessor` da dependência Lombok no `pom.xml`, arquivo não alterado neste diff.
