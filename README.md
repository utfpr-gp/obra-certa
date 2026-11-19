# 🏗️ ObraCerta! (Gestão de Obras Residenciais)

> **Aplicação web para planejamento e controle financeiro de obras residenciais autogeridas, proporcionando organização, previsibilidade orçamentária e acompanhamento em tempo real de despesas e pagamentos.**

---

## 📋 Materiais da entrega e acesso para avaliação

| Material | Link ou orientação |
| :--- | :--- |
| Código-fonte no GitHub | [utfpr-gp/obra-certa](https://github.com/utfpr-gp/obra-certa) |
| Vídeo de demonstração no YouTube | [Assistir à demonstração do ObraCerta](https://youtu.be/k70v65Q05CY) |
| Visibilidade do vídeo — público ou não listado | Não listado; acesso pelo link |
| Endereço de acesso ao sistema | [ObraCerta — acesso ao sistema](https://18-119-167-164.sslip.io/login) |
| E-mail da conta de teste no sistema publicado | `teste@teste.teste` |
| Senha da conta de teste no sistema publicado | `teste123` |
| Eventuais restrições de acesso aos materiais e suas justificativas | Não há restrições adicionais de acesso aos materiais. |

O vídeo de demonstração está não listado e pode ser acessado pelo link acima.
A conta de teste publicada deve ser exclusiva para demonstração, com dados fictícios.
**Recomenda-se que cada avaliador crie sua própria conta no sistema**, pela página
de cadastro (`/register`), para realizar os testes com seus próprios dados e evitar
interferências entre pessoas utilizando a conta de demonstração compartilhada.
As credenciais locais descritas abaixo não garantem acesso ao sistema publicado.

### Organização dos materiais

| Local | Conteúdo |
| :--- | :--- |
| [`apps/web`](./apps/web) | Código-fonte da interface Angular |
| [`apps/api`](./apps/api) | Código-fonte da API Java/Spring Boot, testes e migrações do banco |
| [`docs`](./docs) | Requisitos, arquitetura, design, jornadas e instruções de implantação |
| [`specs`](./specs) | Especificações e registros de revisão das entregas |
| [`deploy`](./deploy) | Configuração HTTPS, exemplos de ambiente e scripts de publicação, backup e restauração |
| [Monografia no Overleaf](https://www.overleaf.com/read/ybgjmhcnzbsg#1a550c) | Texto acadêmico do trabalho |
| [Protótipo no Figma](https://www.figma.com/design/uZ1iGjhqEolqt0XdYNzfth/ObraCerta?node-id=1-2&t=9WpBUUlnGZDrDqYD-1) | Protótipo e decisões visuais da interface |

### Autenticação e credenciais de teste

1. Abra o endereço do sistema e acesse a página de login (`/login`).
2. Preferencialmente, crie sua própria conta em `/register` e entre com as credenciais cadastradas. Para um acesso inicial, utilize o e-mail e a senha da conta de teste indicados na tabela acima.
3. Após entrar, selecione ou crie uma obra para acessar suas informações financeiras.
4. Se necessário, solicite a recuperação de senha em `/recuperar-senha`, usando um endereço de e-mail ao qual tenha acesso.

**Demonstração local:** no perfil `dev`, é possível criar dados fictícios adicionando
`SEED_ENABLED=true` ao `.env` da raiz e reiniciando a API. Em um banco de desenvolvimento
sem essa conta, o preenchimento de demonstração cria:

| Campo | Valor local |
| :--- | :--- |
| E-mail | `demo@obracerta.com` |
| Senha padrão | `demo1234` |

Se `SEED_PASSWORD` foi configurada, use o valor definido nesse ambiente. A criação
automática de dados de demonstração fica desativada por padrão e não roda no perfil
`prod`. Também é possível cadastrar uma conta própria para os testes locais.

### Restrições de acesso conhecidas

- As páginas de gestão e os dados financeiros exigem autenticação para proteger as informações de cada usuário.
- O endereço público utiliza o IP atual da EC2; caso esse IP mude, será necessário atualizar o endereço divulgado.
- Envio de e-mails e armazenamento de comprovantes exigem serviços externos configurados. Os modelos de ambiente são fornecidos, e as credenciais reais ficam fora do repositório.
- Não há restrições adicionais de acesso aos materiais entregues. O vídeo não listado está disponível para quem possui o link.

---

### 🚦 Status do Projeto & Deploy

- [![CI - Develop](https://github.com/utfpr-gp/obra-certa/actions/workflows/ci.yml/badge.svg)](https://github.com/utfpr-gp/obra-certa/actions/workflows/ci.yml)
- [![CI - Main](https://github.com/utfpr-gp/obra-certa/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/utfpr-gp/obra-certa/actions/workflows/ci.yml)
- ☁️ **Hospedagem:** interface web e API na EC2, com banco Aurora PostgreSQL Express na AWS. [Acessar o sistema via HTTPS](https://18-119-167-164.sslip.io/login).
- **Validação de acesso em 18/11/2026:** página de login com HTTP 200 em HTTPS, redirecionamento HTTP → HTTPS e API de gestão retornando HTTP 401 sem autenticação. Os fluxos completos de uso continuam em validação.

---

## 👥 Autores & Equipe

- **Desenvolvedor:** [Leandro Pires Nunes](https://github.com/lpn-leandro)
- **Orientador:** [Prof. Dr. Roni Fabio Banaszewski](https://ronifabio.github.io/)
- **Instituição:** Universidade Tecnológica Federal do Paraná (UTFPR - Campus Guarapuava)
- 📒 **Monografia:** [Overleaf](https://www.overleaf.com/read/ybgjmhcnzbsg#1a550c) | 🎨 **Protótipo Figma:** [Figma Design](https://www.figma.com/design/uZ1iGjhqEolqt0XdYNzfth/ObraCerta?node-id=1-2&t=9WpBUUlnGZDrDqYD-1)

---

## 📚 Documentação do Projeto (Docs as Code)

Toda a especificação formal do sistema segue a metodologia **Spec-Driven Development (SDD)** e está versionada na pasta [`/docs`](./docs):

- 📄 **[PRD (Product Requirements Document)](./docs/prd.md):** Visão do produto, glossário ubíquo, atores e histórias de usuário com status explícitos.
- 📐 **[Arquitetura do Sistema](./docs/architecture.md):** Estrutura do monorepo, modelo de dados (ER), padrões arquiteturais, segurança e contratos da API.
- 📎 **[Supabase Storage para comprovantes](./docs/supabase-storage.md):** Buckets privados por ambiente e campos a preencher no `.env` da raiz para execução nativa ou via Compose.
- ☁️ **[Deploy na AWS](./docs/deploy-aws.md):** EC2, Aurora PostgreSQL Express com IAM, HTTPS, configuração de produção, backup e restauração.
- 🔄 **[Jornadas do Usuário (User Flows)](./docs/user-flows.md):** Fluxos de navegação, decisões do sistema e mitigação de pontos de desistência/falha.
- 🎨 **[Tokens de Design & Protótipo](./docs/design-tokens.md):** Paleta de cores, tipografia, estados de botões e especificação das telas principais.
- 📑 **[Especificações por Issue](./specs/README.md):** Índice de especificações técnicas das histórias em desenvolvimento.

---

## 🔧 Stack Tecnológica

- **Arquitetura:** Monorepo com Arquitetura em Camadas (Controller, Service, Repository)
- **Backend:** Java, Spring Boot, Spring Security (Autenticação Stateless com JWT), Spring Data JPA
- **Frontend:** Angular (Standalone Components, Modern Control Flow), Tailwind CSS, DaisyUI, Lucide Icons
- **Banco de Dados:** PostgreSQL (Ambiente local via Docker / Produção no AWS Aurora PostgreSQL Express)
- **DevOps & Infra:** Docker, Docker Compose, Nginx, Caddy e GitHub Actions (CI). A publicação na AWS é realizada pelos scripts de implantação.

---

## 🔐 Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto a partir do modelo `.env.example`.

| Variável | Descrição / Finalidade | Escopo |
| :--- | :--- | :--- |
| `POSTGRES_DB` | Nome do banco de dados relacional | Docker / Backend |
| `POSTGRES_USER` | Usuário de autenticação do PostgreSQL | Docker / Backend |
| `POSTGRES_PASSWORD` | Senha do usuário do banco de dados | Docker / Backend |
| `SPRING_DATASOURCE_URL` | String de conexão JDBC com o PostgreSQL | Docker / Backend |
| `JWT_SECRET` | Chave criptográfica para assinatura e validação dos tokens JWT | Backend |
| `SPRING_PROFILES_ACTIVE` | Perfil de execução do Spring Boot (`dev`, `prod`, `test`) | Backend |
| `FRONTEND_URL` | URL pública do frontend usada no link de recuperação de senha | Backend |
| `CORS_ALLOWED_ORIGINS` | Origens autorizadas no CORS, separadas por vírgula | Backend |
| `MAIL_FROM` | Remetente autorizado para os e-mails de recuperação | Backend |
| `SMTP_HOST`, `SMTP_PORT` | Servidor e porta de envio SMTP | Backend |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | Credenciais SMTP do remetente | Backend |

> ⚠️ **Atenção:** Nunca comite arquivos `.env` contendo credenciais ou chaves reais no repositório.

---

## 🚀 Quick Start (Como Executar)

### Pré-requisitos

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados **OU**
- [Java 21 LTS](https://adoptium.net/), [Node.js 22 LTS](https://nodejs.org/) e [PostgreSQL 16](https://www.postgresql.org/) instalados localmente.

---

### Opção 1: Executando via Docker Compose (Recomendado)

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/utfpr-gp/obra-certa.git
   cd obra-certa
   ```

2. **Configure o arquivo de ambiente:**
   ```bash
   cp .env.example .env
   ```
   Para este modo de execução, defina `FRONTEND_URL=http://localhost` no `.env`, para que os links de recuperação de senha apontem para o frontend na porta 80. Preencha os serviços externos conforme as instruções de ambiente.

3. **Construa e inicie os contêineres:**
   ```bash
   docker compose up --build -d
   ```

4. **Acesse as aplicações:**
   - **Frontend (Web):** [http://localhost](http://localhost) — porta 80.
   - **Base da API REST:** [http://localhost:8080/obracerta](http://localhost:8080/obracerta). As operações de gestão exigem autenticação.

O Compose acima é destinado ao desenvolvimento local. Para publicar na AWS, siga
o [roteiro de produção](./docs/deploy-aws.md), que utiliza o arquivo independente
`docker-compose.prod.yml` e o modelo `deploy/.env.example`.

---

### Opção 2: Executando Localmente (Ambiente de Desenvolvimento)

#### 1. Banco de Dados (PostgreSQL)
Certifique-se de que uma instância do PostgreSQL esteja ativa na porta `5432` com o banco `obracerta` criado:
```sql
CREATE DATABASE obracerta;
```

#### 2. Backend (Spring Boot)
1. Acesse o diretório da API (Backend):
   ```bash
   cd apps/api
   ```
2. Configure as variáveis de ambiente necessárias ou use as configurações padrão de `src/main/resources/application-dev.properties`. Para comprovantes, preencha manualmente `RECEIPT_STORAGE_*` no `.env` da raiz conforme o [roteiro Supabase](./docs/supabase-storage.md); o Spring carrega esse arquivo ao executar de `apps/api` ou da raiz.
3. Execute o servidor de desenvolvimento:
   ```bash
   ./mvnw spring-boot:run
   ```
   *(No Windows PowerShell, utilize `.\mvnw.cmd spring-boot:run`)*

#### 3. Frontend (Angular)
1. Em outro terminal, acesse o diretório web (Frontend):
   ```bash
   cd apps/web
   ```
2. Instale as dependências:
   ```bash
   npm ci
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm start
   ```
4. Acesse no navegador: [http://localhost:4200](http://localhost:4200)

---

## 🧭 Como utilizar o sistema

1. **Cadastre-se e entre:** utilize sua conta ou a conta de demonstração do ambiente.
2. **Crie ou selecione uma obra:** informe os dados da obra para organizar seus lançamentos.
3. **Defina os orçamentos:** acesse **Orçamentos** e informe os valores planejados por categoria.
4. **Registre as despesas:** acesse **Contas**, cadastre a despesa e informe categoria, fornecedor, valor, datas e situação de pagamento. Anexe comprovantes quando o armazenamento estiver configurado.
5. **Acompanhe os pagamentos:** consulte as contas a pagar e marque como pagas as despesas quitadas.
6. **Confira os resultados:** use a página inicial e **Relatórios** para comparar o planejado com o gasto e acompanhar os saldos.
7. **Importe notas, se necessário:** utilize a importação de XML de NF-e e revise os dados antes de confirmar o lançamento.

---

## ✉️ Recuperação de senha

A recuperação de senha está em `/recuperar-senha`. Configure `FRONTEND_URL`,
`MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME` e `SMTP_PASSWORD` no
ambiente da API, conforme `.env.example`. Em produção, a URL pública deve usar HTTPS
e o SMTP deve aceitar STARTTLS. No desenvolvimento, um capturador SMTP local pode
escutar na porta 1025 com `SMTP_AUTH=false` e `SMTP_STARTTLS=false`.
Ao usar a API em Docker, `SMTP_HOST` deve apontar para um endereço acessível pelo
container. O Flyway aplica a migration V14 na inicialização.

O link expira em 30 minutos e é consumido ao redefinir a senha. Existe intervalo
mínimo de 60 segundos entre solicitações para o mesmo endereço. O envio é
processado em segundo plano; falhas SMTP geram um aviso no log sem expor dados do
usuário. Após configurar o remetente, valide a entrega na caixa de entrada e no
spam do destinatário. Os JWTs já emitidos seguem válidos até a expiração existente.

## 🧪 Executando os Testes Automatizados

- **Testes da API (Backend):**
  ```bash
  cd apps/api
  ./mvnw test
  ```

- **Testes da Aplicação Web (Frontend):**
  ```bash
  cd apps/web
  npm test
  ```
