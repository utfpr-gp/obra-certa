---
issue: 6
status: aprovada
---

# US04 — Edição e Exclusão de Despesas

## O problema

O proprietário já consegue cadastrar e consultar despesas, mas não consegue corrigir seus dados, alterar sua situação de pagamento, substituir um comprovante confirmado nem excluir um lançamento cancelado. Os gastos permanecem no orçamento mesmo quando o registro precisa ser corrigido ou retirado, e o histórico financeiro não acompanha essas mudanças.

## A história

**Como** proprietário com uma obra selecionada, **eu quero** editar ou excluir despesas registradas da minha obra, **para que** eu possa corrigir divergências, gerenciar status de pagamento ou remover despesas canceladas preservando a integridade dos orçamentos.

Fonte: [PRD — US04](../../docs/prd.md), [Issue #6](https://github.com/utfpr-gp/obra-certa/issues/6). A Issue foi lida no navegador autenticado e aponta para os critérios do PRD.

## Critérios de aceite

- [ ] **CA1 — Edição e obra imutável:** Dada uma despesa ativa da obra selecionada do proprietário autenticado, quando ele abre a ação de edição na consulta individual, então o formulário apresenta os valores existentes e permite corrigir descrição, data, categoria e valores. Ao salvar dados válidos, atualiza a mesma despesa, sem criar outro lançamento. A obra de origem permanece imutável tanto na tela quanto na API.
- [ ] **CA2 — Recálculo e alertas:** Dada uma despesa cujo valor ou categoria foi alterado, quando o salvamento é concluído, então os agregados refletem os novos dados, inclusive retirando o gasto da categoria anterior e incluindo-o na nova quando houver reclassificação. Se a categoria de destino atingir ou ultrapassar 100% de um teto positivo, a edição é concluída e a tela exibe alerta visual de orçamento estourado. A edição não aumenta o teto automaticamente.
- [ ] **CA3 — Situação de pagamento e histórico:** Dada uma despesa ativa, quando passa de paga para pendente, então exige vencimento igual ou posterior à data da despesa e passa a representar um pagamento futuro no vencimento informado. Reutiliza o registro de pagamento existente; cria um somente quando a despesa ainda não possui nenhum, sem duplicar compromissos nem criar ciclos separados de quitação. Quando passa de pendente para paga, registra a quitação e sua data, preservando o registro como pagamento quitado. A alteração da despesa e do pagamento é atômica. Voltar a pendente não cria nova despesa nem altera o total gasto por si só; muda a situação do pagamento e seu vencimento.
- [ ] **CA4 — Remoção de comprovante:** Dada uma despesa ativa própria com comprovante enviado, quando o proprietário solicita sua remoção, então a aplicação solicita primeiro a exclusão física do arquivo no armazenamento, sem exclusão lógica nem retenção de versões. Após confirmar a exclusão, retira os metadados do anexo e a consulta passa a exibir “Sem comprovante”. Arquivo já ausente é tratado como removido. Se o armazenamento falhar, a aplicação mantém o vínculo, informa o erro e permite nova tentativa manual; não registra trabalho de limpeza nem executa repetição automática para esta operação. Se o arquivo for apagado, mas a atualização no banco falhar, não anuncia sucesso; uma nova tentativa manual reconhece o arquivo ausente e conclui a retirada do vínculo. A despesa, os pagamentos e os valores financeiros são preservados. Simplificação da remoção isolada aprovada pelo autor em 31/10/2026; CA5 e CA6 mantêm suas regras.
- [ ] **CA5 — Substituição de comprovante:** Dada uma despesa ativa própria com comprovante enviado, quando o proprietário envia um novo arquivo JPEG, PNG ou PDF, não vazio e de até 10 MiB (10 × 1024 × 1024 bytes, apresentado como 10 MB), então o novo comprovante só substitui o atual depois de seu envio confirmado e de sua associação à despesa. Somente depois disso a aplicação solicita a exclusão física do antigo, sem exclusão lógica nem retenção intencional de versões. Arquivo inválido ou falha no envio do novo preservam o comprovante atual. Se apenas a exclusão do antigo falhar, o novo confirmado permanece disponível, o antigo deixa de ser oferecido pela aplicação e a resposta informa a falha de exclusão, sem afirmar que o arquivo foi apagado. Não há fila, registro de trabalho, agendamento ou garantia de recuperação automática. Falha na associação mantém o antigo e permite uma tentativa imediata de apagar o novo sem vínculo; falha dessa tentativa também deve ser informada, sem promessa de recuperação posterior.
- [ ] **CA6 — Exclusão com confirmação:** Dada uma despesa ativa própria, quando o proprietário aciona “Excluir”, então a tela pede confirmação; somente confirmar envia a solicitação. O sucesso aplica exclusão lógica à despesa, inativa pagamentos vinculados e retira seu valor dos agregados ativos de orçamento, preservando os registros no banco e o teto planejado da categoria. A despesa excluída não pode mais ser editada nem ter seu comprovante consultado ou alterado. Após confirmar a exclusão no banco, a aplicação solicita a remoção física do comprovante, quando houver, mas sua falha não impede nem desfaz a exclusão lógica. A resposta distingue a exclusão financeira concluída da falha em apagar o arquivo, sem exigir nova exclusão da despesa nem prometer limpeza posterior. Não há registro de trabalho nem agendamento de limpeza. Uma falha ao gravar a própria exclusão no banco não pode ser apresentada como sucesso.
- [ ] **CA7 — Cancelamento e duplo envio:** Dado um formulário de edição ou diálogo de exclusão aberto, quando o proprietário cancela, fecha pelo X ou usa Escape antes de enviar, então nenhuma alteração é solicitada. Durante o envio, a ação de confirmação fica desabilitada e uma submissão repetida não gera outra requisição. O comportamento de clique fora do formulário/diálogo será detalhado no planejamento, preservando o padrão dos componentes compartilhados existentes.
- [ ] **CA8 — Sessão expirada:** Dada uma sessão expirada, quando o proprietário tenta editar, excluir ou alterar um comprovante, então a API retorna 401 antes de mudar dados ou arquivos, e o tratamento de autenticação existente encerra a sessão e leva ao login. Após autenticar, o usuário volta manualmente à despesa e solicita a operação novamente. Não há modal de autenticação inline, preservação da intenção de exclusão nem reenvio automático. A decisão confirmada pelo autor para a exclusão também mantém o tratamento de autenticação já existente nas demais operações.
- [ ] **CA9 — Isolamento e validações:** Dada uma despesa alheia, inexistente, excluída ou de obra excluída, quando uma operação de edição, exclusão ou comprovante é solicitada, então a API retorna 404 sem alterar registros nem acessar arquivos de terceiros. Descrição e categoria são obrigatórias, valores devem ser positivos e respeitar os limites do cadastro, e vencimento pendente não pode ser anterior à data da despesa. Entradas inválidas são recusadas sem gravação parcial, e a tela destaca os campos para correção.
- [ ] **CA10 — Troca de obra e falhas:** Dada uma edição ou exclusão em andamento na tela, quando a obra ativa muda, então a interface abandona o contexto anterior e não aplica respostas atrasadas à obra atual, inclusive em uma sequência A → B → A. Sem obra ativa, orienta a seleção. Antes do envio, abandonar o formulário não grava nada; uma operação já recebida pelo servidor pode concluir na obra original. Erros de conexão ou servidor apresentam mensagem e permitem conferir o estado e tentar novamente, sem anúncio de sucesso não confirmado. Na edição, os campos permanecem enquanto o formulário continua aberto e o contexto é o mesmo; não há recuperação de rascunho após fechar a página ou fazer login novamente.

## Fora de escopo

- Catálogo global, validação, pesquisa por CNPJ e gestão de fornecedores da US15. Os cadastros de fornecedor existentes continuam sob o contrato atual da US03 nesta entrega; sua edição ou compartilhamento não fazem parte da US04.
- Listagem completa, filtros, ordenação e totalizadores da US05. O acesso inicial às ações será pela consulta individual da despesa já disponível na US03.
- Transferência de despesa para outra obra, exclusão em lote, restauração de exclusões e lançamento de novas despesas.
- Painel de contas a pagar e sua navegação futura; relatórios e importação de NF-e.
- Reautenticação inline, retorno automático à operação, reenvio após login e recuperação persistente de rascunhos.
- Histórico de alterações de descrição, valor e categoria. A preservação do histórico financeiro de pagamentos exigida pelo CA3 permanece no escopo.
- Infraestrutura de recuperação de exclusões de arquivos: tabela de trabalhos, fila, agendamento e repetição automática. Sua implementação foi descartada pelo autor, inclusive na Tarefa 4; uma falha na tentativa imediata pode deixar um objeto no armazenamento, sem garantia de remoção posterior nesta entrega.

## Abandono no meio

- **Cancelar antes de enviar:** fecha a edição ou a confirmação sem solicitar gravação ou exclusão (CA7).
- **Trocar a obra ativa:** abandona o contexto anterior e ignora respostas atrasadas; não promete cancelar uma operação já recebida pelo servidor (CA10).
- **Clique repetido:** bloqueia nova submissão enquanto a requisição está em andamento (CA7).
- **Sessão expirada:** redireciona ao login; o proprietário deve retornar à página e repetir a ação manualmente (CA8).
- **Falha de conexão ou resposta perdida:** informa que o resultado não foi confirmado; permite consultar o estado atual antes de tentar novamente. Fechar a aba não desfaz uma operação já processada (CA10).
- **Falha no armazenamento durante exclusão:** a exclusão lógica da despesa e a inativação dos pagamentos concluem independentemente da remoção do comprovante. A aplicação informa a exclusão financeira concluída e a falha em apagar o arquivo, sem reativar a despesa nem permitir acesso ao arquivo por ela (CA6). Não registra limpeza nem promete execução posterior. Essa tolerância à falha do armazenamento não se aplica à falha de persistência dos dados financeiros.
- **Falha durante remoção isolada de comprovante:** erro no armazenamento mantém o vínculo e permite nova tentativa manual. Se apenas a atualização no banco falhar depois da exclusão física, a resposta informa falha sem prometer restauração do arquivo; nova tentativa aceita o objeto já ausente e retira o vínculo. Não há pendência durável nem agendamento para a remoção isolada (CA4).
- **Falha no armazenamento durante substituição de comprovante:** o antigo permanece consultável até o envio e a associação do novo serem confirmados; depois disso, somente o novo fica disponível pela aplicação. Falha ao apagar o antigo mantém o novo confirmado e é informada na resposta, sem anunciar exclusão do arquivo nem registrar trabalho para depois. Falha na associação preserva o antigo e permite uma tentativa imediata de apagar o novo sem vínculo; não há recuperação durável de objetos que não puderem ser apagados (CA5).

## Assume que

| Premissa | Issue que fecha |
| --- | --- |

Não há substitutos novos: a consulta individual da despesa e o armazenamento privado já existem. A US04 não depende da entrega do catálogo global de fornecedores nem de uma nova tela de listagem para ser demonstrada.

## Depende de

- US03 / Issue #5 — cadastro, consulta individual da despesa, informação de quitação, pagamento pendente e comprovantes privados.
- US07 / Issue #9 — agregados de orçamento e alertas de consumo, já utilizados pela consulta individual.
- US14 / Issue #27 — autenticação, posse e seleção de obra.

## Dúvidas em aberto

| # | Dúvida | Quem responde |
| --- | --- | --- |
