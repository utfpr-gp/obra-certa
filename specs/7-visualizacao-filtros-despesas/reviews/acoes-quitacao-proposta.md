# Proposta — ação de quitação em Contas a Pagar

Pedido do autor: renomear “Consultar” para “Ver detalhes” e oferecer “Marcar como Pago” nas contas pendentes.

A renomeação está coberta pelo acesso à consulta individual da US05. A quitação rápida está explicitamente fora da spec aprovada da US05 e a US08 está Draft no PRD. Este documento é uma proposta para a próxima especificação; não altera o escopo aprovado nem autoriza código de quitação.

## Comportamento proposto

- Exibir “Ver detalhes” em cada registro desktop/mobile, mantendo a rota da consulta individual.
- Exibir “Marcar como Pago” em registros não quitados, inclusive vencidos, nas abas onde aparecerem. O botão não aparece em registros pagos nem durante carregamento.
- Ao clicar, registrar a quitação gerencial com data efetiva fornecida pelo servidor, atualizar despesa e compromisso no mesmo processamento e preservar o histórico. Não executar pagamento bancário.
- Impedir cliques duplicados enquanto a operação estiver em andamento e tornar a operação idempotente na API: uma despesa já quitada conserva sua data efetiva original.
- Após sucesso, consultar novamente o recorte atual, atualizar totais e retirar o registro de Pendentes/Vencidas. Preservar filtros/ordenação e ajustar a página se a última linha da página deixar de existir.
- Em erro, informar falha e permitir tentativa manual, sem anunciar quitação sem resposta confirmada. Falha de rede com resultado incerto exige consultar o estado antes de repetir. Respostas de uma obra anterior não atualizam a obra atual. Sessão expirada segue o fluxo existente.
- Validar posse da obra/despesa, obra ativa e exclusão lógica na API. Não reenviar o DTO completo de edição para uma ação que modifica apenas a quitação.

## Plano proposto para especificação própria

1. Registrar no PRD a extensão da ação rápida para a listagem, identificar a Issue e preparar a spec da fatia vertical para aprovação do autor; manter a US05 original preservada.
2. TDD da quitação idempotente na API, com isolamento, exclusão lógica, data do servidor e preservação de histórico.
3. TDD do botão desktop/mobile, carregamento, erros, concorrência de contexto e atualização da listagem/totalizadores.
4. Executar validações e as duas revisões independentes, registrando pareceres antes do aceite de commit.

## Estado

O autor esclareceu: “Crie apenas o botão sem nenhuma ação. O resto será feito na task necessária”. Portanto, o recorte atual é apenas visual: botão desabilitado em registros pendentes, sem handler, chamada HTTP ou alteração financeira. A proposta funcional acima permanece para a tarefa futura; não é autorização para implementar quitação. A aprovação da spec e do plano próprios dessa funcionalidade é exigida por `.agents/rules/utf-rules.md` §1 e §3. A spec deve ser aprovada pelo próprio autor conforme §8.
