# Parecer de Código — Tarefa 8

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Consulta individual não acompanha a inicialização assíncrona da obra ativa** — `apps/web/src/app/features/expenses/expense-detail.component.ts:99`

   Regra violada: `docs/architecture.md`, §5.1.6: todas as telas consomem o estado reativo da obra ativa no `ActiveProjectService`.

   Prejuízo concreto: ao abrir diretamente `/despesas/:id` ou recarregar a página, o serviço começa com obra nula. A navbar restaura a seleção somente depois da resposta de `getProjects()`. O novo retorno antecipado impede o GET da despesa; posteriormente, o `effect()` apenas limpa a tela, enquanto `contextVersion` permanece fixado no valor inicial. Assim, mesmo com a obra correta selecionada, a consulta continua vazia e o proprietário não consegue consultar a despesa nem reenviar seu comprovante por esse endereço. Os testes atuais pré-selecionam a obra e não exercitam essa sequência.

## Sugestões (não bloqueiam)

- Nenhuma adicional.

## Observações fora do escopo deste diff

- A compilação independente passou com código 0, mantendo o aviso conhecido de tamanho do pacote inicial: 609,81 kB para limite de aviso de 500 kB.
- `git diff --check` passou.
- A execução independente dos dois arquivos `active-project.service.spec.ts` e `accounts-navigation.spec.ts` compilou, mas não iniciou o ChromeHeadless dentro do sandbox. A tentativa escalada foi interrompida sem resultado; portanto, esses testes permanecem sem confirmação nesta revisão. A tentativa anterior com `--port` foi rejeitada pela CLI antes de executar testes.
