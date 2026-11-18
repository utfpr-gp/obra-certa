# Parecer de Código — Tarefa 9

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum.

O diff mantém os padrões do `docs/architecture.md`, §5.1: estado visual em signals, apresentação com `@if`, componentes consumindo serviços tipados e tratamento de sessão pelo interceptor existente.

O novo `zeroError` oferece feedback e nova tentativa sem fechar a confirmação. Ele é limpo ao abrir, fechar e reenviar; as verificações de contexto da Tarefa 8 continuam protegendo os retornos. O formulário preserva os campos e mantém o tratamento específico do conflito 409.

O complemento de autenticação está expressamente autorizado e registrado no plano. `/login` usa a mesma tela existente, `/` permanece disponível e `Auth.logout()` conserva a limpeza do token e da obra ativa antes da navegação.

Os testes da página percorrem HTTP, interceptor e `Auth` reais com transporte simulado. Verificam recuperação, preservação dos valores, limpeza da sessão e destino da navegação. O `RouterTestingHarness` também exercita as duas rotas reais de login. Os testes do serviço verificam status e identidade do payload de erro.

**Validação executada nesta revisão:** `npm.cmd run build`, em `apps/web`, concluído com sucesso. Permanece o aviso de bundle inicial de **571,26 kB**, acima do orçamento de 500 kB. A suíte frontend completa foi atribuída ao revisor de conformidade; não foi duplicada por este revisor. Não há alteração backend que justifique sua reexecução nesta revisão.

## Sugestões (não bloqueiam)

- O teste de recuperação do zeramento verifica diretamente a classe `z-[60]`. Isso acopla a prova ao estilo específico: mover a mesma regra de empilhamento para uma classe CSS manteria o comportamento, mas quebraria o teste. Uma futura verificação visual da sobreposição demonstraria a visibilidade sem exigir esse nome de classe.

## Observações fora do escopo deste diff

- A pendência de categoria inexistente em `zeroBudget` permanece na Tarefa 10, conforme decisão registrada pelo autor.
- As divergências anteriores da documentação sobre versões da stack, executor de testes frontend e `CHECK > 0` não foram alteradas por esta tarefa.
