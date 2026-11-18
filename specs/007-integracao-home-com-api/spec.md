# 📋 Spec #007: Integração da Home-Page com os Endpoints Reais da API

**Status:** ⚪ Aguardando Implementação  
**Prioridade:** Alta  
**Camada:** Frontend (`apps/web`)  

---

## 🎯 Objetivo
Conectar a Home-Page (Dashboard da Obra) do Angular aos endpoints REST reais do backend Spring Boot (`/api/projects`, `/api/projects/{id}/dashboard`), substituindo os dados mockados em memória pelo consumo via `HttpClient` com autenticação JWT.

---

## 📦 Componentes & Serviços
1. **`ProjectService` (`apps/web/src/app/core/services/project.service.ts`):**
   - `getProjects(): Observable<Obra[]>`
   - `getProjectDashboard(id: string): Observable<DashboardSummary>`
   - `createProject(dto: CreateProjectDTO): Observable<Obra>`
2. **Atualização do `HomePage` & `NavbarComponent`:**
   - Injeção do `ProjectService`.
   - Gerenciamento de estado de carregamento (*Loading skeletons / Spinners DaisyUI*).
   - Tratamento amigável de erros de conexão e estado vazio (*Nenhuma obra cadastrada*).

---

## ✅ Critérios de Aceite
1. A Home-Page carrega os dados reais da API após o login com sucesso.
2. Trocar de obra na Navbar dispara a busca dos dados da nova obra ativa.
3. Tratamento de token expirado redirecionando automaticamente para `/login`.
4. Cobertura de testes unitários com `provideHttpClientTesting()`.
