# Obra Certa

**Status do Sistema**
[![CI - Develop (Laboratório)](https://github.com/utfpr-gp/obra-certa/actions/workflows/ci.yml/badge.svg)](https://github.com/utfpr-gp/obra-certa/actions/workflows/cy.yml)
[![CI - Main (Produção)](https://github.com/utfpr-gp/obra-certa/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/utfpr-gp/obra-certa/actions/workflows/cy.yml)


O **Obra Certa** é uma aplicação web voltada ao controle financeiro de obras residenciais, com foco em construções de pequeno e médio porte. A proposta surge diante da necessidade de uma solução digital que auxilie cidadãos e pequenos construtores a manterem um planejamento financeiro eficiente, especialmente diante do cenário de constantes aumentos nos custos da construção civil. Serão disponibilizadas funcionalidades como o registro de despesas, definição de orçamentos, controle de pagamentos pendentes e a geração de alertas preventivos, proporcionando maior segurança na gestão da obra. Dessa forma, o ObraCerta busca promover organização, previsibilidade e economia ao usuário final, tornando o acompanhamento dos gastos mais acessível e confiável.

##
🔗 **Link em Produção:** [Aguardando Deploy na Nuvem]

## 📃 Equipe    

Desenvolvido por: [Leandro Pires Nunes](https://github.com/lpn-leandro)\
Orientador: [Dr. Roni Fabio Banaszewski](https://ronifabio.github.io/)

## 📚 Documentação Oficial (Docs as Code)
Toda a especificação do sistema está versionada na pasta `/docs`:
* 📄 **[PRD (Product Requirements Document)](./docs/prd.md):** Visão do produto e User Stories.
* 📐 **[SDD (Software Design Document)](./docs/sdd.md):** Diagrama de banco de dados e contratos de API.
* ✅ **[Checklist de Avaliação](./docs/checklist.md):** Controle de entrega dos IDs e RAs.

## 🔗 Endpoints de documentação da API

- **Swagger UI:** [https://localhost:8080/swagger-ui.html](https://localhost:8080/swagger-ui.html)
- **Documentação JSON:** [https://localhost:8080/v3/api-docs](https://localhost:8080/v3/api-docs)

## 🌄 Layout

Os protótipos da aplicação estão disponíveis no [Figma](https://www.figma.com/design/uZ1iGjhqEolqt0XdYNzfth/ObraCerta?node-id=1-2&t=9WpBUUlnGZDrDqYD-1).

## 📒 Monografia

A monografia da aplicação pode ser acessada neste link: [Overleaf](https://www.overleaf.com/read/ybgjmhcnzbsg#1a550c)

## 🔧 Stack Tecnológica

### **Arquitetura**
- **[Arquitetura em Camadas]** - Organização do código em camadas(Controller, Service, Repository)
- **[Monorepo]** - Organização do código em um único repositório(backend e frontend)

### **Backend**

- **[Java 17](https://www.oracle.com/java)**
- **[Spring Boot 3](https://spring.io/projects/spring-boot)**
- **[Spring Security](https://spring.io/projects/spring-security)** – Controle de autenticação e autorização
- **[Postgresql](https://www.postgresql.org)** – Banco de dados relacional
- **[Swagger](https://swagger.io)** – Documentação automática da API
- **[Docker Compose](https://docs.docker.com/compose/)** – Orquestração de containers

### **Frontend**

- **[Angular](https://angular.io)**
- **[Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)** – Estilização moderna e responsiva

### **Infraestrutura e DevOps**

- **[Docker](https://www.docker.com/)** – Empacotamento e execução de serviços
- **[GitHub Actions](https://github.com/features/actions)** – CI/CD para automação de deploy
- **[Nginx](https://www.nginx.com/)** – Servidor reverso para balanceamento de carga

## 🛠️ Configuração e execução do projeto

### 1. Configuração dos arquivos `.env`

Configurar os seguintes arquivos `.env` com as variáveis de ambiente necessárias:

- **Na raiz do projeto:** `.env`
- **No backend:** `backend/.env`
- **No frontend:** `frontend/src/environments/environment.ts` (para desenvolvimento, use o arquivo `environment.dev.ts`)

Exemplo de configuração das variáveis de ambiente (arquivo `.env`):

```
DATASOURCE_URL=jdbc:postgresql://localhost:5432/obracerta_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=obracerta_db
```

> **Observação:** Certifique-se de comentar ou descomentar a linha correta no arquivo `application.properties` no backend para configurar o SSL ao rodar localmente ou via Docker.

### 2. Como executar a aplicação?

#### **2.1 Rodando localmente via IDE**

**Banco de Dados:**

Certifique-se de que o PostgreSQL está rodando na porta 5432
Crie o banco de dados manualmente (caso necessário):

```
CREATE DATABASE obracerta;
```

**Backend:**

Clonar o repositório:

```
git clone https://github.com/utfpr-gp/obracerta.git
cd obracerta
```

Configurar os arquivos .env conforme descrito anteriormente.
Abrir o backend em sua IDE (IntelliJ, Eclipse, etc.)
Verificar o arquivo application.properties
Rodar a aplicação Spring Boot pela classe principal

**Frontend:**

Acesse a pasta `frontend` e execute:

```
nvm install 20.9.0
nvm use 20.9.0
npm install
ng serve
```

O frontend estará disponível em [https://localhost:4200](https://localhost:4200)

#### 2.2 Rodando com Docker Compose

Configurar o arquivo `.env`
Construir e subir os containers:

```
docker compose build
docker compose up -d
```

Verifique se os containers estão rodando:

```
docker ps
```

Acesse a aplicação nos seguintes endereços:

- **API Backend:** [https://localhost:8080](https://localhost:8080)
- **Frontend:** [https://localhost:4200](https://localhost:4200)

## 🔧 Ferramentas recomendadas

- **IDE:** IntelliJ IDEA para backend e VSCode para frontend
- **Gerenciador de banco de dados:** MySQL Workbench ou outro de preferência
- **Cliente de API:** Postman (ou Insomnia, se preferir)

## 🔧 Observações adicionais

- O sistema está preparado para ser executado tanto localmente quanto em ambientes conteinerizados usando Docker.
- Para ambientes de produção, revise as configurações SSL corretamente para garantir a segurança.
