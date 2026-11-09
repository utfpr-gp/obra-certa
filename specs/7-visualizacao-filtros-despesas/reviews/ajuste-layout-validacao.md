# Ajuste visual complementar — US05

Solicitação do autor: “Ajuste o layout para que fique mais parecido com a imagem, e siga o design system.” Referência: `C:/Users/panic/Downloads/ContasAPagar-Desktop.png`. Base: `7c217d8`.

Recorte de apresentação do CA11 já aprovado; não cria história, tarefa adicional no plano ou critério de aceite. Alterações restritas ao componente `accounts-page` e sua suíte. Documentos e alterações externas foram preservados.

## Composição

- Cabeçalho com título de 24px, subtítulo e CTA Cadastrar conta com ícone Plus Lucide. Retirado o bloco separado Nova conta.
- Três totalizadores reais na ordem a pagar, pago e geral, com ícones e textos auxiliares sem contagens inventadas.
- Painel Compromissos e histórico com abas underline teal, filtros recolhíveis integrados e ordenação. Catálogos continuam carregados somente ao abrir os filtros.
- Oito campos/colunas preservados; valores à direita com números tabulares, badges de situação e paginação estilizada. Contagem do resultado usa exclusivamente `totalElements` devolvido pela API e é retirada durante carregamento, falha, invalidação ou mudança de contexto.
- Mobile mantém cards por registro, quatro abas, campos de filtros e ações de pelo menos 44px.

Sem banner de sete dias, busca textual, marcação rápida de pagamento, quarto card, contagens por status ou dados ilustrativos. Nenhum endpoint, contrato, backend, rota, Sidebar ou estilo global alterado.

## Validação

- RED: suíte dedicada executada pelo orquestrador em ChromeHeadless; 2 falhas esperadas na composição em viewports reais de 360px e 1280px, 19 testes passando. Log local: `apps/web/ajuste-layout-red.log`.
- Testes ampliados antes da produção: cabeçalho/CTA/subtítulo, ausência do bloco Nova conta, painel semântico contendo filtros/ordenação, ordem dos três totais e tamanho de título. As provas existentes por registro para todos os campos do CA1 e de usabilidade/teclado foram preservadas.
- Build development: `npx.cmd ng build --configuration development`, executado em `apps/web`, passou em 01/11/2026 (horário local).
- GREEN: suíte dedicada executada pelo orquestrador em ChromeHeadless; **21/21 passando**, incluindo os dois viewports e os comportamentos existentes.
- Acabamento após QA desktop: quatro datas em quatro colunas a partir de `lg`, preservando uma coluna no mobile e duas no tablet; contagem com singular para um registro. Testes existentes ampliados para singular/plural antes da correção; RED confirmado pelo orquestrador com 1 falha esperada e 20 passando (`apps/web/ajuste-layout-acabamento-red.log`). Nova execução GREEN segue com o orquestrador.
- Primeira suíte completa após acabamento: 387 passando e 1 falha em `accounts-navigation.spec.ts:26`, cuja expectativa ainda usava o título antigo “Contas a pagar”. Com ampliação de escopo autorizada pelo orquestrador, ajustada exclusivamente essa asserção para o título solicitado “Contas a Pagar”; nenhuma outra asserção de navegação ou contexto e nenhum código de produção alterado nesta correção. Reexecução segue com o orquestrador.
- Validação final do orquestrador: `npm test -- --watch=false --browsers=ChromeHeadless`, **388/388 aprovados**, exit 0 (`apps/web/ajuste-layout-suite.log`).
- Build de produção: `npm run build`, exit 0, aviso de bundle inicial de 703,79 kB para orçamento de aviso de 500 kB (`apps/web/ajuste-layout-build.log`).
- Conferência na aplicação local em `http://localhost:4200/contas`: cabeçalho, métricas, painel, abas, filtros abertos, badge e singular do rodapé verificados em desktop; apresentação por cards e ações conferidas em viewport mobile de 390 × 844. A configuração temporária do viewport foi restaurada. O servidor Angular foi reiniciado nesta cópia do projeto, sem alterar backend ou banco.
- Capturas da conferência: `C:/Users/panic/.codex/visualizations/2026/11/01/01a197bc-9457-7830-aa6a-145e3d03f45a/contas-layout-desktop.jpg` e `contas-layout-mobile.jpg` no mesmo diretório.

Comando da suíte dedicada, a partir de `apps/web`: `npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts`.

Implementação entregue para as duas revisões independentes do fluxo; este registro não declara aprovação de revisão nem encerramento da história.
