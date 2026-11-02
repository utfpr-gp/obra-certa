# 📄 Product Requirements Document (PRD) - ObraCerta!

**Projeto:** ObraCerta (Gestão Financeira de Obras Residenciais)  
**Status do Documento:** 🟢 Definido (Fase 0 - SDD)  
**Versão:** 2.0.0 (Alinhada ao Método UTF-SDD)

---

## 🎯 1. Visão Geral e Objetivo

- **Problema:** A gestão financeira de pequenas e médias obras residenciais autogeridas é comumente informal, levando à perda de previsibilidade orçamentária e elevado risco de paralisação da construção por falta ou descontrole de recursos.
- **Solução:** O *ObraCerta* centraliza a gestão multi-obra, o planejamento orçamentário por categorias, o registro de despesas, o acompanhamento preventivo de pagamentos pendentes por meio de painel de alertas e a importação facilitada de compras via arquivo XML e chave de acesso da Nota Fiscal Eletrônica (NF-e).
- **Critério de Sucesso:** O proprietário consegue, em uma única visão consolidada por obra, verificar o montante gasto versus o teto previsto por categoria, identificar compromissos financeiros a vencer nos próximos 7 dias e evitar estouros no orçamento geral da construção.

---

## 📖 2. Glossário Ubíquo

| Termo do Negócio | Significado no Negócio | Não confundir com |
| :--- | :--- | :--- |
| **Usuário (Proprietário)** | Pessoa responsável pela gestão da sua própria obra na plataforma. | Não confundir com *Fornecedor*. |
| **Obra (Projeto)** | Construção ou reforma individual gerenciada pelo proprietário (ex: "Construção Casa Praia"). Agrupa seus próprios orçamentos e despesas. | Não confundir com *Categoria de Despesa*. |
| **Categoria de Despesa** | Agrupamento orçamentário temático pré-definido da obra (ex: Fundação, Alvenaria, Elétrica, Pintura, Mão de Obra). | Não confundir com *Tipo de Despesa*. |
| **Fornecedor** | Pessoa física ou jurídica prestadora de serviços ou vendedora de materiais para a obra. | Não confundir com *Usuário (Proprietário)*. |
| **Orçamento Previsto** | Teto financeiro estimado e planejado para uma categoria específica dentro de uma obra. | Não confundir com *Despesa Realizada* nem com *Cotação de Preços*. |
| **Despesa (Gasto Real)** | Registro financeiro efetivo de um custo incorrido na obra, com valor, data e comprovante opcional. | Não confundir com *Orçamento Previsto* nem com *Pagamento Pendente*. |
| **Pagamento Pendente** | Compromisso financeiro oriundo de uma despesa a prazo (não liquidada no ato), com data futura de vencimento. | Não confundir com *Despesa Paga (liquidada)*. |
| **Alerta de Vencimento** | Sinalização visual passiva no painel sobre contas a pagar próximas do prazo de vencimento. | Não confundir com *Mensagem de validação de formulário* nem com *Notificação externa ativa (SMS/Push)*. |
| **Nota Fiscal Eletrônica (NF-e)** | Documento fiscal digital oficial cuja chave de 44 dígitos ou arquivo XML permite extrair fornecedor e itens da compra. | Não confundir com *Recibo informal* ou foto avulsa de comprovante. |

---

## 👤 3. Atores e Permissões

| Ator | Descrição | O que PODE fazer | O que NÃO PODE fazer |
| :--- | :--- | :--- | :--- |
| **Visitante** | Pessoa não identificada no sistema. | - Visualizar a página institucional de apresentação.<br>- Realizar seu autocadastro.<br>- Acessar a tela de login. | - Visualizar, cadastrar ou alterar qualquer dado de obra, despesa ou orçamento.<br>- Acessar áreas logadas sem autenticação. |
| **Proprietário (Usuário)** | Gestor autenticado da sua própria conta e obras. | - Cadastrar, editar e excluir suas próprias obras.<br>- Alternar entre suas obras ativas.<br>- Gerenciar orçamentos, despesas e fornecedores de suas obras.<br>- Marcar pagamentos como quitados.<br>- Importar despesas via XML/chave de NF-e.<br>- Visualizar relatórios e gráficos de suas obras. | - Visualizar, editar ou excluir obras, despesas ou orçamentos de outros proprietários.<br>- Transferir despesas entre obras diferentes durante a edição.<br>- Acessar painéis de administração global. |
| **Sistema (Automático)** | Rotinas internas e regras de negócio do sistema. | - Calcular saldos orçamentários e percentuais de consumo.<br>- Sinalizar alertas visuais de vencimento e estouro de teto orçado.<br>- Realizar leitura e extração de dados fiscais de NF-e. | - Tomar decisões financeiras ou excluir despesas sem comando explícito do proprietário. |

---

## 📝 4. User Stories

> **Convenção de Status SDD:**  
> 🟢 **Live** — Implementada, testada e funcionando no sistema.  
> 🟡 **Ready** — Regras e critérios definidos pelo autor, pronta para virar Issue.  
> ⚪ **Draft** — Rascunho / especificação aguardando promoção pelo autor.  
> *Nota:* Toda nova história nasce como `Draft` e só o autor a promove a `Ready`.

---

### 🟢 US01 — Cadastro de Usuário
- **Ator:** Visitante  
- **Prioridade:** Must Have  
- **Tamanho:** S  
- **Status:** 🟢 Live  
- **História:** Como visitante, quero criar uma conta informando meus dados básicos, para que eu possa gerenciar minhas obras com segurança.
- **Regras de Negócio Associadas:** RN01

**Critérios de Aceitação:**
1. **Caminho Feliz (Cadastro com sucesso):**
   - **Dado** que o visitante preenche nome completo (mínimo de 3 caracteres), e-mail válido, senha com pelo menos 6 caracteres e confirmação de senha idêntica,
   - **Quando** solicita a criação da conta,
   - **Então** o sistema cria o usuário, protege a senha com criptografia unidirecional segura e o direciona para a tela de login.
2. **Caminho Triste (E-mail já cadastrado):**
   - **Dado** que o visitante informa um e-mail que já existe na base,
   - **Quando** submete o cadastro,
   - **Então** o sistema recusa o cadastro e exibe mensagem informando que o e-mail já está em uso.
3. **Caminho Triste (Dados inválidos ou confirmação divergente):**
   - **Dado** que o formulário é submetido com campos obrigatórios vazios, senha menor que 6 caracteres ou senha divergente da confirmação,
   - **Quando** tenta cadastrar,
   - **Então** o sistema impede a gravação e destaca as pendências de validação.

---

