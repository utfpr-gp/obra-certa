# 📄 Product Requirements Document (PRD) - ObraCerta!

**Projeto:** ObraCerta (Gestão de Obras Residenciais)  
**Versão:** 1.0.0 (Refinada para Negócio com Base em Dados Reais)  
**Status:** 🟢 Definido (MVP)

---

## 🎯 1. Visão Geral e Objetivo
O ObraCerta tem como objetivo auxiliar no planejamento e controle financeiro de obras autogeridas, ou seja, realizadas diretamente por proprietários sem acompanhamento profissional contínuo. A aplicação busca oferecer uma solução acessível e prática para que os usuários possam registrar suas despesas da obra, acompanhar o orçamento previsto em comparação com os gastos reais, receber alertas preventivos de estouro de orçamento e gerar relatórios detalhados sobre o andamento financeiro da construção.

## 📖 2. Glossário Ubíquo
* **Obra:** Projeto de construção ou reforma individualizado.
* **Proprietário:** Usuário que gerencia a obra.
* **Orçamento Inicial:** Teto financeiro planejado por categoria de despesa.
* **Despesa:** Gasto efetivo (Material, Mão de Obra ou Serviço).
* **Fornecedor:** Pessoa ou empresa que fornece materiais ou serviços para a obra.
* **NF-e (Nota Fiscal):** Documento fiscal importado via chave de 44 dígitos da SEFAZ.
* **Pagamento Pendente:** Registro de despesa com vencimento futuro ainda não quitado.
* **Saldo da Obra:** Diferença matemática entre o Orçamento Inicial e o Total de Despesas.
* **Categoria:** Classificação de despesas (Alvenaria, Elétrica, Hidráulica, etc.).
* **CUB (Custo Unitário Básico):** Custo de construção por metro quadrado, utilizado como referência para o orçamento inicial.

## 👤 3. Atores e Permissões
* **Usuário (Proprietário/Gestor):** Ator principal. Gerencia obras, orçamentos, despesas e visualiza a evolução financeira.
* **Administrador (Admin):** Gerencia a base de usuários e monitora a integridade global do sistema.
* **Sistema (Automático):** Realiza cálculos de saldo, consulta a API da SEFAZ e dispara alertas de orçamento.

## 📝 4. Escopo Funcional, Histórias de Usuário e Critérios de Aceitação (MoSCoW)

> **Instrução para a IA/Desenvolvedor:** Cada bloco abaixo representa uma necessidade de negócio. Uma história só é considerada "Done" quando todos os seus critérios de aceitação forem atendidos no sistema.

### 🔴 HU01 - Cadastro de Usuário (Must Have)
**Ator:** Visitante | **História:** Como visitante, quero me registrar no sistema, para poder acessar e utilizar a plataforma.

**✅ Critérios de Aceitação:**
* [ ] O usuário deve preencher os campos: nome, e-mail, senha e confirmação de senha.
* [ ] O sistema deve validar a unicidade do e-mail e aplicar regras de senha forte.
* [ ] Após o cadastro bem-sucedido, o usuário deve ser redirecionado para a tela inicial da aplicação.

### 🔴 HU02 - Autenticação (Login/Logout) (Must Have)
**Ator:** Usuário | **História:** Como usuário, quero acessar o sistema com meu login e senha, para visualizar meus dados com segurança.

**✅ Critérios de Aceitação:**
* [ ] O sistema deve permitir login utilizando e-mail e senha cadastrados.
* [ ] A autenticação deve utilizar tokens JWT (JSON Web Token) para controle de sessão.
* [ ] O usuário deve ter a opção de logout, encerrando sua sessão de forma segura.
* [ ] O sistema deve oferecer funcionalidade de recuperação de senha via e-mail.

### 🔴 HU03 - Cadastro de Despesas (Must Have)
**Ator:** Usuário | **História:** Como um usuário, quero cadastrar uma despesa de material, mão de obra or serviço para que eu possa controlar meus gastos na construção.

**✅ Critérios de Aceitação:**
* [ ] O usuário deve informar tipo da despesa, valor, data e fornecedor.
* [ ] O sistema deve calcular automaticamente o valor total da despesa com base na quantidade e preço unitário.
* [ ] Deve ser possível adicionar uma foto da nota fiscal ou recibo.
* [ ] O sistema deve validar campos obrigatórios antes de salvar.

### 🔴 HU04 - Edição e Exclusão de Despesas (Must Have)
**Ator:** Usuário | **História:** Como um usuário, quero poder editar ou excluir despesas já cadastradas para corrigir informações ou remover registros errados.

**✅ Critérios de Aceitação:**
* [ ] O usuário deve conseguir visualizar todas as despesas cadastradas.
* [ ] O usuário deve poder editar qualquer campo de uma despesa já registrada.
* [ ] O usuário deve poder excluir uma despesa, com um aviso de confirmação.
* [ ] O sistema deve impedir a exclusão de despesas vinculadas a relatórios financeiros fechados.

