# Parecer de Código — Tarefa 2

**Veredito: APONTAMENTOS**

## Apontamentos (bloqueiam)

1. **Uma resposta incompatível do SIDRA vira uma consulta bem-sucedida sem resultados.** [SidraClient.java](/C:/Users/panic/dev/obra-certa/apps/api/src/main/java/com/obracerta/service/SidraClient.java:63)  
   **Regra violada:** a arquitetura exige que falhas cheguem à interface para feedback. O plano reserva a lista vazia para consultas válidas sem combinações e prevê erro temporário para falhas do provedor. [Arquitetura](/C:/Users/panic/dev/obra-certa/docs/architecture.md:369) · [Plano](/C:/Users/panic/dev/obra-certa/specs/48-orcamento-cub/plan.md:7)  
   **Prejuízo concreto:** o cliente aceita qualquer array JSON e descarta o primeiro item sem conferir o cabeçalho. Uma resposta HTTP 200 como `[{"error":"temporarily unavailable"}]` resulta em `200` com `finishes: []`, e a tela informa que nenhum acabamento existe para a seleção. A consulta oficial sem dados devolve o cabeçalho da tabela, o que permite distinguir os casos. Falta testar essa resposta incompatível separadamente do cabeçalho válido sem dados.

## Sugestões (não bloqueiam)

- Manter **SINAPI** como rótulo da aba, conforme a apresentação da Tarefa 1. A troca para **Usar SINAPI** independe da integração ao SIDRA. [Template do modal](/C:/Users/panic/dev/obra-certa/apps/web/src/app/features/budgets-page/components/budget-form-modal/budget-form-modal.component.html:40)
- Remover o import de `tick`, que ficou sem uso após a troca do temporizador pelo serviço. [Teste da página](/C:/Users/panic/dev/obra-certa/apps/web/src/app/features/budgets-page/budgets-page.component.spec.ts:1)

## Observações fora do escopo deste diff

- Nenhuma.

O orquestrador registrou 38 testes de backend e 84 de frontend aprovados.
