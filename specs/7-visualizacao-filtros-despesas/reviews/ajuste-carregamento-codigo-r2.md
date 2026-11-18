# Parecer de Código — Ajuste de carregamento US05, rodada 2

**Veredito:** APROVADO

Revisão somente leitura do patch `apps/api/target/ajuste-carregamento-r2.diff`, considerando o patch anterior como contexto e a decisão registrada em `ajuste-carregamento-decisoes-r1.md`. Escopo restrito à correção autorizada de preservação da estrutura durante o GET.

## Apontamentos (bloqueiam)

Nenhum.

A implementação respeita `docs/architecture.md` §5.1: estado em signals, controle de fluxo moderno, tipos explícitos e chamadas HTTP exclusivamente por serviços. Não altera contratos, regras financeiras ou mecanismos de autenticação.

`displayedRows` fornece posições sem DTO durante o carregamento. O componente preserva somente quantidade, alturas e larguras; `expenses` e `totals` continuam limpos. Os links antigos são removidos, impedindo interação com registros da consulta anterior.

O uso de `track $index` tem propósito concreto neste recorte: conservar os containers das posições enquanto seus conteúdos alternam entre resultado e placeholder. As células recebem o novo DTO após a resposta, sem preservar identificação ou conteúdo financeiro anterior.

A medição permanece limitada à apresentação. Consultas concorrentes preservam as medidas já capturadas enquanto o carregamento está ativo. As verificações existentes de geração, contexto e destruição continuam protegendo sucesso e erro, sem mudança nesta rodada.

Tabela, cabeçalhos, linhas e cards permanecem montados nas transições cobertas. Os placeholders compartilham um template local simples, ficam ocultos das tecnologias assistivas e não introduzem ações falsas. O painel mantém `aria-busy`, indicação textual de atualização e rótulos dos campos mobile.

Os testes agora verificam rolagem em container com `overflow-y:auto`, exigem deslocamento efetivo e comprovam identidade dos elementos, alturas, remoção dos links e ausência dos valores anteriores. A cobertura inclui Pendentes, Pagas, filtros, ordenação e paginação.

## Sugestões (não bloqueiam)

- Ampliar futuramente o cenário mobile para uma página de 15 registros e rolagem próxima à paginação. Os dois registros atuais comprovam o mecanismo, mas não exercitam uma lista longa.
- Incluir futuramente uma transição de breakpoint durante GET pendente. As medidas são capturadas no viewport de origem; esse cenário adicional permitiria avaliar a apresentação ao alternar entre tabela e cards antes da resposta.

## Evidências e limites

Conferi os logs da rodada 2 produzidos pelo orquestrador:

- RED: 2 falhas e 38 sucessos.
- GREEN direcionado: 40 testes aprovados.
- Suíte completa: 388 testes aprovados.
- Build concluído: bundle inicial de 712,66 kB, com aviso de orçamento de 500 kB.

Não repeti execuções nem realizei inspeção interativa própria. Este parecer usa análise estática independente e os logs conferidos.

## Observações fora do escopo deste diff

- O aviso de bundle permanece como acompanhamento de manutenção; seu tamanho integral não é atribuível a esta rodada.
- Layout anteriormente aprovado, alterações documentais externas e trabalho da US15 não integram este veredito.

Nenhum arquivo foi alterado, preparado para commit ou commitado por este revisor.
