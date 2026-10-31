# Parecer de Código — Tarefa 8

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum.

O diff mantém os padrões do `docs/architecture.md`, §5.1: componentes standalone, injeção por `inject()`, estado visual em signals, formulários reativos e comunicação HTTP pelos serviços existentes.

As guardas de envio complementam os botões desabilitados, impedindo repetição também por chamadas diretas aos métodos. Os identificadores de contexto distinguem operações antigas de diálogos abertos posteriormente, inclusive no ciclo A→B→A. No formulário, a verificação de `DestroyRef` também impede que respostas atualizem uma instância destruída.

A troca da obra ativa fecha os dois diálogos e descarta seu contexto. O complemento do `ConfirmModal` é pequeno e mantém compatibilidade: `saving` começa como `false`, a confirmação respeita esse estado e o cancelamento continua disponível. A operação já enviada pode terminar no servidor, conforme a premissa declarada.

Os testes usam respostas controladas por `Subject` para verificar resultados observáveis: preservação do diálogo novo, ausência de recarga indevida e uma única chamada durante o envio. Os testes Java exercitam repetição de definição e zeramento, preservando registro e resultado financeiro.

**Validação executada nesta revisão:** `.\mvnw.cmd test`, em `apps/api`, com perfil `test` e PostgreSQL local: **73 testes, zero falhas, zero erros e zero ignorados**. A execução restrita falhou por acesso ao banco/logs; a reexecução com permissão ampliada terminou com `BUILD SUCCESS`. Frontend foi atribuído ao revisor de conformidade; build não foi reexecutado por este revisor.

## Sugestões (não bloqueiam)

Nenhuma.

## Observações fora do escopo deste diff

- O feedback completo de falhas de rede/401 permanece na Tarefa 9; o handler de zeramento mantém essa indicação.
- A pendência de categoria inexistente em `zeroBudget` permanece na Tarefa 10, conforme decisão registrada pelo autor.
- As divergências anteriores da documentação sobre versões da stack, executor de testes frontend e `CHECK > 0` não foram alteradas por esta tarefa.
