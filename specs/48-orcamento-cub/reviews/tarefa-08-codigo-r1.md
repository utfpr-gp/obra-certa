# Parecer de Código — Tarefa 8

**Veredito:** APONTAMENTOS

## Apontamento bloqueante

1. **A disponibilidade e a consulta de acabamentos aceitam linhas diferentes do SIDRA.** A arquitetura define os acabamentos disponíveis pelo contrato de referências. O código anual habilita um projeto sempre que encontra um preço positivo, mas a consulta de referências também exige o nome do acabamento (`D5N`). Se a única linha com preço vier sem esse nome, a interface habilita o mês e o projeto, mas a consulta seguinte retorna uma lista vazia. O teste anual omite `D5N` até nas linhas esperadas como disponíveis. Compartilhar a validação da linha entre as duas consultas evita a divergência. [Contrato da US15](/C:/Users/panic/dev/obra-certa/docs/architecture.md:503) · [Cliente SIDRA](/C:/Users/panic/dev/obra-certa/apps/api/src/main/java/com/obracerta/service/SidraClient.java:69) · [Teste anual](/C:/Users/panic/dev/obra-certa/apps/api/src/test/java/com/obracerta/controller/BudgetControllerTest.java:217)

O restante do diff segue a separação de camadas, verifica a titularidade e cancela a consulta anterior ao trocar o contexto. O orquestrador registrou 40 testes de backend, 121 de frontend e o build Angular aprovados.
