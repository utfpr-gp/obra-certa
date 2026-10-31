# Decisões da Triagem — Tarefa 9 — Rodada 1

Pareceres: `tarefa-09-conformidade-r1.md` e `tarefa-09-codigo-r1.md`.
Ambos com veredito **APROVADO COM RESSALVAS**.

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | A Home decide “há outras obras?” pela lista local, que pode estar defasada (obra criada pela Navbar) | conformidade e código | **aceito** | Buscar a lista atualizada no servidor após o `DELETE` e decidir com ela. Fecha o CA4 também no fluxo de primeira sessão. |
| 2 | `clear()` não remove a chave do `localStorage` | conformidade e código | **aceito** | Usar `initialize([], userId)` no caminho sem obras, que persiste a remoção; assertar a chave no teste. |
| 3 | Reload da Navbar sem cancelamento; resposta antiga pode sobrescrever a obra ativa | código | **aceito** | Adicionar guarda de requisição (token/sequência) e teste com respostas fora de ordem. |
| 4 | Wrapper `activeProjectState` no spec da Home mascara o signal real | código | **recusado** | É um shim de teste para preservar os casos existentes; os testes novos usam a instância real e o `localStorage`. A refatoração ampliaria o escopo sem ganho funcional. Registrado como dívida de teste. |
| 5 | Asserções acopladas a chamadas (`clear` não chamado, contagem de `getProjects`) | código | **recusado** | As asserções comportamentais já existem. A asserção de `clear` será substituída pela prova de persistência no item 2; a contagem de chamadas da Navbar fica como está para provar o reload. |
| 6 | Teste da Navbar não prova o cabeçalho; a ausência passa por acidente | código | **recusado** | O critério da tarefa é a lista do seletor, que o teste prova. O cabeçalho é atualizado pelo `initialize` do serviço real em produção; trocar o mock no spec da Navbar ampliaria o escopo. |
| 7 | `userId` capturado no construtor da Home | código | **recusado** | A rota é autenticada e o padrão já é usado pela Navbar. Mudar só a Home criaria inconsistência; candidato a melhoria junto da reatividade de identidade. |
| 8 | Teste usa `h1` e a chave literal do `localStorage` | código | **recusado** | O `h1` é dívida herdada; a chave literal é a forma de provar a persistência sem expor API interna. |
| 9 | “Próxima obra” implementada como “primeira restante” | código | **aceito como decisão semântica** | A spec não define ordem. Fica documentado que “próxima” é a primeira obra restante na ordem devolvida pelo servidor. |

## Resíduo

- Itens 1 a 3 serão corrigidos e passam pela rodada 2 de revisão.
- Itens 4 a 8 ficam registrados como dívida aceita; não bloqueiam a tarefa.
- Item 9 fica registrado como interpretação do critério, sem mudança de código.
