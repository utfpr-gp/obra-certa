# Parecer de Conformidade — Tarefa 11

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2 — Alerta com o motivo para XML inválido ou fora do formato NF-e, com opção de cadastro manual | atendido no escopo documental. O PRD preserva o critério em uma única entrada. A spec distingue o limite de 10 MiB por arquivo do limite de 11 MiB por requisição, em acordo com a configuração da API e do Nginx. | `docs/prd.md:429`, `docs/architecture.md:546`, `specs/11-importacao-despesas-nfe/spec.md:29` |
| CA5 — Uma despesa por item, com pagamento único e XML como comprovante da primeira linha | atendido no escopo documental. O PRD descreve os dados gravados e os dois estados do pagamento. O contrato multipart corresponde ao controller e a descrição dos tipos MIME corresponde à V11. | `docs/prd.md:424`, `docs/architecture.md:539`, `apps/api/src/main/java/com/obracerta/controller/NfeImportController.java:21`, `apps/api/src/main/resources/db/migration/V11__allow_xml_nfe_receipt.sql:4` |

A verificação documental passou no `git diff --check`. O diff revisado contém somente Markdown e não exigiu nova execução de testes funcionais.

## Apontamentos
