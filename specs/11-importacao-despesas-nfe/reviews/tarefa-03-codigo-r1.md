# REPROVADO

Não rodei os testes: o shell foi negado nesta sessão (`permission.rejected`), então o comando `.\mvnw.cmd ... NfeImportControllerPreviewTest` ficou sem execução. O parecer abaixo é só de leitura do diff e dos arquivos citados.

## Apontamentos (bloqueiam)

1. **Regra de "chave já registrada" duplicada em dois lugares.** `NfeImportService.java:30-31` repete exatamente a checagem de `NfeKeyGuard.java:22-23`: `countActiveExpensesByProjectIdAndNfeKey(...) > 0` → `throw new NfeAlreadyRegisteredException()`.
   Regra violada: §4 do utf-rules ("duplicação de regra que já existe em outro lugar do repo") e §5.2.1 do architecture ("Services concentram 100% da lógica"; a regra precisa ter um dono).
   Prejuízo concreto: se a condição mudar (por exemplo, incluir outro filtro de status ou alterar a mensagem), o preview e a confirmação passam a divergir. O usuário vê "disponível" no preview e recebe 409 ao salvar, ou o inverso. A dúvida sobre usar `NfeKeyGuard` é legítima porque ele trava a obra com `lockActiveById` e é `@Transactional`, mas isso não impede extrair a checagem sem trava (por exemplo, `isRegistered(projectId, key)`) para um ponto que os dois usem. Não corrijo; aponto a duplicação.

2. **A ordem "posse antes do parse" não tem teste que a proteja.** `NfeImportService.java:27` (posse) vem antes de `:29` (parse), e isso é a regra de §7.2 (404 para alheio). Nenhum teste em `NfeImportControllerPreviewTest` cobre o cruzamento "obra alheia + XML inválido". Os 404 de alheio e de excluída usam só `nfe-valida.xml`.
   Regra violada: §7.2 e §9 (TDD na camada onde o comportamento vive, utf-rules §4).
   Prejuízo concreto: alguém pode mover o `parse` para cima. Nenhum teste quebra, e um não dono passa a receber 400 com detalhe do XML em vez de 404. Isso vaza informação e quebra o contrato de isolamento sem aviso.

## Sugestões (não bloqueiam)

- `NfeImportControllerPreviewTest` (método `preview404ParaObraExcluida`): a requisição é montada à mão, sem o helper `preview(...)`. Reutilize o helper, passando o id da obra excluída, para manter um único ponto de montagem.
- Teste de escopo por obra: falta um caso em que a mesma chave está registrada em **outra** obra do mesmo dono e o preview deve retornar 200. O `countActiveExpensesByProjectIdAndNfeKey` filtra por `projectId`, e nada prova isso.
- `expenseCount()` como prova de "sem escrita" só cobre `expenses`. Vale somar também `suppliers` e `projects`, já que o preview não deveria tocar nenhum deles.
- Imports inline no teste: `org.hamcrest.Matchers.containsString` e `org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder` deveriam ser imports normais.
- `@AfterEach removeOnlyThisFixture` está no meio da classe, depois dos helpers. Mover para logo após `persistOwnerAndProject` facilita a leitura.
- `NfeImportController.java`: `import org.springframework.web.bind.annotation.*;` é wildcard; os imports explícitos ficam mais claros.
- `NfeImportService.preview` lê todo o multipart (`file.getBytes()` no controller) antes da checagem de posse. Não é erro, mas um não dono faz o servidor bufferizar o arquivo inteiro antes do 404. Vale registrar.

## Verificado e conforme

- Controller magro: sem repository, sem regra; só recebe, delega e retorna DTO.
- Service: sem `save`, sem storage, sem `NfeKeyGuard`. Usa `countActiveExpensesByProjectIdAndNfeKey`, como o foco pede.
- `GlobalExceptionHandler.java:72-98`: os dois handlers seguem o padrão dos existentes (`ApiErrorResponse`, `request.getRequestURI()`, `List.of()`, status 400 para `NfeInvalidXmlException` e 409 para `NfeAlreadyRegisteredException`). Não há duplicação com outro handler.
- Testes 404 afirmam `$.status` e `$.message`, então não são só de status. O 409 afirma a mensagem. O 401 é caracterização (corpo vazio) e a justificativa deve estar no parecer de conformidade.
- Padrão de teste: `@SpringBootTest` + `@ActiveProfiles("test")` + `@AutoConfigureMockMvc` com `api.security.token.secret`, o mesmo de `BudgetAuthenticationIntegrationTest` e `PaymentSettlementIntegrationTest`.
- Sem catch vazio nem tratamento que engole falha.

## Observações fora do escopo deste diff

- `GlobalExceptionHandler.java:29-34`: o handler de `MaxUploadSizeExceededException` tem o status 413 escrito como literal (`413`) em vez de usar `HttpStatus.PAYLOAD_TOO_LARGE.value()`. Já existia antes do diff, então é candidata a Issue de manutenção.
