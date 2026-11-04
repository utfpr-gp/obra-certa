# Validações — Tarefa 3, rodada 1

Executadas em 04/11/2026. A implementação desta tarefa está restrita ao frontend da Home, serviço HTTP e modal compartilhado, sem integração da tarefa 4 ou alterações no backend.

## Angular — RED e GREEN

Diretório: `apps/web`.

```powershell
npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/shared/components/payment-modal/payment-modal.component.spec.ts --include=src/app/core/services/payment.service.spec.ts --include=src/app/features/home-page/home-page.spec.ts
```

- RED antes de produção: compilação válida; **33 falhas esperadas e 40 testes existentes aprovados**, saída 1. Ausência dos métodos de quitação/recuperação e da ação/modal na Home.
- GREEN após implementação: **73 testes aprovados**, saída 0, Chrome Headless 156 no Windows. Execução fora do sandbox mediante autorização pelo orquestrador.

O conjunto cobre abertura, formulário e data sugerida, datas inválidas/iguais/futuras, cancelamento e teclado/foco, bloqueio durante envio, PUT e atualização dos alertas, mensagem de sucesso com falha na recarga, GET de recuperação e seus resultados, timeout, 401 e troca de obra inclusive A → B → A.

## Tipos e build

Executados pelo implementador, em `apps/web`:

```powershell
npx.cmd tsc --noEmit -p tsconfig.spec.json
npm.cmd run build
```

Ambos aprovados. O build mantém avisos de tamanho de bundle/CSS de relatórios e dependência CommonJS `pako`. `git diff --check` aprovado. Nenhuma alteração após o GREEN antes do relatório final.

## Contrato backend

Executado pelo orquestrador, em `apps/api`:

```powershell
.\mvnw.cmd '-Dtest=PaymentSettlementIntegrationTest' test
```

Resultado: **12 testes aprovados**, nenhuma falha, erro ou teste ignorado; `BUILD SUCCESS`, saída 0. PostgreSQL 16.15 local no banco separado `us08_validation_20261104`, perfil `test`, dez migrations existentes e Hibernate em `validate`. Credenciais fornecidas somente ao processo, sem exposição.
