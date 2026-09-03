# 📄 Product Requirements Document (PRD) - ObraCerta!

**Projeto:** ObraCerta (Gestão de Obras Residenciais)  
**Status do Documento:** 🟢 Definido (Fase 0 - SDD)  
**Versão:** 1.0.0 (Refinada para Negócio com Base em Dados Reais)  

---

## 🎯 1. Visão Geral e Objetivo
O **ObraCerta** é uma aplicação web voltada ao controle financeiro e planejamento orçamentário de obras residenciais autogeridas, com foco em construções e reformas de pequeno e médio porte realizadas diretamente por proprietários sem acompanhamento profissional contínuo. Diante do cenário de constante elevação dos custos da construção civil e da informalidade na gestão dos recursos, a aplicação resolve a falta de previsibilidade financeira e o risco de paralisação da obra por estouro de orçamento.
A plataforma oferece um ambiente centralizado e intuitivo para definição de orçamentos iniciais por categoria, registro detalhado de despesas (materiais, mão de obra e serviços), controle preventivo de pagamentos pendentes com emissão de alertas e importação automatizada de dados fiscais via chave de acesso da Nota Fiscal Eletrônica (NF-e). Com isso, o ObraCerta promove transparência, organização e economia, viabilizando o acompanhamento financeiro contínuo do planejamento até a conclusão da construção.

## 📖 2. Glossário Ubíquo
Este glossário estabelece a correspondência obrigatória entre a linguagem de negócio (PT-BR) e as entidades de código e banco de dados (EN):
| Termo do Negócio (PT-BR) | Entidade no Código (EN) | Tabela Banco | Atributos Principais |
| :--- | :--- | :--- | :--- |
| **Usuário** | `User` | `users` | `id, name, email, password, userRole, createdAt, updatedAt` |
| **Categoria de Despesa** | `ExpenseCategory` | `expense_categories` | `id, name, createdAt, updatedAt` |
| **Fornecedor** | `Supplier` | `suppliers` | `id, name, document, email, phone, createdAt, updatedAt` |
| **Orçamento Inicial** | `Budget` | `budgets` | `id, user, category, estimatedAmount, createdAt, updatedAt` |
| **Despesa** | `Expense` | `expenses` | `id, budget, user, category, supplier, type, description, quantity, unit, unitPrice, totalPrice, purchaseDate, receiptUrl, nfeKey, createdAt, updatedAt` |
| **Pagamento Pendente** | `PendingPayment` | `pending_payments` | `id, expense, dueDate, createdAt` |
| **Notificação / Alerta** | `Notification` | `notifications` | `id, user, message, type, createdAt` |


## 👤 3. Atores e Permissões
- **Visitante:** Usuário não autenticado. Pode visualizar a página institucional de apresentação, acessar a tela de login e realizar seu autocadastro.
* **Usuário (Proprietário/Gestor, `ROLE_USER`):** Ator principal autenticado. Possui acesso exclusivo aos seus próprios orçamentos, despesas, fornecedores, pagamentos pendentes, relatórios e notificações.
* **Administrador (`ROLE_ADMIN`):** Responsável pela manutenção global, monitoramento do sistema e gestão da base de usuários (incluindo alteração de perfis de acesso).
* **Sistema (Automático):** Processa cálculos de saldos orçamentários, valida regras de teto de gastos, consulta a API da SEFAZ para NF-e e dispara alertas de vencimento.
---
## 📝 4. Histórias de Usuário e Critérios de Aceitação
> **Convenção de Status SDD:**  
> 🟢 **Live** — Implementada, testada e funcionando no sistema.  
> 🟡 **Ready** — Regras e critérios definidos, pronta para virar Issue e ser desenvolvida.  
> ⚪ **Draft** — Rascunho / funcionalidade futura fora do MVP. **Não codificar.**
---

