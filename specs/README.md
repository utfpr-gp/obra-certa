# 📑 Índice de Especificações Técnicas (Specs)

Este diretório centraliza todas as ordens de serviço e planos de implementação de cada história/issue desenvolvida na metodologia **Spec-Driven Development (SDD)**.

---

## 📋 Tabela de Rastreabilidade

| Issue | Spec (Diretório) | Estado | Observação |
| :---: | :--- | :---: | :--- |
| `#01` | `specs/001-cadastro-usuario/` | `🟢 Implementada` | Cadastro de usuário com validação de unicidade e BCrypt (HU01). |
| `#02` | `specs/002-autenticacao-jwt/` | `🟢 Implementada` | Login com emissão de token JWT, authGuard e authInterceptor (HU02). |
| `#03` | `specs/003-home-page-scaffold/` | `🟢 Implementada` | Scaffold da tela inicial com layout DaisyUI e componentes reativos. |
| `#04` | `specs/004-gestao-orcamento/` | `⚪ Aguardando` | CRUD de orçamentos por categoria e cálculo de progresso (HU07). |
| `#05` (legado) | `specs/005-entidade-project-e-crud/` | `⚪ Planejada` | Registro histórico de planejamento de `Project`; numeração legada distinta da referência local #5 da US03. |
| `#5` (local) | [specs/5-cadastro-despesas/](5-cadastro-despesas/) | `🟢 Implementada` | US03: oito tarefas originais concluídas e revisadas, incluindo comprovantes no Supabase, tag/reenvio e isolamento do contexto da obra. Idempotência e recuperação de sessão retiradas pelo autor. Fechamento documental e correção AF-01 concluídos; nova tarefa 9 aprovada nas duas revisões, sem restaurar o escopo retirado. Nova auditoria e PR pendentes; vínculo remoto não confirmado. |
| `#6` | [specs/6-edicao-exclusao-despesas/](6-edicao-exclusao-despesas/) | `🟢 Implementada` | US04: sete tarefas concluídas e revisadas; edição, situação de pagamento, comprovantes e exclusão lógica pela consulta individual. Ajustes visuais e retorno para Contas a Pagar entregues. Fechamento documental concluído; auditoria final aprovada em 01/11/2026 e PR em preparação, sem declaração de implantação. |
| `#06` (legado) | `specs/006-data-seeder-factory/` | `⚪ Planejada` | Data Seeder / Factory para popular banco com obras de exemplo no perfil Dev; numeração legada distinta da Issue #6 da US04. |
| `#07` | `specs/007-integracao-home-com-api/` | `⚪ Planejada` | Integração do frontend (Home-page e Navbar) com a API REST real. |
| `#09` | [specs/09-gestao-orcamento/](09-gestao-orcamento/) | `🟢 Implementada` | US07: tetos por categoria, painel de consumo, alertas, zeramento e isolamento por usuário. Dez tarefas e ajustes revisados; auditoria final e PR pendentes. |
| `#27` | `specs/27-gestao-projetos/` | `🟢 Implementada` | Gestão e seleção de obras (Projetos), tabela multi-obra e seletor (US14). |

---

> **Regra Metodológica:** Para cada nova funcionalidade iniciada no GitHub Projects, cria-se uma pasta `specs/<numero-da-issue>-<slug>/` contendo:
> - `spec.md`: O que precisa existir, critérios de aceite verificáveis e o que está fora de escopo.
> - `plan.md`: Como será construído, em tarefas pequenas com TDD e revisões cruzadas.
