# Decisões — Tarefa 5, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Comprovante XML não é consumível: download monta nome com `.null` (`ExpenseReceiptService.java:27,90`); a tela salva como `.jpg` (`expense-detail.component.ts:314`) e o botão de substituir rejeita XML | código | aceito | Corrigir o nome do arquivo no download incluindo XML no mapeamento de extensão, sem ampliar o que o upload de comprovante da US03 aceita. A parte da tela (rótulo e extensão no cliente) fica registrada para a Tarefa 8, que mexe na interface. |

## Sugestões promovidas a ajuste

- Endurecer a asserção do teste de atomicidade (`isInstanceOf(Exception.class)` → `DataAccessException` e/ou mensagem do gatilho), para falhar pelo motivo certo.
- Verificar o conteúdo efetivamente enviado ao storage no teste de pagamento, não só chave/tipo/tamanho.
- `log.warn` na compensação quando o `storage.delete` falhar, preservando o erro original.
- `receipt_size` passa a vir do conteúdo lido (`xml.length`), não de `file.getSize()`.
- Prefixo da chave do objeto usa `project.getId()` (obra já autorizada), não o `projectId` cru do path.
- Alinhar o plano ao pacote real do teste (`controller/`, não `service/`).

## Desvio registrado

O caso de falha do banco em `NfeImportServiceAtomicityTest` não teve RED legítimo: a primeira falha foi defeito de consulta no próprio teste (`pending_payments` sem `project_id`). A asserção será endurecida nesta rodada para que o teste não passe por qualquer erro.

## Fora desta rodada

- Tela de despesa (`expense-detail.component.ts`): extensão `.jpg` e rótulo de substituição. Tarefa 8.
- `POST /imports` sem `Location`: manutenção.
- Falha de banco sem `ApiErrorResponse`: comportamento anterior ao diff; manutenção.
- `architecture.md` desatualizado (V1–V9, ausência da regra "pagamento só na primeira linha"): documentação do fechamento.
