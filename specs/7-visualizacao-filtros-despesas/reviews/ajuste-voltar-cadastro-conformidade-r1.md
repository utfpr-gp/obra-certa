# Parecer de Conformidade — Tarefa ajuste-voltar-cadastro R1

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Pedido autorizado: “Voltar” no cabeçalho de `/contas/nova`, retornando à listagem `/contas` | atendido | `expense-form.component.html:10`; `accounts-navigation.spec.ts:23` |
| CA9: sem obra ativa, retorno não consulta despesas | atendido | `accounts-navigation.spec.ts:23` |
| CA10: abandonar formulário válido sem salvar; retorno consulta novamente a listagem | atendido | `accounts-navigation.spec.ts:55` |
| Disponível durante carregamento e fora do formulário | atendido | `expense-form.component.html:10`; `accounts-navigation.spec.ts:35` |
| CA11: estilo compacto do DS, altura de 44px e cabeçalho adaptável | atendido | `expense-form.component.html:2`, `expense-form.component.html:10`; capturas desktop/mobile indicadas na validação |
| CA1: preservar acesso ao cadastro pela listagem | atendido | `accounts-navigation.spec.ts:89` |
| Cancelamento existente e regras financeiras | fora da alteração | Patch limitado ao cabeçalho e testes de navegação |

Conferidos o patch delimitado, as capturas e os logs finais: RED com **2 FAILED, 5 SUCCESS**, GREEN com **390 SUCCESS** e build concluído. Permanece o aviso preexistente do orçamento do bundle, agora com 713,48kB.

## Apontamentos
