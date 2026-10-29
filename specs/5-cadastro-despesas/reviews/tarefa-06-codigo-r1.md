# Parecer de Código — Tarefa 6

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum.

O diff integral de `git diff 1d5fabc435fcf9e4b6e6bd4b7f0702dce2a416dc` respeita as camadas e os padrões declarados em `docs/architecture.md`:

- A validação da API permanece no service; o tratamento multipart usa `RestControllerAdvice` e o payload padronizado.
- O componente mantém HTTP no serviço existente, estado em signals e controle de fluxo com `@if`.
- Os erros de upload preservam a confirmação financeira e apresentam orientação explícita.
- A validação usa MIME, extensão correspondente e tamanho, conforme a simplificação autorizada. Não há inspeção de conteúdo no código de validação.

Validação independente executada:

- `ReceiptMultipartErrorTest` e `ExpenseValidationContractTest`: **6 testes aprovados**, sem falhas, erros ou testes ignorados.
- `npm.cmd run build`: **aprovado**, código de saída 0.
- A integração de comprovantes e o Karma ficaram sob responsabilidade do outro revisor, conforme o despacho; não foram executados nesta revisão.

## Sugestões (não bloqueiam)

- Em `apps/web/src/app/features/expenses/expense-flow.spec.ts`, preferir disparar o evento `change` do input nos testes de fluxo, em vez de chamar diretamente `ExpenseFormComponent.selectReceipt()`. Isso exercita também o vínculo do template e reduz a dependência do nome do método público. O vínculo atual foi conferido e está correto.

## Observações fora do escopo deste diff

- Persistem os avisos já conhecidos sobre o escopo da dependência Lombok no Maven e o orçamento do bundle Angular. Ambos ficaram fora dos bloqueios desta tarefa.
