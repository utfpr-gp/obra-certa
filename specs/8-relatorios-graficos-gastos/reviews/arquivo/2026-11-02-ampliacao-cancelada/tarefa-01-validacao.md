# Validação — Tarefa 1, escopo visual completo

Data: 02/11/2026. Base: `d90401b16660de1998e44130a41306c4607ac238`.

## Testes

Executado em `apps/web`, fora do sandbox para permitir o ChromeHeadless:

```text
npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/reports/*.spec.ts --include=src/app/app.routes.spec.ts
```

RED: 16 testes, 9 passaram e 7 falharam pela ausência dos novos cenários e da prévia. GREEN após implementação: 16/16 passaram, saída 0. O implementador confirmou `npx.cmd tsc --noEmit -p tsconfig.spec.json` e `npm.cmd run build` com saída 0; build mantém avisos de tamanho do bundle e CSS da página (7,84 kB, abaixo do limite de erro de 8 kB).

## Navegador autenticado

- Percorridos os 12 cenários no desktop (1866 pixels CSS) e em 360 pixels CSS efetivos: inicial, misto, orçamento sem gastos, vazio, sem orçamento, carregamento, erro, sem obra, obra não localizada, troca de obra, geração de PDF e falha de PDF.
- Não houve transbordamento horizontal nos elementos `.reports-page`, `.panel`, `.detail-row` e `.report-indicator` examinados, nem texto `NaN`/`Infinity` nesses cenários.
- Misto: 4 categorias na distribuição e 3 no comparativo. Orçamento sem gastos: 0 na distribuição e 7 no comparativo. Vazio: 0/0. Sem orçamento: 7 na distribuição e 0 no comparativo.
- Nos estados de consulta indisponível, nenhum gráfico/dado anterior é exibido e o botão de exportação está desabilitado.
- Prévia com tela filtrada em Elétrica no cenário misto: a tela mostra R$ 1.250,00 realizados e o documento consolida R$ 3.000,00 da obra, com R$ 1.750,00 pagos e R$ 1.250,00 a pagar. Fechar devolve foco ao botão; Escape fecha o diálogo.
- Prévia em 360px: diálogo com largura útil de 290px e scrollWidth de 290px, valores e balanço reorganizados para leitura no celular.
- Geração simulada: botão de exportação desabilitado e status visível; concluir a simulação abre a prévia. Falha simulada: mensagem e ação de nova tentativa manual; a nova tentativa abre a prévia sem download.
- Viewport restaurado e cenário inicial mantido ao finalizar a validação.

## Capturas

Artefatos locais de validação em `C:/Users/panic/.codex/visualizations/2026/11/02/01a19b44-20fc-7892-99b0-6ff9f6d8fd8f/`:

- `relatorios-completo-desktop.png`
- `relatorios-completo-vazio-desktop.png`
- `relatorios-completo-previa-desktop.png`
- `relatorios-completo-previa-mobile.png`
- `relatorios-completo-erro-mobile.png`

Esta validação é da interface demonstrativa. Não atesta integrações reais, autorização no backend ou geração de arquivo PDF.
