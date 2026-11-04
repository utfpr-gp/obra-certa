# 📑 Índice de Especificações Técnicas (Specs)

Este diretório centraliza todas as ordens de serviço e planos de implementação de cada história/issue desenvolvida na metodologia **Spec-Driven Development (SDD)**.

---

## 📋 Tabela de Rastreabilidade

| Issue | História | Spec (Diretório) | Estado | PR | Observação |
| :---: | :--- | :--- | :---: | :---: | :--- |
| #3 | US01 — Cadastro de Usuário | — | `🟢 Implementada` | #2 | Entregue antes da adoção do UTF-SDD; não possui pasta de spec. |
| #4 | US02 — Autenticação (Login e Logout) | — | `🟢 Implementada` | #2 | Entregue antes da adoção do UTF-SDD; não possui pasta de spec. |
| #21 | Home-page (scaffold com dados mockados) | [specs/003-home-page-scaffold/](003-home-page-scaffold/) | `🟢 Implementada` | #26 | Layout e componentes do dashboard; os dados mockados foram substituídos pela API na US14. |
| #27 | US14 — Gestão e Seleção de Obras | [specs/27-gestao-projetos/](27-gestao-projetos/) | `🟢 Implementada` | #29 | Multi-obra, seletor global, exclusão lógica e Anti-IDOR. Auditoria final r2 (pós-merge): NÃO PRONTO; o CA5(b) foi entregue depois, na correção da Issue #34. |
| #9 | US07 — Orçamento por Categoria | [specs/09-gestao-orcamento/](09-gestao-orcamento/) | `🟢 Implementada` | #30 | Tetos por categoria, painel de consumo, alertas, zeramento e seed de demonstração. Auditoria final r2 (pós-merge): NÃO PRONTO; a regressão do CA10 (erro vira 401) foi corrigida depois, no PR #38 (Issue #33). |
| #5 | US03 — Cadastro de Despesas | [specs/5-cadastro-despesas/](5-cadastro-despesas/) | `🟢 Implementada` | #31 | Lançamento quitado ou a prazo, fornecedor inline e comprovante no Supabase Storage com reenvio. Auditoria final r2: pronto para PR. |

### Specs substituídas (mantidas apenas como histórico)

Rascunhos anteriores ao UTF-SDD, fatiados por camada. Não devem ser implementados: o conteúdo foi absorvido pelas histórias acima. As pastas são mantidas porque os pareceres da US14 as citam e pareceres não são editados.

| Spec (Diretório) | Substituída por |
| :--- | :--- |
| `specs/005-entidade-project-e-crud/` | US14 (#27) |
| `specs/006-data-seeder-factory/` | US07 (#9), `DemoDataSeederService` |
| `specs/007-integracao-home-com-api/` | US14 (#27) |

---

> **Regra Metodológica:** Para cada nova funcionalidade iniciada no GitHub Projects, cria-se uma pasta `specs/<numero-da-issue>-<slug>/` contendo:
> - `spec.md`: O que precisa existir, critérios de aceite verificáveis e o que está fora de escopo.
> - `plan.md`: Como será construído, em tarefas pequenas com TDD e revisões cruzadas.
