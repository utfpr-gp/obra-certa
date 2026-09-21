# 📋 Spec #005: Entidade Project (Obra) e Associação com Budgets e Expenses

**Status:** ⚪ Aguardando Implementação  
**Prioridade:** Alta (Bloqueante para suporte Multi-Obra)  
**Camada:** Backend (`apps/api`)  

---

## 🎯 Objetivo
Permitir que cada usuário cadastrado gerencie **múltiplas obras/projetos independentes** no sistema ObraCerta, associando os orçamentos (`budgets`) e as despesas (`expenses`) a um `project_id` específico em vez de ficarem vinculados apenas globalmente ao usuário.

---

## 📦 Requisitos & Modelo de Dados

### 1. Tabela `projects`
- `id`: UUID (PK)
- `user_id`: UUID (FK -> `users.id`, nullable = false) — Dono da obra
- `name`: VARCHAR(255) (nullable = false) — Ex: "Construção Casa Praia"
- `type`: VARCHAR(50) — Ex: "Construção Nova", "Reforma", "Ampliação"
- `location`: VARCHAR(255) — Ex: "Guaratuba · PR"
- `status`: VARCHAR(30) — Ex: "EM_ANDAMENTO", "CONCLUIDA", "PAUSADA"
- `created_at`: TIMESTAMP (auditoria)
- `updated_at`: TIMESTAMP (auditoria)

### 2. Atualização em `budgets` e `expenses`
- Adicionar coluna `project_id` (FK -> `projects.id`, nullable = false).
- Atualizar anotações JPA `@ManyToOne` em `Budget.java` e `Expense.java`.

---

## 🚀 Endpoints REST
- `GET /api/projects`: Lista apenas as obras pertencentes ao usuário autenticado (via Token JWT).
- `GET /api/projects/{id}`: Detalhes de uma obra específica (com validação de autorização anti-IDOR).
- `POST /api/projects`: Criação de uma nova obra vinculando o usuário autenticado.
- `PUT /api/projects/{id}`: Atualização dos dados da obra.
- `DELETE /api/projects/{id}`: Exclusão lógica ou em cascata da obra e seus lançamentos.

---

## ✅ Critérios de Aceite
1. Um usuário não pode visualizar, editar ou excluir obras pertencentes a outro usuário.
2. Todas as despesas e orçamentos registrados devem conter um `project_id` válido.
3. Testes unitários e de integração no Spring Boot cobrindo o fluxo de CRUD e segurança com 100% de sucesso.
