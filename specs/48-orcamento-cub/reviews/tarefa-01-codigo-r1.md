# Parecer de Código — Tarefa 1

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **A prévia mantém uma lista paralela de categorias** — `sinapi-form.component.ts:12` e `budget-form-modal.component.html:27`.  
   **Regra violada:** a arquitetura, na seção 8, estabelece as categorias predefinidas como dados mestres. O plano da US15 especifica que o formulário reutiliza as categorias da página.  
   **Prejuízo concreto:** o modal já recebe as categorias carregadas da API, mas a prévia ignora essa entrada e monta as linhas com nove nomes fixos. Se o catálogo recebido omitir ou renomear uma categoria, a tela pode exibir uma parcela para uma categoria ausente ou diferente da exibida no orçamento manual. Ao conectar a confirmação, a associação com os IDs reais exigirá reconciliar duas listas. O rateio inicial pode continuar definido pelo PRD, com as linhas da prévia associadas ao catálogo já recebido pelo modal.

## Sugestões (não bloqueiam)

- O teste usa `tick(350)` duas vezes, repetindo a duração privada do exemplo. Avançar o relógio até a conclusão das tarefas pendentes após verificar o estado de carregamento reduziria o acoplamento a esse número.
- A leitura isolada de `this.projectId()` no `effect` registra uma dependência que dispara o reinício do modal ao trocar de obra. Um comentário curto explicaria por que a leitura está ali.

## Observações fora do escopo deste diff

- Nenhuma.

A suíte de Orçamentos executada pelo orquestrador registrou 69 testes aprovados.
