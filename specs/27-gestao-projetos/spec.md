---
issue: 27
status: aprovada
---

# US14 — Gestão e Seleção de Obras (Projetos)

## O problema

Hoje, o proprietário gerencia suas despesas e orçamentos de forma global na plataforma sem a capacidade de separar os custos de diferentes obras ou reformas. Como pequenos e médios proprietários frequentemente realizam mais de uma construção, reforma ou melhoria simultânea ou sequencialmente (ex: construção de casa, reforma de banheiro, ampliação de edícula), a ausência de isolamento por obra mistura orçamentos, compromete a previsibilidade financeira e impede a rastreabilidade contábil individualizada de cada empreendimento.

## A história

**Como** proprietário autenticado, **eu quero** cadastrar, editar, excluir e alternar entre minhas obras, **para que** eu possa gerenciar os custos e orçamentos de cada construção ou reforma de forma independente.

## Critérios de aceite

- [ ] **CA1 — Cadastro de nova obra e definição de ativa:** Dado que o proprietário está autenticado, quando envia nome da obra (mínimo de 3 caracteres), tipo obrigatório (Construção Nova, Reforma ou Ampliação), localização opcional e confirma, então o sistema grava a obra vinculada exclusivamente à sua conta, a define como obra ativa de navegação no cliente e disponibiliza ação rápida/botão destacado ("Definir Orçamentos") que direciona o usuário para a tela de orçamentos (`/orcamentos`).
- [ ] **CA2 — Listagem e seletor global reativo:** Dado que o proprietário possui uma ou mais obras cadastradas, quando acessa o seletor global na Navbar, então o sistema lista apenas as suas próprias obras e, ao selecionar uma, atualiza reativamente o contexto da aplicação, persistindo a seleção no `localStorage`.
- [ ] **CA3 — Edição do nome e dados da obra:** Dado que o proprietário aciona a edição de uma obra de sua titularidade (via modal de edição acessível na Navbar ou no cabeçalho da obra ativa), quando altera o nome da obra (mínimo de 3 caracteres), tipo, localização ou status (`EM_ANDAMENTO`, `PAUSADA`, `CONCLUIDA`) e confirma, então o sistema atualiza as informações no banco e reflete o novo nome imediatamente em todos os componentes visuais (Navbar, cabeçalho da Home e seletor), preservando intactos orçamentos e despesas associados.
- [ ] **CA4 — Exclusão lógica (soft delete) com confirmação:** Dado que o proprietário solicita a exclusão de uma obra e confirma a ação no diálogo de confirmação, então o sistema aplica exclusão lógica no registro, inativa os vínculos de despesas e orçamentos e, caso haja outras obras, seleciona automaticamente a próxima obra ativa; se for a única obra, direciona o usuário para o estado de onboarding.
- [ ] **CA5 — Onboarding e estado de obra sem orçamentos:** Dado que o usuário acabou de se cadastrar (zero obras) ou possui uma obra ativa que ainda não tem orçamentos cadastrados:
  - Se tiver **zero obras**, o sistema exibe modal/tela de boas-vindas com chamada para ação (CTA) para cadastrar a primeira obra;
  - Se a **obra ativa não tiver orçamentos**, o sistema exibe banner/card orientador na Home-Page com botão de ação rápida ("Definir Orçamentos da Obra") que redireciona o usuário para `/orcamentos`.
- [ ] **CA6 — Caminho triste: validação de campos obrigatórios:** Dado que o usuário tenta salvar ou editar uma obra com nome vazio ou inferior a 3 caracteres ou sem tipo obrigatório, quando submete o formulário, então o sistema impede a gravação e destaca as pendências de validação sem persistir dados no banco.
- [ ] **CA7 — Caminho triste: tentativa de acesso a obra alheia (Anti-IDOR - RN01):** Dado que há tentativa de consultar, alternar, editar ou excluir obra pertencente a outro usuário, quando a requisição é processada pela API, então o sistema recusa a ação retornando HTTP 404 (Not Found) sem expor a existência do registro.
- [ ] **CA8 — Abandono no meio: cancelamento de exclusão:** Dado que o diálogo de confirmação de exclusão da obra está visível, quando o usuário clica em cancelar ou tecla `Escape`, então o sistema aborta a operação mantendo intactos a obra e seus registros no banco e no cliente.
- [ ] **CA9 — Abandono no meio: oscilação de rede no salvamento:** Dado que a conexão do usuário sofre timeout ou queda de sinal durante a criação ou edição de obra, quando a resposta falha, então o sistema preserva os campos preenchidos no formulário, exibe alerta explicativo de erro de conexão e permite nova submissão imediata sem exigir redigitação.
- [ ] **CA10 — Estruturação de schema relacional (Migration Flyway V2):** Dado a inicialização da aplicação Spring Boot, quando o Flyway executa as migrações, então a tabela `projects` é criada com integridade referencial (`user_id -> users.id`) e as tabelas `budgets` e `expenses` recebem a coluna `project_id` vinculada como foreign key (`FK -> projects.id`).

## Fora de escopo

- Gestão de múltiplos usuários ou compartilhamento de obras entre proprietários distintos (o modelo de posse é estritamente monousuário/proprietário).
- Definição inline de orçamentos por categoria dentro do formulário da obra (pertence à `US07 — Gestão de Orçamentos`; nesta US14 disponibilizamos o redirecionamento/botão de atalho para a tela de orçamentos).
- Lançamento e listagem de despesas da obra (pertence à `US03` e `US05`).
- Importação ou exportação de dados de obras via planilhas ou arquivos externos.

## Abandono no meio

- **Fechamento do modal de cadastro:** Se o usuário fechar o modal de cadastro sem salvar, os dados temporários são descartados. Se for um usuário recém-cadastrado sem nenhuma obra, o estado de boas-vindas/onboarding permanece em exibição impedindo navegação em telas que dependem de obra ativa.
- **Cancelamento na exclusão:** O diálogo de confirmação modal bloqueia cliques externos acidentais e o botão "Cancelar" desfaz o processo sem qualquer alteração no banco.
- **Sessão expirada no meio da operação:** Caso o token JWT expire enquanto o usuário preenche os dados, o `authInterceptor` intercepta a resposta 401 e retém a transição ou redireciona amigavelmente para `/login`.
- **Falha de rede/timeout:** O serviço de frontend não limpa o formulário reativo em caso de falha HTTP 5xx ou timeout de rede, exibindo toast/banner de erro com botão de reenvio.

## Assume que

| Premissa                                                                                                                                                                         | Issue que fecha  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Ao cadastrar uma obra, o teto orçamentário inicial por categorias ainda não é provisionado imediatamente na mesma transação.                                                     | Issue #04 / US07 |
| A Home-Page carrega os dados da obra selecionada via `ProjectService`, mas totalizadores de despesas e contas a pagar permanecem vazios/zerados até o consumo de despesas reais. | Issue #03 / US03 |

## Depende de

- `US01` (Cadastro de Usuário) — implementada e mesclada na `develop`.
- `US02` (Autenticação JWT) — implementada e mesclada na `develop`.

## Dúvidas em aberto

| #   | Dúvida | Quem responde |
| --- | ------ | ------------- |
