# Parecer de Código — Tarefa 2

**Rodada:** 1  
**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Teste concorrente depende do texto e do alias da consulta de produção** — `apps/api/src/test/java/com/obracerta/controller/PaymentSettlementIntegrationTest.java:118`  
   Regra violada: o roteiro `.agents/agents/revisor-codigo.md` reprova “teste acoplado a detalhe de implementação, que quebra em qualquer refatoração”. A estratégia do §9 da arquitetura exige a prova de integração com PostgreSQL; ela deve continuar verificando o comportamento após refatorações equivalentes.  
   Prejuízo concreto: trocar o alias SQL `e`, alterar a capitalização ou usar outra consulta equivalente para bloquear a mesma despesa mantém a quitação correta, mas faz a contagem retornar zero e reprova o teste após cinco segundos. A sincronização também conta consultas de toda a base, sem identificar as duas sessões participantes. A prova de sobreposição precisa observar a espera das transações participantes sem depender desse fragmento literal do SQL.

## Sugestões (não bloqueiam)

Nenhuma adicional.

## Observações fora do escopo deste diff

- Não identifiquei bloqueios no código de produção: controlador magro com `@Valid`, DTO record, autorização no serviço, bloqueio no repositório antes de carregar o pagamento, transação envolvendo as duas entidades e conversão pelo `ExpenseMapper` respeitam os padrões arquiteturais.
- As mudanças documentais preexistentes indicadas no despacho foram excluídas do julgamento.
- Os relatórios Surefire consultados confirmam **22 testes de integração aprovados**: 12 de quitação, três de alertas e sete da edição de pagamento existente, sem falhas, erros ou ignorados. Os três unitários aprovados foram informados pelo orquestrador.
- Não executei testes adicionais, não repeti tentativas de conexão e não alterei arquivos.
