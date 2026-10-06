# 📋 Spec #006: Data Seeder / Factory de Dados de Demonstração (Perfil Dev)

**Status:** ⚪ Aguardando Implementação  
**Prioridade:** Média  
**Camada:** Backend (`apps/api`)  

---

## 🎯 Objetivo
Criar um mecanismo de inicialização de dados (*Data Seeder / Factory*) no Spring Boot que seja executado automaticamente ao iniciar a aplicação com o perfil de desenvolvimento (`dev`), populando o banco PostgreSQL com dados realistas e completos para testes imediatos da equipe e do frontend.

---

## 📦 Dados a Serem Injetados

1. **Usuário Padrão:**
   - Nome: `Leandro Nunes`
   - E-mail: `leandro@exemplo.com` (Senha criptografada com BCrypt)
   - Role: `USER`

2. **Categorias de Despesa Padrão:**
   - Fundação, Alvenaria, Elétrica, Hidráulica, Mão de Obra, Acabamento e Pintura, Taxas/Serviços.

3. **Fornecedores de Exemplo:**
   - Madeireira Carvalho, Depósito Cimento & Cia, Elétrica Fortaleza, Hidráulica Sul, Eng. Carlos + Equipe.

4. **Obras / Projetos com Despesas e Orçamentos:**
   - "Construção Casa Praia" (com 7 categorias, orçamentos e 5 despesas reais)
   - "Reforma Banheiro Suíte"
   - "Edícula Fundos"
   - "Sobrado Vila Bela"
   - "Telhado Chácara"

---

## ✅ Critérios de Aceite
1. O seeder roda apenas quando o perfil ativo for `dev` (usando `@Profile("dev")`).
2. A execução é idempotente (verifica se os dados já existem antes de inserir para não duplicar).
3. Não afeta o ambiente de produção nem os testes unitários isolados.
