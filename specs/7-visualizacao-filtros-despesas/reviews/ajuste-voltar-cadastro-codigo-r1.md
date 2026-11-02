# Parecer de Código — Ajuste Voltar no cadastro, rodada 1

**Veredito:** APROVADO

Revisão somente leitura do recorte `apps/api/target/ajuste-voltar-cadastro.diff`, limitado ao template do cadastro e aos testes de navegação.

## Apontamentos (bloqueiam)

Nenhum.

O link reutiliza `routerLink` e o estilo `btn-oc-outline`, sem adicionar handlers, estado ou comunicação HTTP. Está fora do formulário e disponível independentemente da obra ativa e do carregamento. A estrutura respeita `docs/architecture.md` §5.1 e mantém o controle compacto com altura mínima de 44 px e cabeçalho com quebra responsiva.

Os testes verificam navegação real com `RouterTestingHarness`: retorno durante carregamento sem obra, cancelamento das consultas pendentes e retorno com formulário válido preenchido sem POST, seguido de GET da listagem da obra. São verificações relevantes do comportamento e preservam o fluxo existente de Cancelar.

## Sugestões (não bloqueiam)

Nenhuma.

## Evidências e limites

Conferidos os logs: RED com **2 falhas e 5 sucessos**, por ausência do link; GREEN com **390 testes aprovados**; build concluído com bundle inicial de **713,48 kB**, mantendo o aviso de orçamento de 500 kB já existente.

Não repeti testes nem realizei inspeção própria no navegador. A conferência visual desktop/mobile está registrada pelo orquestrador em `ajuste-voltar-cadastro-validacao.md`. Nenhum arquivo foi alterado.

## Observações fora do escopo deste diff

Nenhuma nova.