### 🟢 US02 — Autenticação (Login e Logout)
- **Ator:** Proprietário  
- **Prioridade:** Must Have  
- **Tamanho:** S  
- **Status:** 🟢 Live  
- **História:** Como proprietário cadastrado, quero me autenticar com e-mail e senha e poder encerrar minha sessão, para acessar meus dados com segurança e proteger minha conta.
- **Regras de Negócio Associadas:** RN01

**Critérios de Aceitação:**
1. **Caminho Feliz (Login com sucesso):**
   - **Dado** que o usuário informa e-mail e senha previamente cadastrados e corretos,
   - **Quando** solicita o acesso,
   - **Então** o sistema valida as credenciais, inicia uma sessão segura e direciona o usuário para a área restrita de gestão.
2. **Caminho Triste (Credenciais inválidas):**
   - **Dado** que o usuário informa e-mail inexistente ou senha incorreta,
   - **Quando** solicita o acesso,
   - **Então** o sistema recusa a entrada e exibe mensagem genérica de erro ("Credenciais inválidas"), sem revelar qual campo falhou.
3. **Caminho Feliz (Logout):**
   - **Dado** que o usuário está autenticado,
   - **Quando** clica na opção de logout,
   - **Então** o sistema encerra a sessão ativa, limpa as credenciais locais e o direciona para a tela pública de login.
4. **Caminho Triste (Acesso não autorizado a rotas restritas):**
   - **Dado** que um visitante não autenticado tenta acessar diretamente qualquer tela protegida,
   - **Quando** navega para a rota,
   - **Então** o sistema bloqueia o acesso e o redireciona imediatamente para a tela de login.

---

### 🟢 US03 — Cadastro de Despesas
- **Ator:** Proprietário  
- **Prioridade:** Must Have  
- **Tamanho:** M  
- **Status:** 🟢 Live
- **Dependências:** US14 (Obra ativa selecionada); US07 (categorias, tetos e agregação de gastos)
- **Rastreabilidade:** Referência local #5; [spec e plano](../specs/5-cadastro-despesas/). Entrega até a tarefa 8 implementada e aprovada nas revisões por tarefa. Auditoria final e integração por PR pendentes; este status não indica implantação em produção. Por decisão do autor, idempotência da criação e recuperação após sessão expirada não integram esta entrega. O vínculo com a Issue remota ainda não foi confirmado.
- **História:** Como proprietário com uma obra selecionada, quero cadastrar despesas por categoria pré-definida com cálculo de valores, controle de quitação e anexo de comprovante, para manter a gestão financeira fiel ao realizado e ao planejado.
- **Regras de Negócio Associadas:** RN01, RN04, RN05, RN07

**Critérios de Aceitação:**
1. **Caminho Feliz (Despesa quitada por cálculo ou valor direto):**
   - **Dado** que o proprietário está na área de lançamento de uma obra de sua propriedade,
   - **Quando** informa descrição, data da despesa (presente, passada ou futura planejada), seleciona uma categoria pré-definida, seleciona um fornecedor existente ou cadastra um novo inline (nome obrigatório e CNPJ opcional, com máscara `00.000.000/0000-00` e validação de 14 dígitos quando preenchido), assinala como quitada e preenche:
     - ou `quantidade > 0` e `valor unitário > 0` (sistema calcula o total automaticamente);
     - ou `valor total > 0` diretamente;
   - **Então** o sistema grava a despesa associada à obra e atualiza o montante consumido da categoria correspondente.
2. **Caminho Feliz (Despesa a prazo com pagamento pendente):**
   - **Dado** que o proprietário lança uma despesa e seleciona a opção de pagamento não quitado (a prazo),
   - **Quando** informa a data de vencimento (igual ou posterior à data da despesa) e confirma,
   - **Então** o sistema grava a despesa e gera automaticamente um registro de pagamento pendente vinculado para controle de vencimento.
3. **Caminho Feliz (Anexo de comprovante válido):**
   - **Dado** que o formulário exibe a indicação dos formatos permitidos (JPEG, PNG e PDF até 10MB),
   - **Quando** o proprietário seleciona um arquivo válido dentro dessas regras,
   - **Então** o sistema apresenta progresso e envia o comprovante após confirmar a gravação financeira, disponibilizando-o ao proprietário pela consulta individual. A validação considera MIME declarado, extensão correspondente e tamanho de até 10 MiB (10 × 1024 × 1024 bytes), recusando arquivo vazio, sem inspeção do conteúdo interno.
4. **Caminho Feliz com Alerta (Despesa em categoria sem teto orçado):**
   - **Dado** que o proprietário seleciona uma categoria que não possui orçamento definido na obra,
   - **Quando** preenche os dados da despesa,
   - **Então** o sistema exibe um aviso inline não bloqueante informando que a categoria não possui teto orçado e exibe atalho direto para cadastrar o orçamento, permitindo salvar a despesa normalmente.
5. **Caminho Feliz com Alerta (Estouro de teto orçamentário):**
   - **Dado** que o lançamento da despesa faz com que o total gasto na categoria atinja ou ultrapasse 100% do teto orçado,
   - **Quando** a despesa é salva com sucesso,
   - **Então** o sistema conclui o salvamento e dispara um alerta visual informando que o orçamento da categoria estourou e precisa ser revisado.
6. **Caminho Alternativo (Upload de comprovante em rede instável):**
   - **Dado** que o envio do anexo sofre oscilação de sinal ou timeout no canteiro de obras,
   - **Quando** a transferência do arquivo falha,
   - **Então** a despesa e seu eventual pagamento permanecem salvos, e a tela informa: “Despesa salva, mas o comprovante não foi enviado. Você pode tentar novamente.” A própria despesa exibe “Sem comprovante” enquanto não houver arquivo confirmado, inclusive quando criada sem anexo. Ao reabrir a consulta, o proprietário pode selecionar um arquivo e reenviar na mesma despesa, sem novo gasto ou pagamento. Sucesso remove a tag; nova falha a mantém. Não há seção separada de comprovantes pendentes.
7. **Caminho Triste (Tentativa de registrar em obra de terceiro / Anti-IDOR):**
   - **Dado** que há tentativa de gravar despesa informando identificador de obra pertencente a outro usuário,
   - **Quando** a operação é solicitada,
   - **Então** o sistema recusa a ação informando que a obra não foi localizada.
8. **Caminho Triste (Anexo em formato inválido ou excedendo tamanho):**
   - **Dado** que o usuário tenta anexar arquivo que não seja JPEG, PNG ou PDF, ou cujo tamanho exceda 10MB,
   - **Quando** seleciona o arquivo,
   - **Então** o sistema rejeita o anexo e alerta sobre os formatos e o limite máximo aceito.
