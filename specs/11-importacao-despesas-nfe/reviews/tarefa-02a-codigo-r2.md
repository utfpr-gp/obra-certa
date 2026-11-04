APROVADO

# Parecer de Código — Tarefa 2A (rodada 2)

**Veredito:** APROVADO. Nenhum apontamento bloqueante.

**Testes:** não rodei. O `shell` foi negado (`permission.rejected`), então o `mvnw` não executou. A análise é só de leitura, de `git diff --cached -M 722d01e -- apps/api`, do `NfeXmlParser.java`, do `NfeXmlParserTest.java`, da fixture e do plano.

## Pendências da rodada 1

1. **Nome do teste de entidades aninhadas — resolvida.** `NfeXmlParserTest.java:104` agora é `recusaEntidadesAninhadasComDoctype`, e o corpo só afirma `NfeInvalidXmlException` com `hasMessageContaining("DOCTYPE")` (`:105-107`). O nome não promete mais limite de expansão. Confere com o desvio (c) em `plan.md:52`: o teste prova a recusa por DOCTYPE, não o limite do JDK.

2. **Recusa por DOCTYPE, não por outro caminho — provada.** Só três mensagens existem no parser: `MSG_CORROMPIDO`, `MSG_NAO_NFE` e `MSG_DOCTYPE` (`NfeXmlParser.java:29-31`). A asserção `"DOCTYPE"` só passa com `MSG_DOCTYPE`, emitido em `:85-87` depois de `builder.parse` (`:84`). Se o parse estourasse algum limite, a mensagem seria "corrompido" e o teste falharia. Se a checagem `getDoctype()` fosse removida, o XML válido voltaria como preview e o teste também falharia. Ou seja, o teste discrimina.

3. **Fixture e asserção — inalteradas.** `nfe-entidades-aninhadas.xml` tem o mesmo conteúdo, com DOCTYPE interno e entidades em cascata (`:2-6`). A asserção `hasMessageContaining("DOCTYPE")` está em `NfeXmlParserTest.java:107`.

4. **Configuração do parser — segura.** Em `NfeXmlParser.java:74-82`, continuam `external-general-entities=false`, `external-parameter-entities=false`, `load-external-dtd=false`, `ACCESS_EXTERNAL_DTD` e `ACCESS_EXTERNAL_SCHEMA` vazios, e `FEATURE_SECURE_PROCESSING=true`. Não há caminho para resolver entidade externa nem DTD externo. O bloco de configuração não foi alterado nesta rodada.

5. **Desvio (a) do plano.** O `IOException` não tem teste e o `catch` continua em `NfeXmlParser.java:91-92`. Isso já está registrado em `plan.md:52` como desvio com justificativa, então não é pendência nova.

## Verificações adicionais

- **Camada:** `integration/` continua de acordo com `architecture.md:67`. Não há Controller ou Service envolvido.
- **Referências:** a busca em `apps/api/src` só encontra `NfeXmlParser` no novo pacote `integration`. Não sobrou import do pacote `service` antigo.
- **Tratamento de erro:** todos os `catch` convertem a falha em `NfeInvalidXmlException` com mensagem de motivo. Nenhum engole a falha.
- **Anti-acoplamento:** os testes novos afirmam mensagem e tipo de exceção, sem depender de detalhe interno do parser.

## Sugestões (não bloqueiam)

- `recusaEntidadesAninhadasComDoctype` e `recusaXmlComDoctypeComMotivo` (`:66-70`) afirmam a mesma coisa, com DOCTYPE recusado e mensagem `DOCTYPE`. A fixture nova só acrescenta o caso de entidades em cascata. Se preferir, dá para dizer no nome que o caso é de entidades em cascata. Isso é preferência de organização, não prejuízo.

## Observações fora do escopo deste diff

- O limite de expansão do JDK continua sem teste de regressão, como já registrado na rodada 1. Vale como Issue de manutenção, junto com a decisão de usar `disallow-doctype-decl`, que é do autor.
- O ramo `catch (IOException)` (`NfeXmlParser.java:91-92`) segue sem teste, por causa do desvio (a) já registrado.
