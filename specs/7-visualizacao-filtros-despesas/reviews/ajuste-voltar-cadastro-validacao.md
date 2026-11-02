# Validação — Voltar no cadastro de despesa

Pedido autorizado: incluir um botão de retorno em `/contas/nova`. O cabeçalho oferece “Voltar” para `/contas`, a listagem de origem, com `a/routerLink`, estilo outline compacto e altura de 44px. A ação fica fora do formulário e disponível mesmo sem obra ativa ou durante carregamento. Não altera o botão Cancelar existente, não salva o formulário e não implementa histórico arbitrário de navegação.

Arquivos alterados neste ajuste: `apps/web/src/app/features/expenses/expense-form.component.html` e `accounts-navigation.spec.ts`. Alterações anteriores e arquivos externos foram preservados.

## TDD e validações

Execuções centralizadas em `apps/web`:

- RED: `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-navigation.spec.ts`. Duas falhas por ausência do link e cinco sucessos. Log `ajuste-voltar-cadastro-red.log`.
- GREEN: `npm test -- --watch=false --browsers=ChromeHeadless`. 390 testes aprovados, incluindo os dois novos cenários: acesso direto sem obra durante carregamento; formulário válido preenchido retorna sem POST e consulta a listagem por GET. Log `ajuste-voltar-cadastro-green.log`.
- Build: `npm run build`, exit 0. Bundle inicial de 713,48kB, mantendo aviso de orçamento de 500kB já existente. Log `ajuste-voltar-cadastro-build.log`.
- QA autenticada no navegador: conferido cabeçalho em viewports configurados de 1280×900 e 390×844; controle visível, aproximadamente 60×44px. Clique real em Voltar abriu Contas a Pagar, seguido de Cadastrar conta para deixar a tela de criação aberta. Formulário real estava vazio; o caso preenchido sem gravação está coberto pelo teste automatizado. Viewport temporário restaurado.
- Capturas: `C:/Users/panic/.codex/visualizations/2026/11/01/01a197bc-9457-7830-aa6a-145e3d03f45a/cadastro-voltar-desktop.jpg` e `cadastro-voltar-mobile.jpg`, no mesmo diretório.

Nenhuma mudança em API, serviços, regras financeiras, spec ou plano. Nenhum commit realizado. Os logs locais não integram o commit.
