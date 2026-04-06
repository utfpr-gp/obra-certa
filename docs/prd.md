# 📄 Product Requirements Document (PRD) - ObraCerta!

**Projeto:** ObraCerta (Gestão de Obras)  
**Versão:** 1.0.0 (Refinada para Negócio com Base em Dados Reais)  
**Status:** 🟢 Definido (MVP)

---

## 🎯 1. Visão Geral e Objetivo
O ObraCerta foi desenvolvido para reduzir um dos problemas mais recorrentes em pequenas
obras: o estouro do orçamento. Com a possibilidade de cadastrar um orçamento inicial e regis-
trar as despesas ao longo da execução — seja de forma manual ou por meio da importação de
NF-e, o ObraCerta permitirá ao usuário comparar, em tempo real, os valores previstos e os efe-
tivamente gastos. Isso oferecerá uma visão clara da evolução financeira da obra, promovendo
maior controle, transparência e tomada de decisão mais assertiva durante todo o processo.

## 📖 2. Glossário Ubíquo
* **Obra:** Projeto de construção ou reforma gerenciado pelo usuário.
* **Orçamento Inicial:** Teto de gastos planejado para a execução da obra.
* **Despesa:** Registro de gasto efetivo (material ou mão de obra).
* **NF-e (Nota Fiscal Eletrônica):** Documento digital que acoberta operações de circulação de mercadorias.
* **Fornecedor:** Entidade (pessoa física ou jurídica) que fornece produtos ou serviços para a obra.

## 👤 3. Atores e Permissões
* **Usuário (Proprietário/Gestor):** Ator principal que cadastra suas obras, define orçamentos, registra despesas e acompanha a evolução financeira.
* **Administrador (Admin):** Gerencia a manutenção do sistema e usuários em nível global.

## 📝 4. Escopo Funcional, Histórias de Usuário e Critérios de Aceitação (MoSCoW)

> **Instrução para a IA/Desenvolvedor:** Cada bloco abaixo representa uma necessidade de negócio. Uma história só é considerada "Done" quando todos os seus critérios de aceitação forem atendidos no sistema.

### 🔴 US01 - Autenticação e Gestão de Perfil (Must Have)
**Ator:** Usuário | **História:** Como usuário, quero me cadastrar e fazer login no sistema para que meus dados de obra sejam armazenados com segurança.

**✅ Critérios de Aceitação:**
* [ ] O sistema deve permitir o cadastro de novos usuários com e-mail e senha.
* [ ] A autenticação deve utilizar tokens seguros (JWT).
* [ ] Deve ser possível realizar o logout encerrando a sessão de forma segura.
* [ ] O sistema deve oferecer funcionalidade de recuperação de senha via e-mail.

### 🔴 US02 - Cadastro e Gestão de Obras (Must Have)
**Ator:** Usuário | **História:** Como usuário, quero cadastrar uma nova obra informando um orçamento inicial para que eu possa acompanhar os gastos em relação ao planejado.

**✅ Critérios de Aceitação:**
* [ ] O sistema deve permitir criar múltiplas obras por usuário.
* [ ] Cada obra deve obrigatoriamente possuir um Nome e um Orçamento Inicial (R$).
* [ ] O usuário deve poder editar ou excluir uma obra que ainda não possua despesas vinculadas.

### 🔴 US03 - Gestão de Fornecedores e Integração WhatsApp (Must Have)
**Ator:** Usuário | **História:** Como usuário, quero cadastrar meus fornecedores e poder contatá-los via WhatsApp para agilizar pedidos e orçamentos.

**✅ Critérios de Aceitação:**
* [ ] O cadastro de fornecedor deve conter Nome, Telefone e Categoria.
* [ ] Deve haver um botão de acesso direto ao WhatsApp ao lado do contato do fornecedor.
* [ ] A abertura da conversa via WhatsApp deve incluir uma mensagem padrão de solicitação.

### 🔴 US04 - Registro Manual de Despesas (Must Have)
**Ator:** Usuário | **História:** Como usuário, quero registrar despesas manualmente para que eu tenha controle dos gastos que não possuem nota fiscal eletrônica.

**✅ Critérios de Aceitação:**
* [ ] Uma despesa deve conter Valor, Data e Categoria.
* [ ] A despesa deve estar obrigatoriamente vinculada a uma obra ativa.
* [ ] O sistema deve atualizar o saldo restante da obra instantaneamente após o registro.

### 🟡 US05 - Importação de NF-e (Should Have)
**Ator:** Usuário | **História:** Como usuário, quero importar o XML de uma NF-e para que os itens e valores sejam cadastrados automaticamente no sistema.

**✅ Critérios de Aceitação:**
* [ ] O sistema deve processar arquivos XML de NF-e padrão SEFAZ.
* [ ] Os itens da nota devem ser mapeados automaticamente como despesas da obra selecionada.
* [ ] O sistema deve validar se o CNPJ do fornecedor na nota já existe no cadastro ou criar um novo.

### 🟡 US06 - Dashboard de Evolução Financeira (Should Have)
**Ator:** Usuário | **História:** Como usuário, quero visualizar um gráfico de evolução financeira para comparar o orçamento planejado com o gasto real acumulado.

**✅ Critérios de Aceitação:**
* [ ] O dashboard deve exibir o percentual de uso do orçamento total da obra.
* [ ] Deve mostrar um gráfico temporal de gastos por categoria.
* [ ] O sistema deve alertar visualmente quando os gastos atingirem 80% e 100% do orçamento previsto.

## 🛡️ 5. Regras de Negócio (Constraints)
* **RN01 (Vínculo de Dados):** Toda despesa e fornecedor deve pertencer a um usuário específico, garantindo que um usuário nunca veja dados de outro.
* **RN02 (Consistência Orçamentária):** O sistema não deve permitir que o orçamento inicial de uma obra seja alterado para um valor menor do que o total de despesas já registradas.
* **RN03 (Unicidade de Fornecedor):** Não devem existir dois fornecedores com o mesmo CPF/CNPJ para o mesmo usuário.

## 🚫 6. Fora de Escopo (Non-goals)
* Emissão de Notas Fiscais (o sistema apenas importa).
* Gestão de cronograma físico da obra (Gantt, tarefas diárias).
* Processamento de pagamentos bancários (Pix, boleto) dentro da plataforma.

## ⚙️ 7. Requisitos Não Funcionais (Qualidade)
* **Segurança:** Criptografia de senhas (BCrypt) e proteção de rotas via JWT.
* **Responsividade:** O sistema deve ser acessível via navegadores mobile (UX prioritária para o canteiro de obras).
* **Performance:** A importação de NF-e deve ser processada em menos de 3 segundos.
* **Acessibilidade Web:** O aplicativo deve ser perfeitamente responsivo, permitindo a sua instalação na tela inicial do celular como um PWA (Progressive Web App) e garantindo acesso nativo à câmera pelo navegador.