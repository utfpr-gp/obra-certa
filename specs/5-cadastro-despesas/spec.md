---
issue: 5
status: rascunho
---

# US03 — Cadastro de Despesas

## O problema

O proprietário já consegue selecionar uma obra e acompanhar os tetos por categoria, mas ainda não consegue lançar seus gastos reais pelo produto. Sem cadastro de despesas, compromissos a prazo e comprovantes, o acompanhamento financeiro depende de dados de demonstração e não representa os custos da obra.

## A história

**Como** proprietário com uma obra selecionada, **eu quero** cadastrar despesas por categoria pré-definida com cálculo de valores, controle de quitação e anexo de comprovante, **para que** eu mantenha a gestão financeira fiel ao realizado e ao planejado.

## Critérios de aceite

- [ ] **CA1 — Cadastro de despesa quitada:** Dado um proprietário autenticado com uma obra sua selecionada, quando informa descrição, data (passada, presente ou futura), categoria pré-definida, fornecedor e pagamento quitado, usando quantidade e valor unitário positivos ou um valor total positivo informado diretamente, então a despesa é salva naquela obra e o gasto acumulado da categoria passa a incluí-la. No modo calculado, o formulário apresenta o total automaticamente e o servidor verifica o cálculo.
- [ ] **CA2 — Pagamento pendente:** Dado um lançamento válido não quitado, quando informa vencimento igual ou posterior à data da despesa e salva, então despesa e pagamento pendente vinculado são gravados atomicamente, sem pagamento órfão nem despesa parcialmente criada.
- [ ] **CA3 — Comprovante válido:** Dado que o formulário informa os formatos JPEG, PNG e PDF e o limite de 10 MB, quando um arquivo válido é selecionado e enviado, então a interface apresenta progresso de envio e o comprovante fica associado à despesa para consulta posterior pelo proprietário.
- [ ] **CA4 — Categoria sem teto:** Dada uma categoria sem orçamento ativo ou com teto zerado, quando ela é selecionada, então o formulário exibe aviso inline não bloqueante e atalho para definir seu orçamento. O lançamento permanece permitido, sem obrigar o proprietário a criar um teto positivo.
- [ ] **CA5 — Teto atingido ou ultrapassado:** Dado que o novo gasto leva o consumo da categoria a pelo menos 100% de um teto positivo, quando a despesa é salva, então o salvamento é concluído e a interface exibe alerta visual para revisão do orçamento. Os totais consideram despesas ativas pagas e pendentes, conforme a US07.
- [ ] **CA6 — Falha no envio, tag e reenvio posterior:** Dada uma despesa válida com comprovante selecionado, quando o envio do arquivo falha por erro de rede, timeout ou indisponibilidade do armazenamento, então a despesa e seu eventual pagamento pendente permanecem salvos e a tela informa: “Despesa salva, mas o comprovante não foi enviado. Você pode tentar novamente.” A própria despesa exibe a tag **“Sem comprovante”** enquanto não possuir um comprovante enviado com sucesso, inclusive quando nenhum arquivo tiver sido selecionado originalmente. A ausência de comprovante e o estado de envio pendente após falha persistem no servidor. Ao acessar novamente a despesa, inclusive após fechar a página e entrar de novo, o proprietário vê a tag e pode selecionar o arquivo novamente para reenviar. O reenvio atua sobre a mesma despesa, sem novo gasto ou pagamento; o sucesso remove a tag e a pendência. Nova falha mantém a tag, a pendência e o alerta. O arquivo não precisa ser preservado pelo navegador após fechar a página. Não há seção separada de comprovantes pendentes.
- [ ] **CA7 — Isolamento por proprietário:** Dada uma obra, despesa ou fornecedor de outro usuário, quando alguém tenta cadastrar, consultar a despesa, consultar seu comprovante ou reenviá-lo usando esses identificadores, então a operação é recusada como recurso não encontrado, sem expor dados nem gravar vínculos alheios. Obras e despesas excluídas logicamente não podem receber novos lançamentos ou comprovantes.
- [ ] **CA8 — Arquivo inválido:** Dado um arquivo diferente de JPEG, PNG ou PDF, ou acima de 10 MB, quando é selecionado, então o formulário rejeita o anexo e informa os formatos e o tamanho aceitos. A API também valida o arquivo se chamada diretamente. Um anexo inválido não pode ser apresentado como enviado.
- [ ] **CA9 — Vencimento inconsistente:** Dada uma despesa não quitada com vencimento anterior à data da despesa, quando tenta salvar, então o formulário destaca o erro e a API recusa a gravação, sem persistência parcial.
- [ ] **CA10 — Campos e valores inválidos:** Dado que descrição, categoria, fornecedor ou data estão ausentes, ou os valores exigidos pelo modo escolhido são menores ou iguais a zero, quando tenta salvar, então o formulário destaca os campos inválidos e a API também impede a gravação. O modo de valor direto não exige quantidade e valor unitário; o modo calculado exige ambos. O proprietário pode selecionar um fornecedor seu existente ou cadastrar um novo no próprio fluxo, informando nome e CNPJ.
- [ ] **CA11 — Cancelamento e troca de obra:** Dado um formulário ainda não enviado, quando o proprietário cancela ou fecha a página, então nenhuma despesa é criada. Ao trocar de obra, os dados da obra anterior não são enviados para a nova nem aparecem nela por resposta atrasada. Sem obra selecionada, o cadastro orienta a selecionar ou cadastrar uma obra.
- [ ] **CA12 — Falha no salvamento e envio repetido:** Dado um formulário preenchido, quando há erro de rede, timeout ou erro do servidor no salvamento dos dados, então a tela mantém os campos enquanto estiver aberta, informa a falha e permite nova tentativa. Durante o envio, a ação de salvar permanece desabilitada. Uma resposta perdida não deve ser apresentada como confirmação de que a despesa não foi criada. Cada tentativa de criação recebe uma identificação estável, isolada por usuário e obra: repetir o mesmo lançamento com essa identificação recupera o resultado original, sem criar outra despesa, fornecedor inline ou pagamento e sem somar o gasto novamente. A identificação é preservada na recuperação após login. Reutilizá-la com dados diferentes resulta em conflito, sem sobrescrever a despesa já criada. Um novo lançamento intencional recebe outra identificação.
- [ ] **CA13 — Sessão expirada e recuperação dos campos:** Dado um formulário de despesa preenchido, quando a sessão expira e a API responde 401, então o fluxo existente encerra a sessão e direciona para o login, preservando temporariamente os campos do lançamento para recuperação. Após autenticar novamente com a mesma conta e retornar à mesma obra, o proprietário recupera os campos e pode conferir e enviar o formulário, sem salvamento automático. Se havia comprovante selecionado, a tela pede que o arquivo seja selecionado novamente. Outra conta não recebe os dados do rascunho, e a recuperação não transfere o lançamento para uma obra diferente. Recuperar um formulário cujo envio teve resultado incerto segue a política de CA12, sem assumir que ele ainda não foi gravado.

