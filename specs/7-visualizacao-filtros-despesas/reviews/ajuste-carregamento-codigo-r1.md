# Parecer de Código — Ajuste de carregamento US05

**Veredito:** APROVADO

Revisão somente leitura, ciclo `ajuste-carregamento`, rodada 1. Escopo delimitado pelo patch `apps/api/target/ajuste-carregamento.diff`, nos três arquivos Angular informados, e pelo registro de validação. O layout anteriormente aprovado e as alterações externas não integram este parecer.

## Apontamentos (bloqueiam)

Nenhum.

O ajuste respeita `docs/architecture.md` §5.1: estado em signals, controle de fluxo moderno, injeção por `inject()` e comunicação HTTP por serviços. A medição via `viewChild<ElementRef<HTMLElement>>` permanece na camada de apresentação e preserva somente uma dimensão, sem criar cache de dados financeiros.

Os containers dos totalizadores permanecem montados durante a consulta. Valores indisponíveis recebem placeholders identificados, sem conversão indevida para zero. O corpo dos resultados reserva a altura renderizada anterior durante o GET e recupera a altura natural após sucesso ou falha.

A proteção existente por geração, contexto da obra e destruição do componente continua válida. Uma consulta concorrente não substitui a altura reservada enquanto outra está pendente, e respostas obsoletas não encerram o carregamento atual nem restauram dados antigos.

A semântica de abas foi preservada. O carregamento possui `role="status"` e `aria-busy`; placeholders decorativos ficam ocultos da tecnologia assistiva e os valores indisponíveis possuem descrição textual.

Os testes acrescentados verificam comportamento observável: identidade e geometria dos containers, rolagem, parâmetros HTTP, ausência de informações financeiras antigas e atualização após resposta. Essas verificações correspondem diretamente ao problema corrigido.

## Sugestões (não bloqueiam)

- Ampliar futuramente a prova de rolagem com uma página mobile de 15 registros e posição próxima à paginação. A cobertura atual usa dois registros e `scrollTo(0, 200)`, suficiente para demonstrar a correção básica, mas não exercita uma lista longa.
- Em `apps/web/src/app/features/expenses/accounts-page.component.ts:138`, avaliar o posicionamento do status em listas mobile longas. Centralizá-lo na altura integral preservada pode deixá-lo fora da área visível durante parte da navegação. Trata-se de melhoria de feedback; não compromete a limpeza dos dados ou a estabilidade dos containers.

## Evidências e limites

Conferi os logs fornecidos pelo orquestrador:

- RED: 3 falhas e 18 sucessos.
- GREEN direcionado: 40 testes aprovados.
- Suíte completa: 388 testes aprovados.
- Build concluído, com bundle inicial de 706,08 kB e aviso de orçamento de 500 kB.

Não repeti testes nem executei inspeção interativa no navegador. O parecer combina análise estática independente com os logs conferidos.

## Observações fora do escopo deste diff

- O aviso de bundle já existia e merece acompanhamento separado; seu tamanho integral não é atribuível a este ajuste.
- Alterações documentais, layout anterior e trabalho externo da US15 não foram julgados.

Nenhum arquivo foi alterado, preparado para commit ou commitado por este revisor.
