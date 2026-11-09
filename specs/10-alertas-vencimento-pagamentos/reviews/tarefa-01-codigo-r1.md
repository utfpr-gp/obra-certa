# Parecer de Código — Tarefa 1

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Conversão Entity → DTO fora da camada acordada** — `apps/api/src/main/java/com/obracerta/service/PaymentService.java:44`  
   Regra violada: `docs/architecture.md`, §5.2, item 2: “A conversão é feita na camada `mapper/` de forma explícita e tipada”. A exceção documentada contempla a composição financeira da US07.  
   Prejuízo concreto: a montagem dos campos de apresentação fica misturada à autorização, classificação temporal e soma financeira. Alterar o contrato do item exige modificar o serviço de negócio e cria outra localização para manter conversões, contrariando a separação adotada no projeto.

## Sugestões (não bloqueiam)

- **Complementar a integração com autenticação real** — `apps/api/src/test/java/com/obracerta/controller/PaymentAlertsIntegrationTest.java:26`. O teste desliga filtros e substitui `UserContextHelper`; comprova consulta e autorização pelo proprietário informado, mas não comprova extração da identidade pelo JWT nem proteção HTTP da nova rota. A estratégia do §9 prevê testes com login JWT e Anti-IDOR. Um cenário com filtros ativos reduziria o risco de uma alteração de segurança passar despercebida. A cobertura Angular de 401 comprova o interceptor, sem substituir essa evidência do servidor.

## Observações fora do escopo deste diff

- As alterações preexistentes em `docs/architecture.md`, `docs/prd.md`, `specs/README.md` e `specs/09-gestao-orcamento/reviews/auditoria-final-r2.md` foram lidas e excluídas do julgamento da implementação.
- Revisão estática do diff solicitado, sem alterações de arquivos. Não executei testes nesta revisão. Conforme o despacho, os três testes unitários do serviço e o build frontend passaram; a integração PostgreSQL e a execução Angular permanecem sem validação concluída. Não repeti tentativas de Docker ou ChromeHeadless canceladas pelo usuário.
