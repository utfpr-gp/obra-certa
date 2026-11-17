# 🏗️ ObraCerta! (Gestão de Obras Residenciais)

> **Aplicação web para planejamento e controle financeiro de obras residenciais autogeridas, proporcionando organização, previsibilidade orçamentária e acompanhamento em tempo real de despesas e pagamentos.**

---

### 🚦 Status do Projeto & Deploy

- [![CI - Develop](https://github.com/utfpr-gp/obra-certa/actions/workflows/ci.yml/badge.svg)](https://github.com/utfpr-gp/obra-certa/actions/workflows/ci.yml)
- [![CI - Main](https://github.com/utfpr-gp/obra-certa/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/utfpr-gp/obra-certa/actions/workflows/ci.yml)
- 🔗 **Link da Aplicação em Produção:** [https://obracerta.app](https://obracerta.app) *(Aguardando Deploy)*

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
- 🔄 **[Jornadas do Usuário (User Flows)](./docs/user-flows.md):** Fluxos de navegação, decisões do sistema e mitigação de pontos de desistência/falha.
- 🎨 **[Tokens de Design & Protótipo](./docs/design-tokens.md):** Paleta de cores, tipografia, estados de botões e especificação das telas principais.
- 📑 **[Especificações por Issue](./specs/README.md):** Índice de especificações técnicas das histórias em desenvolvimento.

---

## 🔧 Stack Tecnológica

- **Arquitetura:** Monorepo com Arquitetura em Camadas (Controller, Service, Repository)
- **Backend:** Java, Spring Boot, Spring Security (Autenticação Stateless com JWT), Spring Data JPA
- **Frontend:** Angular (Standalone Components, Modern Control Flow), Tailwind CSS, DaisyUI, Lucide Icons
- **Banco de Dados:** PostgreSQL (Ambiente local via Docker / Nuvem via Neon Serverless Postgres)
- **DevOps & Infra:** Docker, Docker Compose, Nginx, GitHub Actions (CI/CD)

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
- [Java 21 LTS](https://adoptium.net/), [Node.js 22+ (LTS)](https://nodejs.org/) e [PostgreSQL 16](https://www.postgresql.org/) instalados localmente.

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

3. **Construa e inicie os contêineres:**
   ```bash
   docker compose up --build -d
   ```

4. **Acesse as aplicações:**
   - **Frontend (Web):** [http://localhost:80](http://localhost:80) ou [http://localhost:4200](http://localhost:4200)
   - **Backend (API REST):** [http://localhost:8080](http://localhost:8080)
   - **Documentação da API (Swagger UI):** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

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
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm start
   ```
4. Acesse no navegador: [http://localhost:4200](http://localhost:4200)

---

## 🧪 Executando os Testes Automatizados

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
