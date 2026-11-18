# Validações — Tarefa 5, rodada 2

Executadas em 04/11/2026 após a correção aceita dos testes da listagem e a revisão do critério registrada em `tarefa-05-revisao-criterio.md`.

A alteração desta rodada ficou restrita a `accounts-page.component.spec.ts`. A preparação da paginação passou a usar o botão visível “Próxima”, a seleção de Pagas usa o botão da aba e as verificações observam a interface. Eventos DOM sintéticos nos controles do template permanecem permitidos pelo critério revisado. Não houve alteração de código de produção ou dependências nesta rodada.

## Execuções atuais

Diretório: `apps/web`.

```powershell
npx.cmd ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/accounts-page.component.spec.ts
```

Resultado: **38/38 testes aprovados**, saída 0.

```powershell
npx.cmd ng test --watch=false --browsers=ChromeHeadless
```

Resultado: **501/501 testes aprovados**, saída 0. Chrome Headless 156 no Windows. As execuções Chrome foram autorizadas fora do sandbox.

```powershell
npx.cmd tsc --noEmit -p tsconfig.spec.json
npm.cmd run build
```

Ambos aprovados, saída 0. Build gerou sete rotas estáticas. `git diff --check` nos dois arquivos da tarefa também passou.

## Avisos e limites

Persistem avisos de specs preexistentes sem expectations, NG0505, tamanho do bundle/CSS de relatórios e dependência CommonJS `pako`. Não foram tratados nesta tarefa. Não houve instalação de dependências, execução de scripts bloqueados ou correção de vulnerabilidades.

Estas execuções comprovam o estado atual da suíte, mas não reabrem a Tarefa 4 nem alteram sua decisão ou seus pareceres. Não constituem uma terceira rodada de revisão daquela tarefa. Backend não foi alterado nem reexecutado nesta correção exclusivamente de testes Angular.
