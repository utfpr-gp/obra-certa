# Parecer de Código — Tarefa 1

**Veredito:** APONTAMENTOS

Não foi possível executar `git diff` nem os comandos Maven/NPM: o ambiente disponibilizado não expõe Bash. A revisão foi feita nos arquivos atuais da implementação.

## Apontamentos (bloqueiam)

1. **Consulta paginada causa provável N+1 ao mapear categoria e fornecedor** — `ExpenseRepository.java:24`, `ExpenseMapper.java:23-25,37-38`  
   Regra violada: a arquitetura separa Repository/Mapper e exige consultas eficientes para listagens.  
   Prejuízo concreto: a página busca despesas e o mapper acessa associações de categoria, fornecedor e pagamento individualmente, podendo gerar várias consultas adicionais por página. A listagem degrada conforme cresce o número de registros. Use projeção ou `fetch join` apropriado para leitura paginada.

2. **Falhas HTTP não possuem estado de erro nem feedback no componente** — `accounts-page.component.ts:84-88`  
   Regra violada: `architecture.md`, seção 5.1, regra de dados: falhas devem chegar ao componente para feedback e nova tentativa, sem serem transformadas em sucesso.  
   Prejuízo concreto: erro de rede, 404 ou 5xx deixa a tela sem indicação e sem retry; a inscrição apenas possui callback de sucesso.

## Sugestões (não bloqueiam)

- O teste de integração usa `@AutoConfigureMockMvc(addFilters = false)` e `@MockBean UserContextHelper`; cobre posse via service, mas não valida autenticação/JWT ou o comportamento HTTP de usuário não autenticado — `ExpenseListingIntegrationTest.java:31-32`.
- A resposta da listagem não contém `summary`, embora o contrato geral de paginação em `architecture.md` preveja resumo financeiro. Deve ser incorporado na tarefa correspondente aos totalizadores, se deliberadamente fora do escopo da Tarefa 1.
- O componente usa pipes genéricos `date` e `currency`, em vez dos pipes compartilhados previstos pela arquitetura — `accounts-page.component.ts:48-50`.
- O efeito recarrega a página ao mudar a obra, mas não invalida respostas antigas; uma resposta atrasada pode sobrescrever a obra atual. O plano atribui essa proteção à Tarefa 7 — `accounts-page.component.ts:75-85`.
- A implementação usa template inline, enquanto a estrutura arquitetural prevê componente e HTML separados; não é bloqueante isoladamente.

## Observações fora do escopo deste diff

- Não foi possível confirmar o diff exato contra `ff4226e9139a2dc00d7937dafe90e9380bd89f45`.
- Os testes solicitados não foram executados por indisponibilidade do shell no ambiente.
