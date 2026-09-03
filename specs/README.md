# 📑 Índice de Especificações Técnicas (Specs)

Este diretório centraliza todas as ordens de serviço e planos de implementação de cada história/issue desenvolvida na metodologia **Spec-Driven Development (SDD)**.

---

## 📋 Tabela de Rastreabilidade

| Issue | Spec (Diretório) | Estado | Observação |
| :---: | :--- | :---: | :--- |
| `#01` | `specs/001-cadastro-usuario/` | `🟢 Implementada` | Cadastro de usuário com validação de unicidade e BCrypt (HU01). |
| `#02` | `specs/002-autenticacao-jwt/` | `🟢 Implementada` | Login com emissão de token JWT, authGuard e authInterceptor (HU02). |
| `#03` | `specs/003-home-page-scaffold/` | `🟡 Aberta` | Scaffold da tela inicial com layout DaisyUI e dados mockados temporários. |
| `#04` | `specs/004-gestao-orcamento/` | `⚪ Aguardando` | CRUD de orçamentos por categoria e cálculo de progresso (HU07). |

---

> **Regra Metodológica:** Para cada nova funcionalidade iniciada no GitHub Projects, cria-se uma pasta `specs/<numero-da-issue>-<slug>/` contendo:
> - `spec.md`: O que precisa existir, critérios de aceite verificáveis e o que está fora de escopo.
> - `plan.md`: Como será construído, em tarefas pequenas com TDD e revisões cruzadas.
