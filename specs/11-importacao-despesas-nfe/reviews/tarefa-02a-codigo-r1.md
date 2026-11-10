REPROVADO

# Parecer de Código — Tarefa 2A

**Diff:** `git diff --cached -M 722d01e -- apps/api`

**Veredito:** APONTAMENTOS

**Não rodei os testes.** A chamada `.\mvnw.cmd ... test` foi negada com `permission.rejected` (shell sem permissão). Tudo abaixo é leitura estática.

## Apontamentos (bloqueiam)

1. **O teste de entidades aninhadas não prova o que o nome promete.** — `apps/api/src/test/java/com/obracerta/integration/NfeXmlParserTest.java:103-108` e `apps/api/src/test/resources/nfe/nfe-entidades-aninhadas.xml:3-6, 24`
   Regra violada: §4 do `utf-rules.md` (o teste precisa provar o comportamento que nomeia) e a decisão (b) do spec, que pede que o parser não expanda sem limite.
   Evidência: a fixture realmente expande em cascata (`a`=10 chars, `b`=10×a, `c`=10×b, `d`=10×c, `xProd`=`&d;` → 10.000 caracteres e cerca de 11.110 referências de entidade). Esse volume fica abaixo do limite padrão do JDK com `FEATURE_SECURE_PROCESSING` (64.000 expansões). Logo, a fixture não aciona nenhum limite. A asserção é só `hasMessageContaining("DOCTYPE")`, e a checagem `doc.getDoctype()` (`NfeXmlParser.java:85-87`) roda depois do `builder.parse` (`:84`). O teste passa igual com ou sem limite de expansão, então não distingue "parser limita" de "parser expande tudo e depois recusa".
   Prejuízo concreto: a garantia contra "bomba de entidades" depende só dos limites padrão do JDK, e nenhum teste cobre isso. Se alguém trocar o parser ou desligar o `FEATURE_SECURE_PROCESSING`, a suíte continua verde. O nome `ExpansaoEmCascata` dá uma segurança que o teste não mede.
   Correção sugerida (fica para o autor decidir): ou renomear para algo como `recusaEntidadesAninhadasComDoctype` e admitir que o limite não é testado, ou acrescentar um teste que exija a recusa de cascata grande (um caso com expansão que estoure o limite do JDK) e confirmar a mensagem esperada.

## Pontos verificados (sem apontamento)

- **Configuração do parser (`NfeXmlParser.java:74-82`):** não há caminho de resolução externa. `external-general-entities` e `external-parameter-entities` estão `false`, `load-external-dtd` está `false`, `ACCESS_EXTERNAL_DTD` e `ACCESS_EXTERNAL_SCHEMA` estão vazios, e não há XInclude. O teste `entidadeExternaComDoctypeEhRecusadaSemSerResolvida` (`:82-90`) é discriminante: se o arquivo inexistente fosse lido, a exceção de IO cairia em "corrompido" e não em "DOCTYPE".
- **Diff de produção:** só a linha `package` (`NfeXmlParser.java:1`). O bloco de configuração é idêntico ao de `722d01e`. Não há nada removido nele neste diff.
- **Referências à classe movida:** a busca em `apps/api` não encontrou nenhum uso de `service.NfeXmlParser`. A movimentação não quebra compilação dentro de `apps/api`.
- **Caracterização (`:226-273`):** `recusaNfeSemEmitente`, `recusaNfeSemIde` e `recusaProdSemXProd` são fortes. O `semFragmento` tem `assertThat(original).contains(fragmento)` (`:277`), então um fragmento que não exista quebra o teste em vez de passar em falso. A mensagem casa com o caminho de código (`filho(...)` → `MSG_CORROMPIDO`). `recusaNFeSemInfNFe` (`:226-236`) cobre o `null` do `filhoOuNull(nfe,"infNFe")` e `recusaRaizNfeQueNaoEhNfeProcNemNfe` (`:214-224`) cobre o `default` do switch (`:102-106`). Ambas casam com `MSG_NAO_NFE`. São testes de comportamento e não dependem de detalhe interno.
- **Arquitetura:** `integration/` para o parser está conforme `architecture.md` (linha 67). Não há violação de camada.

## Sugestões (não bloqueiam)

- **Duplicação de template no teste:** `semFragmento` recebe literais que replicam o `nfeXml` — `"<emit><CNPJ>12345678000190</CNPJ><xNome>Fornecedor</xNome></emit>"` (`:240-241`), `"<ide><dhEmi>" + DH_EMI + "</dhEmi></ide>"` (`:251`) e `"<xProd>Cimento</xProd>"` (`:268`). Se o template mudar, os três testes quebram com mensagem de `contains`, não de domínio. Vale extrair constantes (`EMIT_VALIDO`, `IDE_VALIDO`, `XPROD_VALIDO`) usadas tanto no template quanto no helper.
- **Constante inline:** `"<xProd>Cimento</xProd>"` aparece no helper `det()` e de novo em `:268`. Mesmo ponto acima.
- **Helper com asserção:** `semFragmento` faz `assertThat` dentro de um helper. Está correto, mas a mensagem de falha fica genérica. Um `as(...)` com o fragmento ajudaria a depuração.
- **Escolha de design para a Issue de manutenção (fora do diff):** `disallow-doctype-decl=true` rejeitaria antes de processar o DTD e evitaria a expansão por completo. Não foi usado, provavelmente porque mudaria a mensagem de "DOCTYPE" para "corrompido" nos testes existentes (`:52-70`, `:73-101`). É uma decisão do autor, não um erro.

## Observações fora do escopo deste diff

- Se a intenção for proteger contra bomba de entidades de fato, considerar um teste de regressão com expansão acima do limite do JDK, em Issue de manutenção.