9. **Caminho Triste (Inconsistência temporal de vencimento):**
   - **Dado** que o proprietário assinala pagamento pendente mas informa data de vencimento anterior à data da despesa,
   - **Quando** tenta salvar,
   - **Então** o sistema bloqueia a gravação e destaca o erro de data de vencimento.
10. **Caminho Triste (Campos obrigatórios ou valores inválidos):**
    - **Dado** que faltam dados obrigatórios (descrição, categoria, fornecedor ou data) ou que quantidade, valor unitário ou valor total sejam menores ou iguais a zero,
    - **Quando** solicita a gravação,
    - **Então** o sistema impede o salvamento e destaca as validações no formulário.
11. **Cancelamento e troca de obra:**
    - **Dado** um formulário ainda não enviado,
    - **Quando** o proprietário cancela, fecha a página ou troca de obra,
    - **Então** nenhuma despesa é criada por essa ação. A troca descarta o contexto anterior e impede contaminação por respostas atrasadas, inclusive A → B → A; atualizar metadados da mesma obra não descarta os campos. Sem obra selecionada, o cadastro orienta a selecionar ou cadastrar uma obra. Uma operação já recebida pelo servidor pode concluir na obra original.

---

### 🟢 US04 — Edição e Exclusão de Despesas
- **Ator:** Proprietário  
- **Prioridade:** Must Have  
- **Tamanho:** M  
- **Status:** 🟢 Live  
- **Rastreabilidade:** [Issue #6](https://github.com/utfpr-gp/obra-certa/issues/6), [spec aprovada e plano concluído](../specs/6-edicao-exclusao-despesas/). Sete tarefas implementadas, com revisões e ajustes visuais registrados. Acesso pela consulta individual `/despesas/:id`, com retorno para `/contas`; listagem permanece na US05. Auditoria final aprovada em 01/11/2026; integração por PR pendente. Live indica implementação local, sem declarar implantação em produção.
- **Dependências:** US03 (Cadastro de Despesas)  
- **História:** Como proprietário com uma obra selecionada, quero editar ou excluir despesas registradas da minha obra, para corrigir divergências, gerenciar status de pagamento ou remover despesas canceladas preservando a integridade dos orçamentos.
- **Regras de Negócio Associadas:** RN01, RN04, RN05, RN06, RN07

**Critérios de Aceitação:**
1. **Caminho Feliz (Edição com recálculo e preservação da obra):**
   - **Dado** que o proprietário acessa uma despesa de sua obra,
   - **Quando** altera campos válidos (valor, descrição, data ou categoria), mantendo a obra de origem imutável, e salva,
   - **Então** o sistema atualiza o registro e recalcula os orçamentos (ajustando a categoria anterior e a nova caso tenha ocorrido troca).
2. **Caminho Feliz (Transição de status Pago ⇄ Pendente na edição):**
   - **Dado** que o proprietário altera o status financeiro da despesa:
     - **De Paga para Pendente:** exige nova data de vencimento (`vencimento >= data da despesa`) e mantém a despesa como pagamento futuro no vencimento informado. Reutiliza o registro de pagamento existente, criando um somente se ainda não houver; não cria ciclos separados de quitação nem duplica compromissos. Decisão do autor em 31/10/2026;
     - **De Pendente para Paga:** altera o status do pagamento vinculado para "Pago", movendo-o para histórico quitado sem excluir o registro;
   - **Quando** confirma a edição,
   - **Então** os status e prazos são atualizados conforme a transição.
3. **Caminho Feliz (Substituição ou remoção de comprovante):**
   - **Dado** que o proprietário edita uma despesa que possui anexo,
   - **Quando** remove o anexo ou envia um novo arquivo válido (JPEG, PNG ou PDF até 10MB),
   - **Então** o sistema solicita a remoção física do arquivo anterior, sem exclusão lógica nem retenção intencional de versões. Na substituição, primeiro confirma o envio e a associação do novo comprovante e somente depois solicita a exclusão do antigo; falha no novo envio preserva o atual. Se apenas a exclusão do antigo falhar, o novo permanece disponível, o antigo deixa de ser oferecido pela aplicação e a resposta informa a falha, sem anunciar arquivo apagado. Falha na associação preserva o antigo e permite uma tentativa imediata de apagar o novo sem vínculo; falha dessa tentativa também é informada. Na remoção sem substituição, primeiro solicita a exclusão física e, após confirmá-la, retira o vínculo e exibe “Sem comprovante”. Falha no armazenamento mantém o vínculo, informa o erro e permite nova tentativa manual. Se apenas a atualização no banco falhar depois de apagar o arquivo, não anuncia sucesso; a repetição manual aceita arquivo já ausente e conclui a retirada do vínculo. Por decisão do autor, não criar tabela, fila, agendamento ou repetição automática de limpeza nesta entrega; falhas na exclusão podem deixar objetos no armazenamento sem garantia de remoção posterior.
4. **Caminho Feliz com Alerta (Edição provocando estouro orçamentário):**
   - **Dado** que a alteração de valor faz os gastos da categoria alcançarem ou superarem 100% do teto previsto,
   - **Quando** a despesa é salva,
   - **Então** o sistema grava os dados e emite alerta visual de orçamento estourado.
5. **Caminho Feliz (Exclusão lógica com diálogo de confirmação):**
   - **Dado** que o proprietário solicita a exclusão de uma despesa,
   - **Quando** o sistema exibe o diálogo de confirmação e ele confirma,
   - **Então** o sistema aplica exclusão lógica (soft delete) na despesa, preservando seu registro no banco, inativa pagamentos vinculados e retira seu valor dos gastos ativos da categoria, sem alterar o teto planejado. Após confirmar a exclusão no banco, solicita a remoção física do comprovante; se o armazenamento falhar, a despesa continua excluída e a resposta informa a falha em apagar o arquivo, sem exigir nova exclusão da despesa nem anunciar arquivo removido. Não registra trabalho nem agenda limpeza posterior.
6. **Caminho Alternativo (Cancelamento da exclusão):**
   - **Dado** que o diálogo de confirmação de exclusão está aberto,
   - **Quando** o proprietário clica em cancelar,
   - **Então** o sistema aborta a operação e nenhum dado ou arquivo é alterado.
7. **Caminho Alternativo (Sessão expirada durante confirmação de exclusão):**
   - **Dado** que a sessão do usuário expira enquanto o diálogo de confirmação de exclusão estava aberto,
   - **Quando** o proprietário confirma a exclusão,
   - **Então** a API recusa a operação com `401`, sem alterar a despesa, os pagamentos ou o comprovante, e a aplicação encerra a sessão e redireciona para o login. Após autenticar novamente, o usuário deve voltar manualmente à despesa e solicitar e confirmar sua exclusão outra vez. A intenção de exclusão não é preservada nem reenviada automaticamente. Decisão do autor em 31/10/2026.
8. **Caminho Triste (Tentativa de alteração/exclusão em obra de terceiro / Anti-IDOR):**
   - **Dado** que há tentativa de editar ou excluir despesa pertencente a outro usuário ou obra de terceiro,
   - **Quando** a operação é solicitada,
   - **Então** o sistema recusa a ação informando que o registro não foi localizado.
9. **Caminho Triste (Inconsistência de datas ou valores na edição):**
   - **Dado** que o usuário tenta salvar a edição com data de vencimento anterior à data da despesa ou com valores menores ou iguais a zero,
   - **Quando** tenta salvar,
   - **Então** o sistema bloqueia a gravação e destaca as validações no formulário.

---

### 🟢 US05 — Visualização e Filtros de Despesas
- **Ator:** Proprietário  
- **Prioridade:** Must Have  
- **Tamanho:** M  
- **Status:** 🟢 Live  
- **Dependências:** US14 (Obra ativa selecionada); US03 (Cadastro de Despesas); US04 (Edição/Exclusão)  
- **Rastreabilidade:** Issue #7; [spec aprovada, plano e revisões](../specs/7-visualizacao-filtros-despesas/). Dez tarefas concluídas, incluindo as consolidações das pendências das Tarefas 1 e 6. Listagem real em `/contas`, quatro abas, filtros combinados, ordenação, totalizadores, apresentação mobile e proteção de contexto. Última validação: 390 testes frontend e quatro testes integrados da listagem aprovados. Auditoria final e integração por PR pendentes; Live indica implementação local, sem declarar implantação em produção.
- **História:** Como proprietário com uma obra selecionada, quero visualizar a listagem paginada de despesas com filtros por período de compra, período de vencimento, múltiplas categorias e fornecedor, acompanhando totalizadores de valores pagos, pendentes e totais, para gerenciar com clareza o fluxo financeiro da obra.
- **Regras de Negócio Associadas:** RN01, RN04

**Critérios de Aceitação:**
1. **Caminho Feliz (Listagem paginada e totalizadores segmentados):**
   - **Dado** que o proprietário acessa a tela de despesas da sua obra,
   - **Quando** a tela é carregada,
   - **Então** o sistema exibe até 15 despesas ativas por página (descrição, categoria, fornecedor, data da compra, vencimento quando houver, valor e status de pagamento) com controles de paginação, e exibe três cards totalizadores: **Total Pago**, **Total a Pagar (Pendente)** e **Total Geral**.
2. **Caminho Feliz (Filtros por datas de compra e vencimento):**
   - **Dado** que o proprietário visualiza a listagem,
   - **Quando** aplica filtros por intervalo de datas da compra e/ou datas de vencimento,
   - **Então** o sistema exibe as despesas correspondentes e recalcula os três totalizadores para o conjunto filtrado.
3. **Caminho Feliz (Filtro por múltiplas categorias e fornecedor):**
   - **Dado** que o proprietário marca uma ou mais categorias no filtro multiselect e/ou especifica um fornecedor,
   - **Quando** aplica os filtros,
   - **Então** a listagem traz apenas as despesas que atendem aos filtros e atualiza os totalizadores.
4. **Caminho Feliz (Ordenação dinâmica):**
   - **Dado** que há despesas listadas,
   - **Quando** o usuário seleciona ordenar por data (mais recente / mais antiga) ou por valor (maior / menor),
   - **Então** a lista é reordenada imediatamente de acordo com a opção selecionada.
5. **Caminho Alternativo (Obra sem despesas):**
   - **Dado** que a obra selecionada ainda não tem despesas ativas cadastradas,
   - **Quando** a tela é carregada,
   - **Então** o sistema exibe mensagem informativa orientando o lançamento da primeira despesa e apresenta os três totalizadores zerados (R$ 0,00).
6. **Caminho Alternativo (Filtro sem resultados):**
   - **Dado** que os filtros aplicados não encontram nenhuma despesa,
   - **Quando** a busca conclui,
   - **Então** o sistema exibe estado indicando que nenhum registro foi encontrado, oferece botão para limpar filtros e exibe os três totalizadores zerados.
7. **Caminho Triste (Intervalo de datas inválido):**
   - **Dado** que o usuário preenche a data inicial maior que a data final no filtro de compra ou de vencimento,
   - **Quando** tenta filtrar,
   - **Então** o sistema bloqueia a consulta e exibe aviso de inconsistência no intervalo de datas.
8. **Caminho Triste (Isolamento por Usuário e Obra / Anti-IDOR):**
   - **Dado** que há tentativa de consultar despesas com identificador de obra pertencente a outro usuário,
   - **Quando** a busca é submetida,
   - **Então** o sistema recusa a consulta informando que a obra não foi localizada.
9. **Regra de Estado (Desconsideração de registros com Soft Delete):**
   - **Dado** que existem despesas com status deletado na obra,
   - **Quando** a listagem ou totalizadores são processados,
   - **Então** o sistema desconsidera totalmente esses registros, não exibindo-os na tabela nem somando-os nos totalizadores.

---

### ⚪ US06 — Relatórios e Gráficos de Gastos
- **Ator:** Proprietário  
- **Prioridade:** Must Have  
- **Tamanho:** M  
- **Status:** ⚪ Draft  
- **Dependências:** US14 (Obra ativa selecionada); US03 (Despesas); US07 (Orçamentos)  
- **História:** Como proprietário com uma obra selecionada, quero visualizar gráficos comparativos entre orçamento previsto e despesas acumuladas e exportar um relatório consolidado em PDF do histórico da obra, para analisar o equilíbrio financeiro e identificar sobras ou estouros orçamentários.
- **Regras de Negócio Associadas:** RN01, RN04

**Critérios de Aceitação:**
1. **Caminho Feliz (Gráfico de distribuição percentual por categoria):**
   - **Dado** que a obra possui despesas ativas,
   - **Quando** o proprietário acessa a visualização de relatórios,
   - **Então** o sistema exibe a distribuição percentual e absoluta dos gastos entre todas as categorias com despesas (gráfico de pizza/rosca com legenda, valores e percentuais).
2. **Caminho Feliz (Gráfico comparativo Orçado vs. Realizado):**
   - **Dado** que a obra possui categorias com orçamento cadastrado,
   - **Quando** o gráfico comparativo é renderizado,
   - **Então** o sistema exibe barras comparando o valor orçado com o total acumulado em despesas para cada categoria orçada:
     - Destacando em **verde** o saldo remanescente quando os gastos estiverem abaixo do teto;
     - Destacando em **vermelho** o montante excedente quando os gastos ultrapassarem o teto previsto;
     - **Omitindo** do gráfico comparativo as categorias que não possuam valor orçado cadastrado.
3. **Caminho Feliz (Exportação síncrona do PDF consolidado):**
   - **Dado** que o proprietário solicita a emissão do relatório financeiro,
   - **Quando** clica em exportar PDF,
   - **Então** o sistema gera em tempo real o arquivo `relatorio-{nome-da-obra}-{data}.pdf` contendo: identificação da obra, total orçado geral, total realizado (discriminando pago e a pagar), balanço de sobras/estouros por categoria e data da geração.
4. **Caminho Alternativo (Obra recém-criada sem movimentação):**
   - **Dado** que a obra selecionada ainda não possui despesas lançadas,
   - **Quando** o proprietário acessa a tela de relatórios,
   - **Então** o sistema exibe os valores orçados com as despesas zeradas/em branco e permite a exportação do relatório normalmente.
5. **Caminho Triste (Tentativa de visualização/exportação de obra alheia / Anti-IDOR):**
   - **Dado** que há tentativa de consultar relatórios ou baixar PDF de uma obra pertencente a outro proprietário,
   - **Quando** a requisição é processada,
   - **Então** o sistema rejeita a operação informando que a obra não foi localizada.
6. **Regra de Integridade (Despesas excluídas):**
   - **Dado** que existem despesas com status deletado (soft delete),
   - **Quando** os gráficos e o PDF são gerados,
   - **Então** o sistema ignora completamente essas despesas nos cálculos.

---

### 🟢 US07 — Definição e Acompanhamento de Orçamento por Categoria
- **Ator:** Proprietário  
- **Prioridade:** Must Have  
- **Tamanho:** M  
- **Status:** 🟢 Live
- **Dependências:** US14 (Obra ativa selecionada); categorias pré-definidas entregues pela US07
- **Rastreabilidade:** Issue #9; [spec e plano](../specs/09-gestao-orcamento/); implementação e revisões por tarefa concluídas na branch da história. Auditoria final e integração por PR ainda pendentes; este status não indica implantação em produção.
- **História:** Como proprietário com uma obra selecionada, quero definir o orçamento previsto por categoria, acompanhar o consumo individual e global com alertas visuais e zerar tetos quando necessário, para manter a previsibilidade financeira e auditar despesas não orçadas.
- **Regras de Negócio Associadas:** RN01, RN02, RN08

**Critérios de Aceitação:**
1. **Caminho Feliz (Definição / Atualização de orçamento por categoria):**
   - **Dado** que o proprietário está na área de orçamentos de sua obra,
   - **Quando** define um valor estimado (`valor > 0`) para uma categoria pré-definida e salva (criando o teto ou atualizando a categoria que já possuía registro na obra),
   - **Então** o sistema grava o teto orçamentário daquela categoria e calcula o percentual consumido com base nas despesas ativas.
2. **Caminho Feliz (Acompanhamento visual de progresso e alertas de consumo):**
   - **Dado** que a obra possui orçamentos cadastrados,
   - **Quando** o painel de orçamentos é carregado,
   - **Então** o sistema exibe barras de progresso visual com o percentual consumido por categoria e o percentual global da obra (`[Total Despesas / Total Orçado] * 100`):
     - Destacando em **amarelo** quando o consumo da categoria atingir entre 90% e 99%;
     - Destacando em **vermelho** quando o consumo atingir ou superar 100%.
3. **Caminho Feliz com Alerta (Despesas em categoria sem teto orçado):**
   - **Dado** que existem despesas ativas lançadas em uma categoria com orçamento zerado ou não definido,
   - **Quando** o painel de orçamentos é exibido,
   - **Então** o sistema exibe um alerta de auditoria orientando o proprietário a definir um teto para essa categoria ou reclassificar a despesa para a categoria correta.
4. **Caminho Feliz (Exclusão/Zeramento de orçamento com confirmação):**
   - **Dado** que o proprietário aciona a exclusão de um orçamento existente (com ou sem despesas associadas),
   - **Quando** o sistema exibe o diálogo de confirmação e ele confirma,
   - **Então** o sistema atualiza o valor do orçamento da categoria para R$ 0,00 no banco (preservando o registro), recalcula os totais globais e passa a sinalizar o alerta de despesas sem teto caso haja gastos atrelados.
5. **Caminho Alternativo (Cancelamento do zeramento de orçamento):**
   - **Dado** que o diálogo de confirmação para zerar o orçamento está visível,
   - **Quando** o proprietário clica em cancelar,
   - **Então** a ação é interrompida e o valor orçado permanece inalterado.
6. **Caminho Alternativo (Estado vazio — obra sem orçamentos definidos):**
   - **Dado** que a obra selecionada ainda não possui nenhum orçamento configurado,
   - **Quando** o proprietário acessa a tela de orçamentos,
   - **Então** o sistema exibe um estado visual orientativo convidando a cadastrar o primeiro orçamento por categoria.
7. **Caminho Triste (Bloqueio de redução abaixo do total já gasto — RN02 com atalho de auditoria):**
   - **Dado** que uma categoria possui despesas ativas que somam um determinado valor X (ex: R$ 5.000),
   - **Quando** o proprietário tenta editar o orçamento para um valor positivo inferior a X (ex: R$ 4.000),
   - **Então** o sistema bloqueia o salvamento e exibe mensagem de erro explicativa ("O orçamento não pode ser menor do que o total de despesas já realizadas nesta categoria: R$ X") acompanhada do atalho "Ver despesas desta categoria". Nesta entrega, o atalho permanece visível e desabilitado, com a indicação "Disponível após a implementação da tela de despesas (US05)"; a navegação filtrada depende da US05, conforme a spec aprovada da Issue #9.
8. **Caminho Triste (Valor negativo ou zerado no formulário):**
   - **Dado** que o usuário tenta salvar um orçamento com valor menor ou igual a zero pelo formulário de edição/criação,
   - **Quando** submete o formulário,
   - **Então** o sistema rejeita a operação com aviso de validação (exigindo valor positivo).
9. **Caminho Triste (Tentativa de alteração em obra alheia / Anti-IDOR):**
   - **Dado** que há tentativa de criar, editar ou zerar orçamento em uma obra pertencente a outro proprietário,
   - **Quando** a operação é solicitada,
   - **Então** o sistema rejeita a requisição e informa que a obra não foi localizada.

---

### ⚪ US08 — Painel de Alertas de Vencimento de Pagamentos
- **Ator:** Proprietário  
- **Prioridade:** Must Have  
- **Tamanho:** S  
- **Status:** ⚪ Draft  
- **Dependências:** US14 (Obra ativa selecionada); US03 (Despesas a prazo com pagamento pendente)  
- **História:** Como proprietário com uma obra selecionada, quero visualizar no painel principal um resumo e a listagem das contas a pagar no horizonte de até 7 dias, podendo marcá-las como pagas com registro da data, para evitar juros e atrasos na obra.
- **Regras de Negócio Associadas:** RN01, RN04, RN07

**Critérios de Aceitação:**
1. **Caminho Feliz (Banner consolidado e listagem ordenada por urgência):**
   - **Dado** que a obra possui despesas ativas com pagamentos pendentes vencidos ou a vencer em até 7 dias,
   - **Quando** o proprietário acessa o painel principal (Home),
   - **Então** o sistema exibe:
     - Um card/banner de alerta no topo informando o resumo consolidado: *"Você tem X contas totalizando R$ Y a vencer nos próximos 7 dias"*;
     - A listagem dos compromissos ordenada por urgência (vencidos mais antigos primeiro, seguidos pelas datas mais próximas), com distinção visual:
       - **Vermelho** para contas vencidas (`vencimento < hoje`);
       - **Amarelo** para contas a vencer em até 3 dias (`hoje <= vencimento <= hoje + 3 dias`);
       - **Neutro/Regular** para contas a vencer entre 4 e 7 dias.
2. **Caminho Feliz (Ação rápida de quitação com data efetiva e idempotência):**
   - **Dado** que o proprietário clica em "Marcar como Pago" em um compromisso pendente no painel,
   - **Quando** a ação é processada,
   - **Então** o sistema:
     - Registra a data atual como a data efetiva do pagamento;
     - Altera o status do pagamento para "Pago" e da despesa para quitada;
     - Remove o compromisso da listagem de alertas ativos e recalcula o totalizador do banner;
     - Garante idempotência (cliques repetidos não geram erro nem alteram a data original de quitação).
3. **Caminho Alternativo (Contas com vencimento superior a 7 dias):**
   - **Dado** que existem despesas a prazo com vencimento além de 7 dias no futuro,
   - **Quando** o painel da Home é renderizado,
   - **Então** o sistema **não** as exibe no painel de alertas imediatos (permanecendo consultáveis na tela de listagem de despesas).
4. **Caminho Alternativo (Sem contas no horizonte de 7 dias):**
   - **Dado** que a obra não tem contas vencidas nem a vencer nos próximos 7 dias,
   - **Quando** o painel da Home carrega,
   - **Então** o sistema exibe mensagem amigável e positiva indicando que não há pagamentos pendentes no período.
5. **Caminho Triste (Tentativa de visualização/baixa em obra de terceiro / Anti-IDOR):**
   - **Dado** que uma requisição tenta listar alertas ou baixar pagamento de uma obra pertencente a outro proprietário,
   - **Quando** a requisição é executada,
   - **Então** o sistema bloqueia a consulta e retorna que o registro não foi localizado.
6. **Regra de Integridade (Despesas excluídas / Soft Delete):**
   - **Dado** que uma despesa associada a um pagamento pendente foi marcada como deletada,
   - **Quando** o painel é carregado,
   - **Então** o sistema não contabiliza nem exibe essa pendência no resumo e na lista de alertas.

---

### ⚪ US09 — Importação de Despesas via NF-e (Chave ou XML)
- **Ator:** Proprietário  
- **Prioridade:** Must Have  
- **Tamanho:** L  
- **Status:** ⚪ Draft  
- **Dependências:** US14 (Obra ativa selecionada); US03 (Cadastro de Despesas); Categorias pré-definidas  
- **História:** Como proprietário com uma obra selecionada, quero importar compras via upload do arquivo XML ou chave de acesso da NF-e e distribuir os itens pelas respectivas categorias da obra, para agilizar os lançamentos e manter a precisão do rateio financeiro por etapa.  
- *Nota de Engenharia:* O desenvolvimento prioriza primeiramente o parser do arquivo XML local; a busca remota por chave de acesso via API fiscal externa constitui uma segunda fase condicionada à viabilidade de integração.
- **Regras de Negócio Associadas:** RN01, RN03

**Critérios de Aceitação:**
1. **Caminho Feliz (Extração híbrida e exibição de itens):**
   - **Dado** que o proprietário está na área de importação da sua obra,
   - **Quando** ele faz upload do arquivo `.xml` da NF-e ou digita a chave de 44 dígitos (validada com dígito verificador módulo 11),
   - **Então** o sistema processa os dados fiscais e exibe a tela de conferência com: fornecedor (Razão Social e CNPJ), data de emissão, chave fiscal e a listagem detalhada de todos os itens da nota (descrição, quantidade, unidade, valor unitário e total de cada item).
2. **Caminho Feliz (Desdobro por itens e gravação das despesas):**
   - **Dado** que os itens da nota estão na tela de conferência,
   - **Quando** o proprietário seleciona a categoria de destino para cada item e confirma o lançamento,
   - **Então** o sistema gera as despesas desdobradas vinculadas à obra, cadastra/vincula o fornecedor pelo CNPJ, atualiza os orçamentos de cada categoria envolvida e registra a chave para prevenir duplicidades.
3. **Caminho Triste (Chave inválida — formato ou dígito verificador):**
   - **Dado** que o usuário digita uma chave que não possui 44 dígitos numéricos ou cujo dígito verificador (módulo 11) seja inválido,
   - **Quando** solicita a consulta,
   - **Então** o sistema impede o envio e exibe alerta de chave de acesso inválida antes de qualquer requisição externa.
4. **Caminho Triste (Chave já importada):**
   - **Dado** que a chave da NF-e informada (seja por digitação ou no XML) já foi importada anteriormente pelo usuário,
   - **Quando** tenta importar,
   - **Então** o sistema bloqueia a operação informando que a nota fiscal já foi registrada no sistema, prevenindo duplicidade de despesas.
5. **Caminho Triste (XML corrompido, nota cancelada ou serviço indisponível):**
   - **Dado** que o XML enviado é inválido/corrompido, a nota fiscal se encontra cancelada ou o serviço de consulta estiver fora do ar,
   - **Quando** o sistema tenta extrair os dados,
   - **Então** o sistema exibe alerta explicativo sobre o motivo da falha e oferece a opção de cadastro manual da despesa.

---

### ⚪ US10 — Solicitação de Orçamentos Automatizada
- **Ator:** Proprietário  
- **Prioridade:** Should Have *(Roadmap Futuro — Não prioritário para o MVP)*  
- **Tamanho:** M  
- **Status:** ⚪ Draft  
- **História:** Como proprietário, quero disparar listas de materiais por e-mail para fornecedores cadastrados, para comparar cotações de preços.

**Critérios de Aceitação:**
1. **Caminho Feliz (Envio de solicitação de cotação):**
   - **Dado** que o proprietário seleciona materiais e quantidades desejadas,
   - **Quando** submete o envio de cotação para fornecedores selecionados,
   - **Então** o sistema gera a mensagem padronizada e registra o status da solicitação (`Enviada`, `Respondida`, `Cancelada`).
2. **Caminho Triste (Fornecedor sem e-mail cadastrado):**
   - **Dado** que o fornecedor selecionado não possui endereço de e-mail válido,
   - **Quando** o usuário tenta enviar a solicitação,
   - **Então** o sistema alerta sobre a ausência do e-mail e solicita atualização cadastral.

---

### ⚪ US11 — Localização de Fornecedores Próximos
- **Ator:** Proprietário  
- **Prioridade:** Should Have *(Roadmap Futuro — Não prioritário para o MVP)*  
- **Tamanho:** M  
- **Status:** ⚪ Draft  
- **História:** Como proprietário, quero visualizar fornecedores em um mapa interativo com base no endereço, para planejar compras presenciais e logística da obra.

**Critérios de Aceitação:**
1. **Caminho Feliz (Visualização no mapa):**
   - **Dado** que há fornecedores com endereços válidos cadastrados,
   - **Quando** o usuário abre a visualização em mapa,
   - **Então** o sistema plota marcadores nos pontos geográficos exibindo nome, telefone e categorias atendidas ao clicar no marcador.
2. **Caminho Triste (Endereço não localizado):**
   - **Dado** que o endereço de um fornecedor não pôde ser geolocalizado,
   - **Quando** o mapa é renderizado,
   - **Então** o sistema exibe aviso informando que o endereço não foi localizado no mapa e o mantém listado na tabela textual.

---

### ⚪ US12 — Banco de Preços Colaborativo
- **Ator:** Proprietário  
- **Prioridade:** Could Have *(Roadmap Futuro)*  
- **Tamanho:** L  
- **Status:** ⚪ Draft  
- **História:** Como proprietário, quero consultar a média de preços pagos por materiais na minha região geográfica, para avaliar se as cotações que recebi estão justas.

---

### ⚪ US13 — Avaliação de Fornecedores
- **Ator:** Proprietário  
- **Prioridade:** Could Have *(Roadmap Futuro)*  
- **Tamanho:** S  
- **Status:** ⚪ Draft  
- **História:** Como proprietário, quero registrar avaliações sobre o atendimento e pontualidade de fornecedores, para manter um histórico qualitativo dos parceiros da obra.

---

### 🟢 US14 — Gestão e Seleção de Obras (Projetos)
- **Ator:** Proprietário  
- **Prioridade:** Must Have  
- **Tamanho:** M  
- **Status:** 🟢 Live  
- **Dependências:** US01 (Cadastro); US02 (Autenticação)  
- **História:** Como proprietário autenticado, quero cadastrar, editar, excluir e alternar entre minhas obras, para gerenciar os custos e orçamentos de cada construção ou reforma de forma independente.
- **Regras de Negócio Associadas:** RN01, RN04

**Critérios de Aceitação:**
1. **Caminho Feliz (Cadastro de nova obra e definição de ativa):**
   - **Dado** que o proprietário está autenticado,
   - **Quando** informa nome da obra (mínimo 3 caracteres), seleciona o tipo obrigatório (Construção Nova, Reforma ou Ampliação), localização opcional e confirma,
   - **Então** o sistema grava a obra vinculada exclusivamente à sua conta e a define como obra ativa de navegação no cliente.
2. **Caminho Feliz (Listagem e seletor de obra global):**
   - **Dado** que o proprietário possui uma ou mais obras cadastradas,
   - **Quando** acessa o seletor global de obras no topo do sistema,
   - **Então** o sistema lista apenas as suas próprias obras e, ao selecionar uma, atualiza todo o contexto do painel (despesas, orçamentos, relatórios) para refletir exclusivamente a obra escolhida, persistindo a seleção no cliente.
3. **Caminho Feliz (Edição dos dados da obra):**
   - **Dado** que o proprietário edita uma de suas obras,
   - **Quando** altera nome, tipo, localização ou status (*Em Andamento*, *Pausada*, *Concluída*) e salva,
   - **Então** o sistema atualiza as informações da obra preservando todas as suas despesas e orçamentos associados.
4. **Caminho Feliz (Exclusão lógica de obra com confirmação):**
   - **Dado** que o proprietário aciona a exclusão de uma obra,
   - **Quando** o sistema exibe o diálogo de confirmação alertando sobre o impacto e ele confirma,
   - **Então** o sistema aplica exclusão lógica (soft delete) na obra, inativa despesas e orçamentos vinculados e, se houver outras obras, redireciona o usuário para a próxima obra ativa.
5. **Caminho Alternativo (Cancelamento da exclusão):**
   - **Dado** que o diálogo de confirmação de exclusão da obra está visível,
   - **Quando** o usuário clica em cancelar,
   - **Então** a operação é abortada e a obra permanece inalterada.
6. **Caminho Alternativo (Onboarding — usuário com zero obras):**
   - **Dado** que o usuário acabou de se cadastrar ou excluiu sua única obra,
   - **Quando** acessa o sistema,
   - **Então** o sistema exibe tela de boas-vindas com botão destacado (CTA) convidando-o a cadastrar sua primeira obra.
7. **Caminho Triste (Validação de nome obrigatório):**
   - **Dado** que o proprietário tenta salvar obra com nome vazio ou inferior a 3 caracteres,
   - **Quando** tenta submeter,
   - **Então** o sistema impede a gravação e exige o preenchimento do nome.
8. **Caminho Triste (Tentativa de acesso/edição a obra alheia / Anti-IDOR):**
   - **Dado** que há tentativa de consultar, alternar, editar ou excluir obra de outro usuário,
   - **Quando** a operação é solicitada,
   - **Então** o sistema recusa a ação informando que a obra não foi localizada.

---

## 🛡️ 5. Regras de Negócio (Constraints)

- **RN01 — Isolamento de Dados por Usuário e Obra (Anti-IDOR):** Um usuário só tem acesso a obras, despesas, orçamentos, fornecedores e pagamentos de sua própria titularidade. Qualquer tentativa de acesso a dados de terceiros deve ser tratada como recurso inexistente (não encontrado), sem expor a existência do registro.  
  *(Referenciada por: US01, US02, US03, US04, US05, US06, US07, US08, US09, US14)*

- **RN02 — Consistência de Redução Orçamentária:** O valor do orçamento de uma categoria não pode ser editado para uma quantia inferior ao total de despesas ativas já acumuladas nessa mesma categoria.  
  *(Referenciada por: US07)*

- **RN03 — Integridade da Chave Fiscal (NF-e):** Não é permitida a duplicação do cadastro ou importação de uma mesma chave de acesso de 44 dígitos de NF-e para o mesmo usuário/obra.  
  *(Referenciada por: US09)*

- **RN04 — Padrão de Exclusão Lógica (Soft Delete):** A exclusão de obras e despesas opera por exclusão lógica (mudança de status para inativo/deletado), preservando a integridade histórica no banco. Registros excluídos logicamente são desconsiderados de listagens, totalizadores e gráficos ativos. Na exclusão de despesa, arquivos físicos de comprovante são removidos do armazenamento.  
  *(Referenciada por: US03, US04, US05, US06, US08, US14)*

- **RN05 — Consistência Temporal de Vencimento:** A data de vencimento de um pagamento pendente deve ser sempre igual ou posterior à data de realização da despesa (`vencimento >= data da despesa`).  
  *(Referenciada por: US03, US04)*

- **RN06 — Imutabilidade da Obra na Despesa:** Uma despesa vinculada a uma determinada obra é imutável em relação à sua obra de origem (não pode ser transferida de obra durante a edição).  
  *(Referenciada por: US04)*

- **RN07 — Ciclo de Quitação e Preservação de Histórico:** Despesas a prazo geram compromisso de pagamento pendente. Ao quitar a conta, o registro de pagamento recebe o status "Pago" e armazena a data efetiva da quitação, sem remoção do histórico.  
  *(Referenciada por: US03, US04, US08)*

- **RN08 — Unicidade de Orçamento por Categoria na Obra:** Dentro de uma mesma obra, cada categoria possui no máximo um único registro de teto orçado. Novas atribuições de valor para a mesma categoria atualizam o registro existente.  
  *(Referenciada por: US07)*

---

## 🚫 6. Fora de Escopo (Non-goals / Won't Have)

1. **Processamento Bancário Transacional:** O sistema não realiza liquidação financeira (Pix, boleto bancário ou cartão). A quitação no sistema é puramente contábil e gerencial.  
   *Motivo:* Complexidade regulatória, taxas bancárias e responsabilidade financeira fora do foco do TCC.
2. **Emissão de Notas Fiscais:** A plataforma apenas lê e importa NF-e; ela não emite notas fiscais de venda ou serviço para a SEFAZ.  
   *Motivo:* O usuário do sistema é o comprador pessoa física, não a empresa emissora.
3. **Módulo de Gestão de Administradores Globais:** O sistema não possui painel nem perfil administrativo para monitorar ou alterar outros usuários.  
   *Motivo:* Foco exclusivo na experiência do proprietário autogerindo suas obras e cumprimento rigoroso do prazo do TCC.
4. **Notificações Ativas Externas (Push, SMS ou E-mail):** O sistema não envia e-mails ou mensagens ativas alertando vencimentos de pagamentos. Os avisos ocorrem por alertas visuais passivos no painel do sistema.  
   *Motivo:* Evita custos de infraestrutura e gateways de mensageria externa no MVP.
5. **Integração com WhatsApp:** Início automatizado de conversas ou bot de atendimento via WhatsApp.  
   *Motivo:* Instabilidade e custo de APIs de mensageria, agregando pouco valor ao cerne da previsibilidade financeira.
6. **Cronograma Físico de Obra (Gráfico de Gantt):** Planejamento de etapas físicas de engenharia ou medição de produtividade de equipe de campo.  
   *Motivo:* O escopo do *ObraCerta* é 100% voltado à previsibilidade e planejamento orçamentário-financeiro.
7. **Tratamento de Edição Concorrente:** Bloqueio concorrente por registro ou controle de concorrência otimista.  
   *Motivo:* Cada obra é gerida de forma individual e pessoal pelo próprio proprietário em sua conta.
8. **Banco de Preços Regional Colaborativo com Atualização Automática:** Consolidação de base de preços compartilhada entre usuários alimentada por NF-e.  
   *Motivo:* Depende de massa crítica de dados e anonimização de informações fiscais, complexidade desproporcional para o TCC.

---

## ⚙️ 7. Requisitos Não Funcionais (RNF)

- **RNF01 (Desempenho e Tempo de Resposta):** O tempo de resposta para carregamento de listagens paginadas, cálculos de totalizadores e renderização de gráficos deve ser inferior a 2 segundos em condições normais de uso.  
  *Justificativa:* Proporciona uma experiência fluida mesmo com centenas de despesas lançadas ao longo dos meses de obra.
- **RNF02 (Segurança de Credenciais):** As senhas dos usuários devem ser armazenadas de forma segura utilizando algoritmo de criptografia unidirecional com salt (hashing resistente a ataques de força bruta), nunca em texto puro.  
  *Justificativa:* Proteção das credenciais do proprietário contra vazamento de base.
- **RNF03 (Segurança em Trânsito):** Toda a comunicação entre o cliente e o servidor deve trafegar exclusivamente sob canal seguro e criptografado (HTTPS/TLS).  
  *Justificativa:* Proteção dos dados financeiros e chaves fiscais durante a transmissão em redes abertas ou móveis.
- **RNF04 (Usabilidade e Responsividade Multidispositivo):** A aplicação deve ser totalmente adaptável a telas de smartphones, tablets e desktops.  
  *Justificativa:* O proprietário frequentemente consulta orçamentos e anexa comprovantes diretamente no canteiro de obras pelo celular.
- **RNF05 (Privacidade e LGPD):** Dados financeiros, cadastrais e fiscais são isolados por conta e obra. O sistema deve possibilitar a exclusão da conta e dos dados pessoais quando solicitado pelo proprietário.  
  *Justificativa:* Conformidade com a Lei Geral de Proteção de Dados (LGPD).
- **RNF06 (Integridade Transacional):** Operações que envolvem desdobro de notas fiscais, atualização de orçamentos e transições de pagamento devem garantir atomicidade (ou a operação inteira se completa com sucesso, ou nada é gravado).  
  *Justificativa:* Evita inconsistências de saldos ou itens órfãos no histórico financeiro da obra.
