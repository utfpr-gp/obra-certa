# Revisão do critério de testes — Tarefa 5

Em 04/11/2026, após a proposta de permitir eventos DOM nos controles visíveis em vez de adicionar harness e dependências, o autor solicitou: “Revise a tarefa 5”.

## Critério revisado

- Permitir eventos DOM sintéticos `input`, `change` e `toggle` despachados nos elementos reais do template, exercitando os bindings Angular. Não são eventos de interação física do usuário.
- Manter proibidas chamadas diretas a handlers ou métodos internos, inclusive `selectTab`, `selectSort` e `loadPage`, eventos passados diretamente a esses métodos e casts que contornem os contratos de eventos.
- Exercitar abas e paginação pelos controles visíveis; verificar requisições e resultados observáveis da interface.
- Usar Jasmine/Karma já existentes, sem harness ou dependências adicionais.

## Justificativa

O comportamento informado de `option.click()` no ChromeHeadless não produziu o `change` necessário. Despachar o evento no controle permite verificar o binding sem chamar o handler diretamente e sem exigir nova infraestrutura de testes.

## Limites desta revisão

O plano foi atualizado apenas na Tarefa 5. Os pareceres originais e a decisão da primeira rodada permanecem preservados. Não houve alteração de código, execução de testes, novo parecer ou reinício de contadores. Esta autorização não revisa a decisão da Tarefa 4, não marca tarefas como concluídas e não autoriza commit.
