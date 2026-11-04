# Parecer de Código — Tarefa 1

**Veredito:** APONTAMENTOS

Revisão somente leitura. Testes frontend e build ficaram sob execução do orquestrador; não atribuo resultado a essas execuções. Reproduzi isoladamente em JavaScript a exceção descrita no item 2.

## Apontamentos (bloqueiam)

1. **Valores monetários não seguem a máscara BRL acordada** — `apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.html:21` e `:26`  
   Regra violada: `docs/architecture.md`, §5.1.9, determina máscara BRL que interpreta os dígitos como centavos, preservando o DTO numérico em reais. O cadastro existente implementa essa regra em `ExpenseFormComponent.onMoneyInput`; o modal usa `type="number"` diretamente.  
   Prejuízo concreto: digitar `123456` no total da edição permite enviar `123456` reais, enquanto o padrão do cadastro interpreta a mesma sequência como `1234.56` reais. A mudança de convenção entre cadastrar e editar favorece correções financeiras com magnitude errada.

2. **Validador de total pode lançar exceção ao receber quantidade inválida** — `apps/web/src/app/features/expenses/components/expense-edit-modal/expense-edit-modal.component.ts:39`  
   Regra violada: `docs/architecture.md`, §5.1.4, exige formulários com validação; o plano determina destacar entradas inválidas para correção. O cálculo do grupo ocorre sem verificar previamente os limites dos operandos.  
   Prejuízo concreto: em modo calculado, com quantidade `1e307` e valor unitário `1`, `quantity * 100` resulta em `Infinity`; `BigInt(...)` lança `RangeError`. A validação passa a gerar uma exceção em vez de concluir normalmente e apresentar os erros do formulário. A expressão foi reproduzida isoladamente; não houve reprodução pelo navegador nesta revisão.

## Sugestões (não bloqueiam)

- Normalizar as terminações de linha em `ExpenseService.java` e `expense-detail.component.ts`. O comando `git diff --check 40ada9128099b1add8551f5ca33169a8d35f3587 -- apps/api apps/web` retornou código 1, com ocorrências de whitespace/CRCR. Isso amplia o diff e dificulta sua revisão; não comprova falha do pipeline.

## Observações fora do escopo deste diff

- As alterações preexistentes de documentação referentes à US15 não foram imputadas à Tarefa 1.
- Não identifiquei outros bloqueios de camadas, DTOs, autorização por proprietário ou transação no diff analisado.