### 🔴 HU05 - Visualização e Filtros de Gastos (Must Have)
**Ator:** Usuário | **História:** Como um usuário, quero visualizar todas as despesas cadastradas e aplicar filtros para encontrar informações específicas.

**✅ Critérios de Aceitação:**
* [ ] O usuário deve poder visualizar despesas ordenadas por data, valor ou fornecedor.
* [ ] O sistema deve permitir filtros por período, categoria e fornecedor.
* [ ] O sistema deve exibir um totalizador dos gastos filtrados.

### 🔴 HU06 - Relatórios e Gráficos de Gastos (Must Have)
**Ator:** Usuário | **História:** Como um usuário, quero gerar relatórios detalhados dos meus gastos para analisar onde estou gastando mais na minha obra.

**✅ Critérios de Aceitação:**
* [ ] O usuário deve poder escolher um período e uma categoria de despesas.
* [ ] O sistema deve gerar um relatório em tabela e em gráfico de pizza/barras.
* [ ] O relatório deve comparar o orçamento planejado com os gastos reais.
* [ ] Deve haver opção de exportação para PDF.

### 🔴 HU07 - Orçamento Inicial e Comparação com Gastos (Must Have)
**Ator:** Usuário | **História:** Como um usuário, quero cadastrar um orçamento inicial para poder comparar com os gastos reais ao longo da obra.

**✅ Critérios de Aceitação:**
* [ ] O usuário deve informar um valor previsto para cada categoria de despesas.
* [ ] O sistema deve exibir um indicador de progresso da obra, mostrando quanto já foi gasto em relação ao orçamento.
* [ ] O sistema deve gerar alertas se um orçamento for ultrapassado.

### 🔴 HU08 - Notificações de Pagamentos Pendentes (Must Have)
**Ator:** Usuário | **História:** Como um usuário, quero receber notificações quando um pagamento estiver próximo do vencimento para evitar atrasos e juros.

**✅ Critérios de Aceitação:**
* [ ] O usuário deve poder configurar alertas para pagamentos futuros.
* [ ] O sistema deve enviar notificações visuais e e-mail quando o vencimento estiver próximo.
* [ ] O sistema deve listar pagamentos pendentes na tela principal.

### 🔴 HU09 - Integração com Nota Fiscal Eletrônica (NF-e) (Must Have)
**Ator:** Usuário | **História:** Como um usuário, quero cadastrar minhas despesas automaticamente informando a chave de acesso da NF-e para evitar digitação manual.

**✅ Critérios de Aceitação:**
* [ ] O usuário deve informar a chave de acesso (44 dígitos) da nota fiscal.
* [ ] O sistema deve buscar automaticamente os dados na API da Sefaz.
* [ ] Os dados da nota devem ser preenchidos nos campos de cadastro de despesas.
* [ ] O usuário deve poder revisar os dados antes de salvar.

---

### 🟡 HU10 - Solicitação de Orçamentos Automatizada (Should Have)
**Ator:** Usuário | **História:** Como um usuário, quero enviar automaticamente solicitações de orçamento para fornecedores, a fim de comparar preços de forma prática.

**✅ Critérios de Aceitação:**
* [ ] O usuário deve poder selecionar materiais cadastrados para envio.
* [ ] O sistema deve gerar e-mails padronizados contendo a lista de materiais.
* [ ] Deve haver confirmação visual do envio e acompanhamento do status das respostas.
* [ ] As respostas dos fornecedores devem poder ser registradas e comparadas no sistema.

### 🟡 HU11 - Localização de Fornecedores Próximos (Should Have)
**Ator:** Usuário | **História:** Como um usuário, quero visualizar fornecedores próximos no mapa, para facilitar a compra presencial e a logística de entrega.

**✅ Critérios de Aceitação:**
* [ ] O sistema deve exibir fornecedores cadastrados em um mapa interativo.
* [ ] Deve permitir busca por categoria de material ou nome do fornecedor.
* [ ] Deve exibir informações como nome, endereço, telefone e horário de atendimento.

---

### 🔵 HU12 - Banco de Preços Colaborativo (Could Have)
**Ator:** Usuário | **História:** Como um usuário, quero acessar um banco de preços colaborativo com base em compras reais, para tomar decisões mais informadas sobre onde comprar materiais.

**✅ Critérios de Aceitação:**
* [ ] O sistema deve permitir o compartilhamento de preços pagos por usuários.
* [ ] Os dados devem ser organizados por produto, fornecedor e localização geográfica.
* [ ] O sistema deve apresentar média de preços por item.
* [ ] As informações devem ser armazenadas de forma anônima e segura.

### 🔵 HU13 - Cadastro e Avaliação de Fornecedores (Could Have)
**Ator:** Usuário | **História:** Como um usuário, quero cadastrar fornecedores e avaliar seu atendimento, para contribuir com a reputação dos parceiros comerciais.

**✅ Critérios de Aceitação:**
* [ ] O sistema deve permitir o cadastro de novos fornecedores com CNPJ e dados completos.
* [ ] Usuários autenticados devem poder deixar avaliações e comentários.
* [ ] Cada fornecedor deve possuir um perfil com histórico de preços, avaliações e materiais fornecidos.

