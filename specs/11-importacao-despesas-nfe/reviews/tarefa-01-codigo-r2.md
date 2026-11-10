APROVADO

Os dois testes novos provam o ramo 404 do `NfeKeyGuard`. O apontamento aceito está resolvido.

**Verificação do apontamento**

- Obra excluída: `NfeKeyGuardTest.java:92-98` (`refusesWhenTheProjectIsSoftDeleted`) marca `deletedAt` na obra, persiste e exige `ResourceNotFoundException`. O teste discrimina: se `ProjectRepository.java:23` (`p.deletedAt is null`) deixasse de filtrar, o guard seguiria para a contagem, que daria 0, e nenhuma exceção seria lançada. O teste falharia.
- Obra inexistente: `NfeKeyGuardTest.java:100-103` (`refusesWhenTheProjectDoesNotExist`) passa uma chave de obra aleatória e exige a mesma exceção. Isso cobre o `orElseThrow` de `NfeKeyGuard.java:21`.
- A exceção é `ResourceNotFoundException`, que mapeia para 404 no handler já existente (`architecture.md` §5.2.3, 404 para recurso não localizado).

**Apontamentos bloqueantes**

Nenhum.

**Sugestões (não bloqueiam)**

- Sugestão: os dois testes 404 verificam só o tipo da exceção. Vale acrescentar a asserção da mensagem ou do status, se o contrato de erro da trava for exposto ao cliente.
- Sugestão: `NfeKeyGuard` ainda não tem chamador em `src/main` neste diff. O 404 é provado no nível do guard, não pelo fluxo HTTP de criação ou exclusão. Se a integração estiver prevista em tarefa posterior, não é bloqueante aqui.

**Observações fora do escopo deste diff**

- `ExpenseServiceDeleteNfeTest` não cobre o 404 de obra excluída ou inexistente pelo caminho do serviço. A cobertura do ramo está em `NfeKeyGuardTest`, então isso não reprova.

Não executei os testes. O parecer se baseia na leitura do diff e do `architecture.md`.
