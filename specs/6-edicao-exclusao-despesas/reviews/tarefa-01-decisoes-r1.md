# Decisões — Tarefa 1, rodada 1

O autor solicitou “Realize as correções” após receber os dois bloqueios e a sugestão não bloqueante da revisão de código. A instrução aceita os itens apresentados, sem autorizar ampliação do escopo ou commit da implementação.

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Valores monetários da edição sem máscara BRL acordada | código, bloqueio 1 | aceito | Aplicar a convenção do cadastro, preservando valores numéricos em reais no DTO e valores existentes ao abrir o modal. |
| 2 | Quantidade inválida pode lançar exceção no cálculo do total | código, bloqueio 2 | aceito | Validar operandos antes de calcular; entradas inválidas devem produzir mensagens de validação sem exceção. |
| 3 | Terminações de linha CRCR/whitespace em ExpenseService.java e expense-detail.component.ts | código, sugestão | aceito | Normalizar as terminações de linha sem alterar a lógica ou os acentos dos arquivos. |

O parecer de conformidade da rodada 1 foi aprovado e não apresentou bloqueios. As correções seguem para um implementador novo e depois para a segunda rodada de revisão da Tarefa 1. Os pareceres originais permanecem inalterados.
