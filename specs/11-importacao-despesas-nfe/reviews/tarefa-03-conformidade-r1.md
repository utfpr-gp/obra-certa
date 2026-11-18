# Parecer de Conformidade — Tarefa 3

**Veredito:** APONTAMENTOS

**Observação de execução:** não rodei os testes. O shell foi negado nesta sessão (`permission.rejected`), então não executei `git diff` nem `.\mvnw.cmd ... test`. A análise foi feita por leitura do diff e dos arquivos. Os testes ficam "não rodados" até alguém executar o comando do despacho.

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — 200 com fornecedor, CNPJ, data, chave e todos os itens | atendido (código e teste) | `NfeImportService.java:24-33`; `NfeImportControllerPreviewTest.java:71-93` |
| CA2 — 400 com motivo para XML corrompido **ou** que não é NF-e | parcialmente atendido: o motivo sai pelo handler, mas só o ramo "corrompido" é provado no controlador | `GlobalExceptionHandler.java:72-84`; `NfeXmlParser.java:30` (`MSG_NAO_NFE`); teste em `NfeImportControllerPreviewTest.java:96-107` |
| CA3 — 409 com "A nota fiscal já foi registrada", sem gravar | atendido | `NfeImportService.java:30-31`; `NfeAlreadyRegisteredException.java:6`; teste em `NfeImportControllerPreviewTest.java:110-124` |
| CA9 — 404 para obra alheia e excluída, sem gravar e sem revelar existência | atendido | `NfeImportService.java:26-27` (dono antes do parse); `ResourceNotFoundException.java:6` ("Projeto não encontrado", a mesma mensagem para inexistente, alheia e excluída); testes em `NfeImportControllerPreviewTest.java:127-154` |
| Plano — 401 sem token | fora da spec; o teste afirma corpo vazio, o que é o comportamento real | `SecurityConfigurations.java:33-34`; teste em `NfeImportControllerPreviewTest.java:157-168` |

### Verificações pedidas

- **Ordem no service:** atendida. `findByIdAndUserIdAndDeletedAtIsNull` vem na linha 27, antes de `parser.parse` (linha 28) e antes de `countActiveExpensesByProjectIdAndNfeKey` (linha 30). Nada é consultado antes da posse.
- **Nenhum save, storage ou guarda no preview:** atendido. `NfeImportService` não tem dependência de `ReceiptStorage`, `NfeKeyGuard` nem repositório de escrita. O controlador só chama `service.preview`. Os testes têm `verifyNoInteractions(storage)` em todos os casos.
- **404 não revela existência:** atendido. Alheia, inexistente e excluída caem no mesmo `orElseThrow`, com a mensagem fixa.
- **409 com mensagem exata:** atendido. O teste compara com igualdade (`jsonPath(...).value(ALREADY_REGISTERED_MESSAGE)`).
- **400 com motivo:** atendido no código (`exception.getMessage()`). A asserção usa `containsString("corrompido")`, que prova o ramo corrompido.

## Apontamentos

1. **O teste de 400 cobre só um dos dois motivos de CA2.** — `NfeImportControllerPreviewTest.java:96-107`
   Critério violado: CA2 — "Dado que o arquivo enviado é um XML corrompido **ou que não é uma NF-e** […] exibe alerta explicando o motivo da falha". O plano, na Tarefa 3, também pede "400 para XML de CA2".
   Evidência: só há um teste de 400 no controlador, com `nfe-corrompida.xml`. O ramo "não é NF-e" (`NfeXmlParser.java:100` e `:109`, `MSG_NAO_NFE`) passa pelo mesmo handler, mas não há prova no nível HTTP de que a resposta traz o motivo "não é NF-e". A cobertura do parser existe na Tarefa 2, mas não cobre o contrato da API.
   Correção sugerida ao implementador, para a próxima rodada: adicionar um caso 400 com uma fixture de outro documento fiscal (`nfe-outro-documento.xml`, que já existe) e afirmar `containsString("não é NF-e")`.

## Sugestões

- **401 sem corpo `ApiErrorResponse`: é desvio do plano, não da spec.** A spec não tem critério para 401. O único texto relacionado é o de abandono: "Sessão expira no meio da importação: segue o fluxo de login existente". O corpo vazio de `HttpStatusEntryPoint` é esse fluxo existente, e o teste já afirma esse comportamento real, então o CA não é violado. O que fica divergente é a instrução do plano de afirmar `ApiErrorResponse` no 401. Para registrar, sugiro uma linha em "Desvios registrados na execução" da Tarefa 3, no mesmo formato da Tarefa 2A: "401 não tem corpo ApiErrorResponse porque `SecurityConfigurations` usa `HttpStatusEntryPoint` (fluxo existente, sem critério na spec). O teste afirma corpo vazio. Alterar o formato do 401 é mudança de segurança e fica fora desta história." Assim o plano fica coerente com o código, e a decisão fica registrada para a defesa.
- **Testes não rodados nesta revisão.** Quem chamou o revisor deve rodar `.\mvnw.cmd -B "-Dtest=NfeImportControllerPreviewTest" "-Dspring.profiles.active=test" test` em `apps/api`, ou executar o comando pelo próprio fluxo, e anexar o resultado ao parecer.
