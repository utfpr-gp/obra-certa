# Parecer de Código — Ajuste botão Pago

**Veredito:** APONTAMENTOS

Revisão somente leitura, ciclo `ajuste-botao-pago`, rodada 1. Recorte: `apps/api/target/ajuste-botao-pago.diff`, relativo ao componente `accounts-page` e seus testes.

## Apontamentos (bloqueiam)

1. **Asserção dependente do espaço entre elementos deixa a suíte falhando** — `apps/web/src/app/features/expenses/accounts-page.component.spec.ts:319`
   
   Regra violada: `.agents/agents/revisor-codigo.md`, “teste acoplado a detalhe de implementação”; `.agents/rules/utf-rules.md` §4, ciclo RED → GREEN.
   
   Prejuízo concreto: o Angular produz `textContent` igual a `Ver detalhesMarcar como Pago`, embora o espaçamento visual esteja definido por `gap-2`. A expectativa exige um espaço textual entre os controles e reprova a apresentação válida. O log `apps/web/ajuste-botao-pago-green.log` confirma **1 FAILED, 387 SUCCESS**, com essa única falha no viewport de 1280 px. Verificar os rótulos pelos respectivos elementos evita depender da whitespace entre nós.

## Sugestões (não bloqueiam)

Nenhuma.

## Evidências e limites

O código de produção respeita `docs/architecture.md` §5.1: controle de fluxo moderno, apresentação baseada no estado existente e ausência de acesso HTTP no componente. O botão reutiliza `btn-oc-outline`, tem altura mínima de 44 px, `type="button"` e atributo nativo `disabled`, sem handler ou mutação. A pequena repetição entre apresentações desktop/mobile acompanha a estrutura existente e não justifica abstração adicional.

Os testes acrescentados cobrem presença em registro pendente, ausência em registro pago e durante carregamento, dimensões nos viewports de 360/1280 px e ausência de HTTP, navegação ou alteração das despesas após tentativa de clique. O RED registra **2 FAILED, 19 SUCCESS**, por ausência do botão.

Não executei testes ou navegador. O build permanece pendente conforme despacho. Nenhum arquivo foi alterado.

## Observações fora do escopo deste diff

Nenhuma. A quitação funcional permanece reservada à tarefa futura autorizada pelo autor.
