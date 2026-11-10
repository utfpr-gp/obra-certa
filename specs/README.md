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
| #6 | US04 — Edição e Exclusão de Despesas | [specs/6-edicao-exclusao-despesas/](6-edicao-exclusao-despesas/) | `🟢 Implementada` | #36 (integrada em `develop`) | Sete tarefas concluídas e revisadas, ajustes visuais e retorno para Contas a Pagar. Fechamento documental concluído e auditoria final aprovada em 01/11/2026; não declara implantação. |
| #7 | US05 — Visualização e Filtros de Despesas | [specs/7-visualizacao-filtros-despesas/](7-visualizacao-filtros-despesas/) | `🟢 Implementada localmente` | Em preparação | Dez tarefas concluídas e revisadas, incluindo consolidação das pendências das Tarefas 1 e 6. Última validação: 398 testes frontend e 318 testes da API aprovados (PostgreSQL 16, perfil `test`). Fuso de referência das abas: `America/Sao_Paulo`. [Auditoria final r1](7-visualizacao-filtros-despesas/reviews/auditoria-final-r1.md): NÃO PRONTO. [Auditoria final r2](7-visualizacao-filtros-despesas/reviews/auditoria-final-r2.md): NÃO PRONTO por bloqueios documentais, corrigidos após o parecer; a US04 já está integrada a `develop` (PR #36) e a branch a contém. [Auditoria final r3](7-visualizacao-filtros-despesas/reviews/auditoria-final-r3.md): NÃO PRONTO por bloqueios documentais de `architecture.md`, corrigidos depois do parecer. [Auditorias r4 e r5](7-visualizacao-filtros-despesas/reviews/auditoria-final-r5.md): NÃO PRONTO; fuso `America/Sao_Paulo` e estado vazio ajustados depois. [Auditoria final r6](7-visualizacao-filtros-despesas/reviews/auditoria-final-r6.md): PRONTO PARA PR, com exceções registradas. Sem declarar implantação. |
| #8 | US06 — Relatórios e Gráficos de Gastos | [specs/8-relatorios-graficos-gastos/](8-relatorios-graficos-gastos/) | `🟢 Implementada localmente` | Pronto para PR | A [auditoria final r7](8-relatorios-graficos-gastos/reviews/auditoria-final-r7.md) aprovou a entrega. As tarefas 9 e 10 sincronizam a categoria após aplicar um período e bloqueiam o PDF após falha da consulta. [Validação frontend](8-relatorios-graficos-gastos/reviews/tarefa-10-validacao-r1.md) com 446 testes aprovados e build concluído. [Validação da API](8-relatorios-graficos-gastos/reviews/validacao-pos-auditoria-r4.md) com 348 testes aprovados no PostgreSQL isolado. [Validação visual](8-relatorios-graficos-gastos/reviews/validacao-visual-ca11.md) em desktop e 360px, com obra vazia e filtros. |
| #10 | US08 — Painel de Alertas de Vencimento de Pagamentos | [specs/10-alertas-vencimento-pagamentos/](10-alertas-vencimento-pagamentos/) | `🟢 Implementada localmente` | [Auditoria final aprovada](10-alertas-vencimento-pagamentos/reviews/auditoria-final-r2.md) | Cinco tarefas concluídas. Alertas reais de vencimento e quitação por modal na Home e em Contas a Pagar, data efetiva informada, idempotência e isolamento. Última validação: 511/511 testes Angular e build aprovados; contrato de quitação e integração da listagem validados com PostgreSQL. Histórico de duas rodadas da tarefa 4 preservado; encerramento autorizado por [decisão revisada](10-alertas-vencimento-pagamentos/reviews/tarefa-04-decisao-revisada.md) após as validações posteriores. Não declara implantação. |
| #11 | US09 — Importação de Despesas via NF-e | [specs/11-importacao-despesas-nfe/](11-importacao-despesas-nfe/) | `🟢 Implementada localmente` | Em preparação | Importação por XML de NF-e, trava de chave por obra com `SELECT … FOR UPDATE` e recuperação de comprovantes após falhas. A correção do CA8 entrou no commit `21868bd` e foi verificada na [auditoria final r5](11-importacao-despesas-nfe/reviews/auditoria-final-r5.md). Validação da API: 434 testes aprovados no PostgreSQL 16. |

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