---

### ⚪ HU14 - Integração com WhatsApp (Won't Have)
**Ator:** Usuário | **História:** Como um usuário, quero poder iniciar conversas com fornecedores via WhatsApp, para facilitar a negociação direta de preços e prazos.

**✅ Critérios de Aceitação:**
* [ ] O sistema deve apresentar botão de acesso ao WhatsApp ao lado das informações do fornecedor.
* [ ] O número de telefone deve estar armazenado no perfil do fornecedor.
* [ ] A abertura da conversa deve incluir uma mensagem padrão de solicitação de orçamento.

### ⚪ HU15 - Atualização Automática de Preços via NF-e (Won't Have)
**Ator:** Usuário | **História:** Como um usuário, quero que os preços sejam atualizados automaticamente ao importar uma nota fiscal eletrônica, para manter meu histórico de valores sempre atualizado.

**✅ Critérios de Aceitação:**
* [ ] O sistema deve identificar os itens da nota fiscal e seus respectivos preços.
* [ ] Os valores devem ser comparados com registros anteriores para fins de análise.
* [ ] O usuário deve ser notificado sobre variações significativas de preço.

---

## 🛡️ 5. Regras de Negócio (Constraints)
* **RN01 (Isolamento de Dados):** Um usuário nunca deve ter acesso às obras, despesas ou fornecedores de outro usuário.
* **RN02 (Consistência Orçamentária):** O sistema não deve permitir que o orçamento seja reduzido para um valor menor do que o total já gasto na obra.
* **RN03 (Integridade Fiscal):** Campos importados via NF-e que possuam valor fiscal legal não devem ser alterados após o salvamento, apenas categorias podem ser reclassificadas.
* **RN04 (Relação Despesas e Orçamento):** Toda despesa cadastrada deve estar obrigatoriamente vinculada a uma obra/orçamento específico.
* **RN05 (Relação Despesas e Pagamentos):** Toda despesa deve possuir um status de pagamento claro (Pago ou Pendente) para controle de fluxo de caixa.

## 🚫 6. Fora de Escopo (Non-goals)
* Emissão de faturas ou notas fiscais (o sistema apenas importa).
* Gestão de cronograma físico (Gantt) ou tarefas diárias de pedreiros.
* Processamento de transações bancárias (Pix/Boleto) dentro da plataforma.
* Integração com WhatsApp para alertas e notificações automáticas.
* Atualização automática de preços no banco colaborativo via NF-e (será manual/revisada).

## ⚙️ 7. Requisitos Não Funcionais (RNF)

### **1️⃣ Desempenho e Escalabilidade**
* **RNF01** – O sistema deve ser capaz de **armazenar e processar um grande volume de dados**, garantindo desempenho estável mesmo com muitas despesas cadastradas.
* **RNF02** – O tempo de resposta das consultas e relatórios deve ser inferior a **2 segundos** para um banco de dados com até 100.000 registros.
* **RNF03** – O sistema deve permitir a **expansão para múltiplos usuários simultâneos**, suportando pelo menos **500 acessos concorrentes sem perda de desempenho**.

### **2️⃣ Segurança e Privacidade**
* **RNF04** – O sistema deve utilizar **criptografia para armazenar senhas de usuários** (exemplo: bcrypt ou Argon2).
* **RNF05** – As comunicações entre cliente e servidor devem ser protegidas por **SSL/TLS** para evitar interceptação de dados.
* **RNF06** – Apenas usuários autorizados devem poder acessar ou editar os dados financeiros cadastrados.
* **RNF07** – O sistema deve permitir que o usuário **exclua sua conta e todos os seus dados permanentemente** caso deseje.
* **RNF08** – O sistema deve seguir as diretrizes da **LGPD (Lei Geral de Proteção de Dados)** para garantir que os dados financeiros do usuário não sejam compartilhados sem consentimento.

### **3️⃣ Usabilidade e Experiência do Usuário**
* **RNF09** – O sistema deve ter **uma interface simples e intuitiva**, permitindo que qualquer usuário, mesmo sem conhecimento técnico, consiga utilizá-lo.
* **RNF10** – O layout deve ser **responsivo**, funcionando corretamente em **computadores, tablets e celulares**.
* **RNF11** – O sistema deve exibir **notificações visuais e alertas intuitivos** para eventos importantes (exemplo: estouro de orçamento, vencimento de pagamentos).
* **RNF12** – O sistema deve possuir um **modo escuro (dark mode)** para melhor conforto visual.
* **RNF13** – Em caso de erro, o sistema deve fornecer **mensagens claras** ao usuário, evitando informações técnicas complicadas.

### **4️⃣ Integração e Compatibilidade**
* **RNF14** – O sistema deve permitir **integração com API da Sefaz** para importação automática de dados de Notas Fiscais Eletrônicas.
* **RNF15** – O sistema deve permitir **exportação de relatórios** em formatos **PDF e Excel**.