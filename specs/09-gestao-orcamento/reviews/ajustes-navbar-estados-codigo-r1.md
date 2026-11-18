# Parecer de Código — Ajustes de navbar e estados da US07

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum.

O diff mantém os padrões do `docs/architecture.md`, §5.1: estado reativo com signals, valor derivado em `computed`, componentes consumindo serviços e apresentação restrita ao componente.

O efeito passa a depender do identificador da obra. Atualizações de nome/status continuam disponíveis pelo signal original, mas não provocam recarga nem descarte dos diálogos quando o identificador permanece igual. `untracked` impede que leituras incidentais dos efeitos secundários acrescentem dependências ao carregamento.

A atualização da lista de obras pela navbar permanece intacta. Troca real de identificador e ausência de obra continuam percorrendo o fechamento dos diálogos e a atualização ou limpeza do painel. Os caminhos explícitos de retry, salvamento e zeramento não foram alterados.

O estilo do indicador é local: formato arredondado, espaçamento interno, altura adaptável e texto sem quebra. As cores dos estados permanecem fornecidas pelo método existente, sem alteração global de badges.

Os testes de integração usam Navbar e `ActiveProjectService` reais e verificam resultados observáveis: ausência de novas chamadas, preservação dos diálogos e do rascunho, atualização de metadados, troca real e limpeza sem obra.

**Validação executada nesta revisão:** `npm.cmd run build`, em `apps/web`, concluído com sucesso. Permanece o aviso de bundle inicial de **571,61 kB**, acima do orçamento de 500 kB. A suíte frontend foi atribuída ao revisor de conformidade; não foi duplicada por este revisor. Não há alteração backend que justifique sua reexecução.

## Sugestões (não bloqueiam)

Nenhuma.

## Observações fora do escopo deste diff

- O limite de tamanho do bundle já era excedido antes destes ajustes; sua redução demanda trabalho separado.
- A conferência visual em resoluções menores ficou a cargo do orquestrador; este parecer avaliou o diff e o build.
