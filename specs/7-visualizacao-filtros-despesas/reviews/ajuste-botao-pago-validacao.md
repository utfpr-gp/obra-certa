# Validação — botão visual Marcar como Pago

Escopo autorizado: apenas botão desabilitado e sem ação em contas não quitadas, desktop e mobile. Quitação funcional permanece fora do ajuste, conforme esclarecimento do autor em `acoes-quitacao-proposta.md`. O texto “Ver detalhes” e suas rotas existentes são preservados.

Arquivos de produção/testes alterados: `apps/web/src/app/features/expenses/accounts-page.component.ts` e `accounts-page.component.spec.ts`.

O botão usa `type="button"`, `disabled`, `btn-oc-outline` e altura mínima de 44px. Os controles usam flex com quebra de linha. Não há handler, navegação, envio de formulário, chamada de API ou alteração financeira. O botão está ausente em despesas pagas e nos placeholders de carregamento.

## Execuções centralizadas

- RED: `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts`, em `apps/web`. Resultado: 2 falhas e 19 sucessos por ausência do botão nos viewports 360/1280. Log `ajuste-botao-pago-red.log`.
- Primeiro GREEN: `npm test -- --watch=false --browsers=ChromeHeadless`. Resultado: 1 falha e 387 sucessos. A única falha exigia whitespace entre nós de controles cuja distância visual é dada por CSS. Log `ajuste-botao-pago-green.log`.
- O implementador ajustou a asserção para verificar os rótulos individualmente antes da emissão dos pareceres da primeira rodada; a validação estava em andamento quando esses pareceres registraram a falha intermediária. Os pareceres originais são preservados sem edição, e a triagem do autor foi solicitada para o apontamento comum aos dois.
- GREEN final: mesmo comando da suíte completa, 388 sucessos. Log `ajuste-botao-pago-green-final.log`. Testes mantêm verificações de presença/ausência, desabilitado, altura e visibilidade em 360/1280, ausência de HTTP/navegação/mutação e estabilidade durante carregamento.
- Build: `npm run build`, concluído com exit 0. Bundle inicial de 713,04 kB; aviso de orçamento de 500 kB já existente. Log `ajuste-botao-pago-build.log`. A produção não foi alterada depois desse build; somente a asserção foi corrigida.
- Conferência real autenticada no navegador: botão identificado como desabilitado junto a “Ver detalhes” em despesa pendente, em viewport desktop de 1280 × 900 e mobile de 390 × 844. O viewport temporário foi restaurado ao final. Não foi executada mutação nem acessada credencial. Capturas: `C:/Users/panic/.codex/visualizations/2026/11/01/01a197bc-9457-7830-aa6a-145e3d03f45a/contas-botao-pago-desktop.jpg` e `contas-botao-pago-mobile.jpg`, no mesmo diretório.

Os logs locais não fazem parte do commit. Nenhuma mudança em API, serviços, schema, spec, plano ou comportamento de quitação. Nenhum commit foi realizado.