### 🟢 HU01 - Cadastro de Usuário (Must Have)
**Status:** 🟢 Live  
**Ator:** Visitante  
**História:** Como visitante, quero me registrar no sistema informando meus dados, para que eu possa criar uma conta e acessar a plataforma.
**✅ Critérios de Aceitação:**
- [x] O formulário deve exigir nome completo (mínimo 3 caracteres), e-mail válido, senha (mínimo 6 caracteres) e confirmação de senha idêntica.
- [x] O sistema deve validar a unicidade do e-mail no banco de dados e retornar erro claro caso já exista.
- [x] A senha deve ser gravada com criptografia forte (BCrypt) antes de persistir no banco.
- [x] Após cadastro com sucesso, o usuário deve ser redirecionado para a tela de login.
---
### 🟢 HU02 - Autenticação (Login e Logout) (Must Have)
**Status:** 🟢 Live  
**Ator:** Usuário  
**História:** Como usuário cadastrado, quero autenticar com meu e-mail e senha, para acessar meus dados com segurança.
**✅ Critérios de Aceitação:**
- [x] O sistema deve autenticar as credenciais e emitir um token JWT stateless com prazo de expiração configurado.
- [x] Rotas privadas no frontend devem ser bloqueadas para usuários não autenticados via `authGuard`.
- [x] O token JWT deve ser anexado automaticamente no cabeçalho `Authorization: Bearer <token>` de cada requisição via `authInterceptor`.
- [x] A opção de logout deve limpar o token armazenado e redirecionar para a página inicial.
---
### 🟡 HU03 - Cadastro de Despesas (Must Have)
**Status:** 🟡 Ready  
**Ator:** Usuário  
**História:** Como usuário, quero cadastrar despesas discriminadas por material, mão de obra ou serviço, para registrar os custos ocorridos na obra.
**✅ Critérios de Aceitação:**
- [ ] O usuário deve selecionar o tipo da despesa (`Material`, `Mão de Obra` ou `Serviço`), categoria, fornecedor e data da compra.
- [ ] Quando informado quantidade e preço unitário, o sistema deve calcular automaticamente o valor total (`quantidade * precoUnitario`).
- [ ] Deve permitir anexar comprovante digital (upload de foto do recibo ou nota fiscal).
- [ ] Deve permitir indicar se a despesa já foi quitada ou se gera um pagamento pendente com data de vencimento futura.
---
### 🟡 HU04 - Edição e Exclusão de Despesas (Must Have)
**Status:** 🟡 Ready  
**Ator:** Usuário  
**História:** Como usuário, quero editar ou excluir despesas registradas, para corrigir inconsistências ou remover lançamentos incorretos.
**✅ Critérios de Aceitação:**
- [ ] O usuário só pode editar ou excluir despesas pertencentes à sua própria conta.
- [ ] A alteração nos valores da despesa deve recalcular imediatamente o saldo do orçamento correspondente.
- [ ] A exclusão de uma despesa deve exibir modal de confirmação antes de efetivar a remoção física/lógica.
- [ ] Se a despesa excluída possuir pagamento pendente vinculado, o registro de pagamento deve ser removido em cascata.
---
### 🟡 HU05 - Visualização e Filtros de Gastos (Must Have)
**Status:** 🟡 Ready  
**Ator:** Usuário  
**História:** Como usuário, quero visualizar a listagem de despesas e aplicar filtros, para analisar gastos específicos por período, categoria ou fornecedor.
**✅ Critérios de Aceitação:**
- [ ] A listagem deve exibir descrição, categoria, fornecedor, valor total, data e status de pagamento.
- [ ] O usuário deve poder filtrar por intervalo de datas (data inicial e data final), categoria e fornecedor.
- [ ] O sistema deve exibir um card totalizador com a soma exata das despesas filtradas na tela.
- [ ] Deve permitir ordenação dinâmica por data (mais recente/antiga) e por valor (maior/menor).
---
### 🟡 HU06 - Relatórios e Gráficos de Gastos (Must Have)
**Status:** 🟡 Ready  
**Ator:** Usuário  
**História:** Como usuário, quero visualizar gráficos e exportar relatórios dos gastos, para avaliar a distribuição dos custos da construção.
**✅ Critérios de Aceitação:**
- [ ] O sistema deve renderizar gráfico de pizza com a distribuição percentual de gastos por categoria.
- [ ] O sistema deve renderizar gráfico de barras comparando o valor orçado versus o valor real gasto por categoria.
- [ ] O usuário deve poder gerar e baixar o relatório financeiro consolidado em formato PDF.
---
### 🟡 HU07 - Orçamento Inicial e Comparação com Gastos (Must Have)
**Status:** 🟡 Ready  
**Ator:** Usuário  
**História:** Como usuário, quero cadastrar um orçamento previsto por categoria, para acompanhar o consumo do teto financeiro durante a obra.
**✅ Critérios de Aceitação:**
- [ ] O usuário deve definir o valor estimado para cada categoria cadastrada (Alvenaria, Elétrica, Hidráulica, Acabamento, etc.).
- [ ] O painel deve exibir barra de progresso visual (% consumida do orçamento por categoria e global).
- [ ] O sistema deve emitir alerta visual quando o valor gasto atingir 90% ou ultrapassar 100% do orçamento previsto.
- [ ] O sistema deve impedir a redução de um orçamento para valor inferior ao total já gasto na categoria (RN02).
---
### 🟡 HU08 - Notificações de Pagamentos Pendentes (Must Have)
**Status:** 🟡 Ready  
**Ator:** Usuário  
**História:** Como usuário, quero visualizar notificações de contas a pagar próximas ao vencimento, para evitar atrasos e incidência de juros.
**✅ Critérios de Aceitação:**
- [ ] O painel principal (Home) deve listar em destaque todos os pagamentos pendentes com vencimento nos próximos 7 dias.
- [ ] O sistema deve sinalizar em vermelho contas vencidas e em amarelo contas a vencer nos próximos 3 dias.
- [ ] O usuário deve poder marcar um pagamento pendente como "Pago", atualizando o status da despesa.
---
### 🟡 HU09 - Importação de Despesas via Nota Fiscal Eletrônica (NF-e) (Must Have)
**Status:** 🟡 Ready  
**Ator:** Usuário  
**História:** Como usuário, quero importar os dados de uma compra através da chave de acesso de 44 dígitos da NF-e, para evitar digitação manual de itens.
**✅ Critérios de Aceitação:**
- [ ] O usuário deve inserir a chave de acesso de 44 dígitos da NF-e.
- [ ] O sistema deve validar o formato numérico da chave antes da consulta externa à API da SEFAZ.
- [ ] Os dados retornados (Razão Social/Fornecedor, CNPJ, Data de Emissão, Valor Total e Chave) devem pré-preencher o formulário de despesa.
- [ ] O usuário deve revisar e confirmar a categoria antes de salvar o registro final no banco de dados.
---
### 🟡 HU10 - Solicitação de Orçamentos Automatizada (Should Have)
**Status:** 🟡 Ready  
**Ator:** Usuário  
**História:** Como usuário, quero disparar listas de materiais por e-mail para fornecedores cadastrados, para comparar cotações de preços.
**✅ Critérios de Aceitação:**
- [ ] O usuário seleciona os materiais e quantidades desejadas.
- [ ] O sistema gera mensagem padronizada e envia para o e-mail do fornecedor selecionado.
- [ ] O sistema registra o status da solicitação (`Enviada`, `Respondida`, `Cancelada`).
---
### 🟡 HU11 - Localização de Fornecedores Próximos (Should Have)
**Status:** 🟡 Ready  
**Ator:** Usuário  
**História:** Como usuário, quero visualizar fornecedores em um mapa interativo, para planejar compras presenciais e logística.
**✅ Critérios de Aceitação:**
- [ ] O sistema deve exibir os fornecedores cadastrados em mapa com base no endereço/geolocalização.
- [ ] Ao clicar no marcador do fornecedor, deve exibir nome, telefone e categorias atendidas.
---
### ⚪ HU12 - Banco de Preços Colaborativo (Could Have)
**Status:** ⚪ Draft  
**Ator:** Usuário  
**História:** Como usuário, quero consultar a média de preços pagos por materiais na minha região geográfica, para avaliar se as cotações estão justas.
---
### ⚪ HU13 - Avaliação de Fornecedores (Could Have)
**Status:** ⚪ Draft  
**Ator:** Usuário  
**História:** Como usuário, quero avaliar o atendimento e pontualidade de fornecedores, para registrar um histórico qualitativo de parceiros.
---
### ⚪ HU14 - Integração com WhatsApp (Won't Have This Time)
**Status:** ⚪ Draft  
**Ator:** Usuário  
**História:** Como usuário, quero iniciar conversa no WhatsApp do fornecedor com mensagem padrão pré-preenchida.
---
### ⚪ HU15 - Atualização Automática de Preços via NF-e (Won't Have This Time)
**Status:** ⚪ Draft  
**Ator:** Usuário  
**História:** Como usuário, quero que o banco colaborativo de preços seja atualizado automaticamente após a importação de cada NF-e.
---

