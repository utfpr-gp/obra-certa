# Parecer de Código — Tarefa 2

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum identificado no diff `git diff 72463ee2bd8c20bea888714ebed4a6676acec2b8`.

Evidências:

- `ExpenseService.java:39–45`: validações de vencimento permanecem no service, conforme arquitetura §5.2.1; usam a exceção existente, mapeada para `400` padronizado.
- `ExpenseService.java:68–76`: criação reutiliza a transação existente e o cascade do agregado, sem camada ou repositório desnecessário.
- `ExpenseMapper.java:16–18`: vencimento atravessa a fronteira por DTO record, conforme §5.2.2.
- `expense-form.component.ts:55–57,81–83,124–125`: Reactive Forms tipados, validação temporal atualizada ao mudar a data e payload coerente com a quitação, conforme §5.1.4.
- `expense-form.component.html:76–95`: controle de fluxo moderno com `@if`; nenhuma chamada HTTP introduzida no componente.
- O schema existente contém vencimento e vínculo único do pagamento à despesa; dispensar migration neste recorte não viola §8.
- Não há leitura do relógio atual: a comparação depende exclusivamente das duas datas informadas. Injetar `Clock` sem utilização não traria determinismo adicional.

## Sugestões (não bloqueiam)

Nenhuma necessária.

## Observações fora do escopo deste diff

- Build informa bundle inicial de **592,11 kB**, acima do orçamento de **500 kB**. O aviso já existia segundo o despacho; não impede a compilação.
- Maven informa configuração preexistente de escopo `annotationProcessor` para Lombok no `pom.xml`, arquivo não alterado.

## Verificações executadas

- Em `apps/api`, perfil `test` e conexão fornecida para `obracerta_us03_codigo`:
  `.\mvnw.cmd '-Dtest=ExpenseServiceTest,ExpenseValidationContractTest' test`
  — **14 testes, zero falhas/erros; BUILD SUCCESS**.
- Em `apps/web`: `npm.cmd run build`
  — **sucesso**, incluindo templates estritos; aviso de bundle descrito acima.

Li integralmente o diff e os documentos indicados. Integração PostgreSQL e Karma ficaram com o outro revisor, conforme divisão do despacho. Nenhum arquivo ou estado Git foi editado.
