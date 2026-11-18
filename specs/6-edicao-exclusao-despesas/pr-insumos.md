# Insumos para o Pull Request — US04

Destino: `develop`. Vínculo: `Closes #6`.

Título sugerido: `US04: editar e excluir despesas com integridade financeira`.

## Explicação do autor

O template `.github/pull_request_template.md` exige a seção “O que este PR faz e por quê” escrita pelo autor, com pelo menos 250 caracteres. O workflow `.github/workflows/portao-de-entendimento.yml` desconsidera espaços na contagem. Este documento fornece fatos; não substitui essa explicação.

Texto inicial enviado pelo autor: “Ela adiciona permissões para excluir e editar despesas”. Complementação solicitada para atender ao mínimo do Portão de Entendimento; não foi expandido pelo agente em nome do autor.

## Fatos da entrega

- Edição pela consulta individual `/despesas/:id`, preservando a obra e recalculando os gastos das categorias, com alertas de teto.
- Alternância entre paga e pendente com um único registro de pagamento, vencimento validado e preservação da data de quitação em edições comuns. V10 acrescenta status e data efetiva; migrations anteriores permanecem imutáveis.
- Remoção e substituição de comprovantes privados com tentativa imediata de exclusão física, mensagens distintas para falhas e ausência de fila ou repetição automática.
- Exclusão lógica da despesa e inativação do pagamento preservando os registros e o teto. Falha no armazenamento não desfaz exclusão financeira já confirmada.
- Cancelamento, bloqueio de duplo envio, isolamento por proprietário, respostas atrasadas e troca A → B → A cobertos; 401 encerra a sessão e exige retorno manual. Consulta e edição seguem os tokens visuais e oferecem retorno para Contas a Pagar.

## Verificação

- API completa após integração da develop: 289 testes aprovados, sem falhas, erros ou ignorados. A execução anterior à integração tinha 287; a develop atual acrescentou testes de remoção dos endpoints administrativos.
- Angular completo: 344 testes aprovados.
- Build Angular: concluído; aviso de bundle inicial 651,96 kB para orçamento de 500 kB.
- Evidências: `reviews/validacao-fechamento.md`, logs locais indicados e pareceres de tarefa.
- Auditoria final: **PRONTO PARA PR**, sem pendências bloqueantes, inclusive após integrar a develop. Pareceres integrais em `reviews/auditoria-final-r1.md` e `reviews/auditoria-final-r2.md`.

## Apontamentos aceitos

| Origem | Ajustes autorizados | Registro |
| --- | --- | --- |
| Tarefa 1, R1 | Máscara BRL, validação antes do cálculo e normalização das terminações de linha | `reviews/tarefa-01-decisoes-r1.md` |
| Tarefa 2, R1 | Tipagem da fixture Angular, banco exclusivo e inicialização do serviço pelo construtor correto | `reviews/tarefa-02-decisoes-r1.md` |
| Tarefa 2, R2, retomada excepcional autorizada | Preservar paidAt em paga → paga e testar a constraint de status isoladamente | `reviews/tarefa-02-decisoes-r2.md` |
| Tarefa 6, R1 | Executar verificavelmente os testes previstos | `reviews/tarefa-06-decisoes-r1.md` |
| Tarefa 7, R1 | Alinhar a fixture ProjectLifecycleTest ao status obrigatório | `reviews/tarefa-07-decisoes-r1.md` |
| Ajuste visual, R1 | Corrigir tamanhos e cores dos quatro títulos | `reviews/fix-layout-despesa-decisoes-r1.md` |

## Apontamentos recusados

Nenhuma recusa de apontamento registrada nos arquivos de decisões desta entrega. Sugestões não promovidas a correção não são registradas como recusas.

## Limites relevantes para revisão

- A listagem, filtros e totalizadores de `/contas` pertencem à US05; seu rascunho local não integra este PR.
- Fornecedores globais e validação pertencem à US15; alterações locais de planejamento não integram este PR.
- Uma falha na tentativa de exclusão física pode deixar um objeto no armazenamento, sem recuperação posterior garantida, conforme simplificação aprovada pelo autor.
- Não há reautenticação inline, restauração da intenção nem repetição automática de mutações após login.

Antes de escrever a explicação, o autor pode executar `/utf-tutor prova` para o simulado sobre a entrega.