## 🛡️ 5. Regras de Negócio (Constraints)
- **RN01 (Isolamento de Dados / Multitenancy Lógico):** Um usuário nunca pode visualizar, editar ou excluir orçamentos, despesas, fornecedores ou pagamentos de outro usuário.
- **RN02 (Consistência Orçamentária):** O valor do orçamento estimado de uma categoria não pode ser editado para um montante inferior ao total de despesas já consumidas nessa mesma categoria.
- **RN03 (Integridade da Chave Fiscal):** Não é permitida a duplicação do cadastro da mesma chave de acesso de 44 dígitos da NF-e para o mesmo usuário.
- **RN04 (Vínculo Obrigatório de Despesa):** Toda despesa deve estar vinculada a um usuário, a uma categoria válida e a um fornecedor.
- **RN05 (Gestão de Contas a Pagar):** Despesas marcadas como não quitadas devem gerar obrigatoriamente um registro em `pending_payments` com data de vencimento estipulada.
---

## 🚫 6. Fora de Escopo (Non-goals)
- Emissão de notas fiscais ou faturas pelo sistema (a aplicação apenas consome/importa).
- Gerenciamento de cronograma físico executivo (gráfico de Gantt de serviços de pedreiros/empreiteiros).
- Processamento de pagamentos bancários transacionais (Pix, cartão ou boleto com liquidação financeira dentro do app).
- Envio automatizado de mensagens via bot de WhatsApp.
---

## ⚙️ 7. Requisitos Não Funcionais (RNF)

- **RNF01 (Desempenho):** O tempo de resposta para consultas de filtros e totalizadores deve ser inferior a 2 segundos para bases de até 100.000 despesas.
- **RNF02 (Segurança):** Todas as senhas devem ser armazenadas com hash BCrypt. As comunicações em trânsito devem exigir HTTPS/TLS.
- **RNF03 (Autenticação Stateless):** Sessões autenticadas via tokens JWT transmitidos no header `Authorization`.
- **RNF04 (Usabilidade e Responsividade):** A interface web deve ser totalmente responsiva (mobile, tablet e desktop) utilizando Tailwind CSS e DaisyUI, com suporte a modo escuro.
- **RNF05 (Privacidade):** Em conformidade com a LGPD, o usuário pode solicitar a exclusão definitiva de sua conta e de todos os seus registros financeiros associados.