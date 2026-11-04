---
issue: 10
status: rascunho
---

# US08 — Painel de Alertas de Vencimento de Pagamentos

## O problema

O proprietário precisa identificar compromissos vencidos e próximos do vencimento na obra selecionada, evitando atrasos, e registrar a quitação com a data efetiva sem editar todos os dados da despesa.

## A história

**Como** proprietário com uma obra selecionada, **eu quero** visualizar no painel principal um resumo e a listagem das contas a pagar no horizonte de até 7 dias, podendo marcá-las como pagas com registro da data, **para que** eu evite juros e atrasos na obra.

Fonte: US08 do `docs/prd.md`, Issue #10. Regras associadas: RN01, RN04 e RN07. A ação de quitação também fica disponível em Contas a Pagar.

## Critérios de aceite

- [ ] **CA1 — Resumo e urgência:** Dada uma obra selecionada com despesas ativas pendentes, quando a Home carrega, então exibe no topo o banner “Você tem X contas totalizando R$ Y a vencer nos próximos 7 dias” e a lista correspondente. O conjunto inclui todas as vencidas e as que vencem até hoje + 7 dias, inclusive; X e Y usam exatamente esse conjunto. A lista ordena por vencimento crescente, com desempate estável por identificador, e mostra descrição, vencimento e valor. Vencidas são vermelhas; de hoje até hoje + 3 dias, amarelas; de hoje + 4 até hoje + 7, neutras. Rótulos textuais identificam a urgência sem depender apenas da cor. A API define uma única data de referência por consulta, com Clock injetado e a convenção UTC existente.
- [ ] **CA2 — Fora do horizonte e vazio:** Dadas contas pagas, vencimentos posteriores a hoje + 7 ou registros sem vencimento, quando a Home consulta os alertas, então não entram na lista nem no banner. Sem resultados, exibe mensagem positiva de ausência de pagamentos pendentes no período; contas futuras permanecem consultáveis em Contas a Pagar.
- [ ] **CA3 — Modal nas duas telas:** Dada uma conta pendente na Home ou em Contas a Pagar, quando o proprietário aciona “Marcar como Pago”, então abre o mesmo modal com identificação da conta, valor, campo obrigatório de data efetiva e ações Confirmar/Cancelar. O campo inicia com hoje, permanece editável e exige data igual ou posterior à data da despesa, aceitando datas futuras. Se hoje anteceder a despesa, a sugestão inicial é a data da despesa. Campo vazio, data inválida ou anterior à despesa impedem envio com mensagem junto ao campo; a API também rejeita entradas inválidas com 400 sem alteração financeira. A ação só aparece habilitada para pendentes.
- [ ] **CA4 — Quitação atômica e idempotente:** Dada uma confirmação válida, quando a API processa a ação, então altera atomicamente o compromisso para PAID e a despesa para quitada, preservando vencimento e histórico. Registra a data fornecida, inclusive futura, e o status passa imediatamente a Pago. A entrada é uma data civil ISO (yyyy-MM-dd); a persistência no paid_at existente usa início do dia UTC e a apresentação conserva a data civil, sem deslocamento por fuso do navegador. Repetições, inclusive concorrentes, não duplicam registros nem alteram a primeira data persistida e retornam o estado quitado. Autoriza o recurso antes de tratar a repetição; a validação da data se aplica à transição pendente → paga. Não altera valor, categoria, fornecedor, comprovante ou teto orçado.
- [ ] **CA5 — Atualização após sucesso:** Dada quitação confirmada, quando a tela recebe sucesso, então fecha o modal e atualiza seus dados pela API. Na Home, retira a conta dos alertas e recalcula quantidade/total; em Contas a Pagar, preserva filtros e ordenação, atualiza totais e paginação e remove a conta das abas Pendentes/Vencidas, mostrando-a como paga em Todas/Pagas quando corresponder aos filtros. Se a última linha sair da página, ajusta a página para uma existente. Falha ao recarregar após quitação confirmada informa que a quitação ocorreu, mas a atualização da consulta falhou, e oferece nova consulta.
- [ ] **CA6 — Isolamento e exclusão lógica:** Dada consulta ou quitação em obra/despesa inexistente, de terceiro ou excluída logicamente, quando processada, então retorna 404 sem expor dados ou gravar. Pagamentos excluídos também não entram nos alertas nem podem ser quitados pela ação. Toda consulta restringe proprietário e obra. Despesas excluídas não entram nos resumos ou listas.
- [ ] **CA7 — Cancelamento e envio:** Dado um modal ainda não enviado, quando o usuário cancela, usa X ou Escape, então fecha sem gravar; o backdrop não fecha. Durante envio, bloqueia nova confirmação e fechamento até a resposta ou falha de comunicação. Cancelar e reabrir descarta a data não salva; não há persistência de rascunho.
- [ ] **CA8 — Falha e resultado incerto:** Dada falha na consulta, então mostra erro distinto de lista vazia e permite tentar novamente. Dada falha no envio, então não anuncia quitação sem confirmação, mantém os dados do modal no mesmo contexto e oferece consulta de estado antes de nova tentativa manual. Resposta perdida não dispara reenvio automático; se a consulta confirmar Pago, preserva sua data e atualiza a tela; se confirmar pendente, libera nova tentativa; se a consulta falhar, mantém a recuperação por consulta disponível. Nenhum estado de carregamento permanece indefinidamente após erro ou timeout.
- [ ] **CA9 — Contexto e sessão:** Dada troca de obra durante consulta/modal/envio, quando chega uma resposta anterior, então não altera a obra atual nem reabre o modal. A troca invalida o modal e os dados anteriores, inclusive no percurso A → B → A; uma operação enviada pode terminar no servidor para a obra original, sendo seu estado obtido ao consultá-la novamente. Sem obra selecionada, não envia consultas nem permite quitação. Em 401, preserva o fluxo existente de logout, limpeza da obra e login; não restaura nem reenvia a intenção após autenticar. Fechar a aba após envio não desfaz eventual commit; novo acesso consulta o estado persistido.