## Fora de escopo

- Edição geral, exclusão e reclassificação de despesas (US04). A consulta da despesa e o reenvio de comprovante pendente necessários ao CA6 fazem parte desta história.
- Listagem completa com paginação, filtros e totalizadores de despesas (US05). Esta história entrega a consulta individual da despesa, acessível após salvar e por seu endereço direto, com a tag e a ação de reenvio. A futura listagem poderá reutilizar o estado de comprovante retornado pela API.
- Seção ou painel separado de comprovantes pendentes: o autor optou pela tag na própria despesa.
- Importação por XML ou chave de NF-e (US09), relatórios e exportações (US06).
- Painel de alertas de vencimento e baixa posterior de pagamentos (US08). Esta história cria o compromisso pendente.
- Gestão completa de fornecedores além da seleção e criação necessárias ao lançamento.
- Substituição e remoção de comprovante já enviado com sucesso, envio automático em segundo plano e armazenamento do arquivo no navegador após fechar a página.

## Abandono no meio

- **Falha do comprovante:** decisão confirmada pelo autor: salvar a despesa, mostrar alerta e manter uma pendência recuperável ao acessar a despesa posteriormente, identificada pela tag “Sem comprovante” na própria despesa. Não criar seção de pendências. Após fechar a página, o proprietário seleciona novamente o arquivo. O reenvio não repete a criação financeira (CA6).
- **Cancelamento ou fechamento antes do envio:** não criar despesa; não há restauração de rascunho aprovada (CA11).
- **Troca de obra durante o formulário ou uma requisição:** preservar o isolamento do contexto e impedir que a resposta antiga contamine a obra atual (CA11).
- **Falha no salvamento dos dados:** preservar os campos na tela aberta e permitir recuperação sem afirmar que uma resposta perdida significa ausência de gravação. A identificação estável da tentativa permite recuperar o resultado de uma criação confirmada no servidor cuja resposta se perdeu, sem duplicar despesa, fornecedor inline ou pagamento (CA12).
- **Sessão expirada:** decisão confirmada pelo autor: manter o redirecionamento para login e recuperar os campos após autenticar novamente. O arquivo precisa ser selecionado outra vez. A recuperação respeita a conta e a obra originais e não submete o formulário automaticamente (CA13). Esta decisão resolve, para a US03, a divergência com a reautenticação dentro do formulário descrita em design-tokens e user-flows; esses documentos deverão ser alinhados no fechamento da história.

## Assume que

| Premissa | Issue que fecha |
| --- | --- |

## Depende de

- US14 (Issue #27): autenticação, gestão e seleção da obra ativa.
- US07 (Issue #9): categorias pré-definidas, tetos e agregação de gastos, presentes na base local `feature/09-gestao-orcamento`, escolhida explicitamente pelo autor para esta branch.
- A referência local `TODO #5` em `DemoDataSeederService` identifica o cadastro de despesas como Issue #5. O vínculo ainda não foi conferido no GitHub por falta de acesso; o autor autorizou iniciar localmente.

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