## Fora de escopo

- Pagamento bancário, parcelamento, pagamento parcial, agendamento de execução e integração financeira externa.
- Notificações push, SMS ou e-mail, horizonte configurável e alertas de outras obras.
- Alterar a primeira data de quitação pela ação rápida, reabrir pagamento por essa ação ou mudar o fluxo de edição completa da US04.
- Gestão de fornecedores da US15, redesign geral da Home, novos gráficos e novas regras de orçamento.
- Filas, processamento offline e restauração de modal após fechar a aba ou expirar a sessão.

## Abandono no meio

Antes do envio, cancelar não grava e descarta o preenchimento. Depois do envio, fechar a aba ou perder a conexão não permite inferir se houve commit: uma consulta posterior reconcilia o estado, sem reenvio automático. O modal bloqueia repetição durante o processamento; a API protege a primeira quitação mesmo diante de concorrência. Trocar de obra encerra o contexto local sem prometer cancelar a transação já enviada. Sessão expirada segue a autenticação existente e exige retorno manual. Esses comportamentos são verificáveis por CA7, CA8 e CA9.

## Assume que

Nenhuma funcionalidade desta história depende de substituto ou dado fixo. Alertas e quitação serão entregues de ponta a ponta em `apps/api` e `apps/web`.

| Premissa | Issue que fecha |
| --- | --- |
| Nenhuma. | Não se aplica. |

## Depende de

- US14 / Issue #27: seleção de obra e isolamento por proprietário.
- US03 / Issue #5: despesas a prazo e compromissos pendentes.
- US04 / Issue #6: status de pagamento e histórico de quitação existentes.
- US05 / Issue #7: listagem, abas, filtros e botão visual em Contas a Pagar.

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
