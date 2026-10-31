# Auditoria Final — Issue #9

**Veredito:** NÃO PRONTO

Auditoria local da US07 sobre o HEAD `d30e8ba91c949d3aef4d3bc8c19612714a899e4a`, usando a spec original aprovada como régua, incluindo fora de escopo, abandono, premissas e dependências. O `plan.md` não foi usado como critério de aceite.

O diff considerado foi `git diff develop...HEAD`, com 220 arquivos. A comparação complementar `git diff feature/27-gestao-projetos...HEAD`, com 96 arquivos, permitiu distinguir a dependência US14 das alterações da US07. A presença da US14 na ancestralidade local não comprova sua integração na `develop`.

Validação executada nesta auditoria:

- **Backend:** 78 testes, nenhuma falha, nenhum erro, nenhum teste ignorado; `BUILD SUCCESS`. A primeira execução restrita falhou por acesso ao diretório externo de logs; a repetição ampliada passou.
- **Frontend:** 189 testes passaram em ChromeHeadless, em execução ampliada realizada e informada pelo orquestrador durante esta auditoria.
- **Build frontend:** passou. Aviso de bundle inicial: **571,96 kB**, excedendo o orçamento de 500 kB em 71,96 kB.

## Critérios de aceite da spec

| # | Critério | Situação | Evidência (arquivo:linha / teste) |
| --- | --- | --- | --- |
| CA1 | Criar/atualizar teto por obra/categoria, mantendo um único registro ativo e devolvendo valores recalculados | Conforme | `apps/api/src/main/java/com/obracerta/service/BudgetService.java:116` verifica propriedade, reutiliza o registro ativo ou cria um novo e calcula o retorno. `V6__budget_constraints_and_unique_index.sql:41` garante unicidade ativa. `BudgetServiceTest` cobre criação, atualização e PUT repetido; `BudgetSchemaMigrationTest` cobre duplicidade. `budgets-page.component.spec.ts:495` e `:519` cobrem criação/edição e recarga. |
| CA2 | Progresso por categoria, totais, saldo negativo, limiares exatos e ausência de divisão por zero | Conforme | `BudgetService.java:61` agrega orçamentos e despesas ativas; `:196` decide estados comparando valores `BigDecimal`, antes do arredondamento; `:209` retorna percentual nulo quando o teto é zero. `BudgetServiceTest:106` comprova que 89,99% pode ser exibido como 90,0% permanecendo verde. `budgets-page.component.html:52` e `:142` exibem KPIs e barras; testes `:360`, `:372` e `:407` conferem a apresentação. |
| CA3 | Alerta de despesas sem teto, “Definir teto” habilitado e reclassificação desabilitada | Conforme | `budgets-page.component.html:126`, `:190` e `:200` contêm alerta, ação habilitada e atalho desabilitado com tooltip exigido. `budgets-page.component.spec.ts:666` exercita categorias com registro zerado e sem registro ativo, incluindo abertura na categoria correta. |
| CA4 | Zeramento explícito preservando registro, confirmação e cancelamento sem escrita | Conforme | `BudgetService.java:149` grava zero no orçamento existente; `BudgetServiceTest` verifica identidade preservada, ausência de exclusão e repetição idempotente. `budgets-page.component.ts:167` só escreve após confirmação. Testes da página `:652`, `:719` e `:732`, mais testes do `ConfirmModal`, cobrem confirmação, cancelar, X, Escape e backdrop inerte. |
| CA5 | Bloquear teto positivo inferior ao gasto com 409, manter formulário e aceitar igualdade | Conforme | `BudgetService.java:124` valida antes de alterar o orçamento. `BudgetBelowSpentException.java:10` produz a mensagem com valor BRL; `GlobalExceptionHandler.java:21` traduz para 409. `BudgetServiceTest` cobre ausência de alteração no conflito e igualdade com escalas decimais diferentes. `budgets-page.component.spec.ts:746` confere mensagem, formulário preservado e atalho desabilitado com tooltip. |
| CA6 | Rejeitar valores inválidos no formulário e na API | Conforme | `BudgetSetDTO.java:11` usa `NotNull`, `DecimalMin` e `Digits`. `BudgetControllerTest:148` verifica 400 sem chamar o serviço para nulo, zero, negativo e terceira casa decimal. `budget-form-modal.component.ts:193` valida o controle numérico; testes do modal `:267` e `:303` verificam bloqueio e mensagem. A máscara de centavos foi considerada conforme o ajuste posterior expressamente autorizado. |
| CA7 | Isolamento de leituras e escritas por proprietário | Conforme | `BudgetService.java:63`, `:118` e `:151` resolvem primeiro a obra pelo usuário autenticado, antes de acessar dados financeiros. `BudgetAntiIdorIntegrationTest:59` exercita GET com JWT real para obra alheia, inexistente e ID malformado. Testes do serviço cobrem bloqueio de PUT/zeramento sem consultas ou persistência posteriores. A prova de escrita combina testes do serviço e contrato MVC; não existe nessa suíte um teste HTTP integrado equivalente ao GET para ambos os verbos. |
| CA8 | Estado vazio orientativo e ausência de consulta sem obra ativa | Conforme | `budgets-page.component.ts:89` limpa o painel sem consultar orçamento/categorias quando não há obra. `budgets-page.component.html:1` orienta seleção/cadastro com link para Home; `:89` apresenta texto e CTA do primeiro orçamento. Testes `:407`, `:433`, `:460` e `:569` cobrem os estados e abertura do formulário. |
| CA9 | Cancelamento, troca de obra, prevenção de duplo envio e respostas antigas | Conforme | `budgets-page.component.ts:83` fecha diálogos e recarrega quando muda o identificador da obra. O modal captura o `projectId`; `budget-form-modal.component.ts:134` impede envio repetido e `:186` invalida respostas de contextos antigos. O zeramento usa trava e contador de contexto em `budgets-page.component.ts:167`. Testes da página `:193`, `:261`, `:298` e `:336` cobrem mesma obra sem recarga, troca real, A → B → A e submissão repetida. |
| CA10 | Recuperação de falhas e encerramento da sessão expirada de ponta a ponta | **Parcial — bloqueia** | Falhas de rede, timeout sinalizado e 5xx preservam o formulário/diálogo e permitem repetir; testes em `budgets-page.component.spec.ts:829`. O caminho de **401 recebido** limpa sessão e navega para `/login`, comprovado em `:894`, porém o teste injeta 401 pelo `HttpTestingController` em `:916`. O backend atual deixa JWT inválido/expirado sem autenticação, mas não configura resposta 401; seu comportamento padrão de segurança é 403, que não aciona o logout do interceptor. Detalhamento abaixo. |

## Pendências que bloqueiam o PR

1. **CA10: a expiração real da sessão não fecha o contrato entre backend e frontend.**

   `TokenService.validateToken()` devolve uma string vazia quando a verificação do JWT falha. `apps/api/src/main/java/com/obracerta/configuration/security/SecurityFilter.java:30` segue a cadeia sem autenticar esse pedido. Em `SecurityConfigurations.java:27`, a cadeia exige autenticação, mas não configura `authenticationEntryPoint` para devolver 401.

   A fonte **local** da dependência `spring-security-config-6.5.2-sources.jar`, classe `ExceptionHandlingConfigurer.java:236`, confirma que, sem configuração correspondente, o entry point padrão é `Http403ForbiddenEntryPoint`.

   Já `apps/web/src/app/core/interceptors/auth-interceptor.ts:21` chama `logout()` somente para status 401. Assim, quando o token expira com a página já aberta, a cadeia atual conduz a 403, deixando o tratamento da página apresentar falha de conexão sem executar o encerramento de sessão previsto na spec.

   **Limite da evidência:** conclusão sustentada pelo código da aplicação e pelas fontes locais da versão utilizada do Spring Security. Não foi observado um 403 por HTTP nesta auditoria: a chamada de leitura a `localhost:8080` encontrou a API indisponível. Os testes atuais comprovam o tratamento de um 401 simulado, não a resposta real do backend para JWT expirado. Após triagem do autor, o contrato precisa ser alinhado e comprovado por teste integrado.

2. **As duas premissas de “Assume que” não possuem os `TODO #<issue>` exigidos pelo método.**

   A busca nos arquivos Java, TypeScript, HTML, SQL e properties de `apps` não encontrou nenhum `TODO`. Existem apenas referências às histórias:

   - `DemoDataSeederService.java:33`: US03/US05 no Javadoc;
   - `budgets-page.component.html:205`: US04/US05 no tooltip;
   - `budget-form-modal.component.html:81`: US05 no tooltip.

   Essas referências explicam a dependência ao leitor, mas não atendem à exigência de rastreabilidade explícita do auditor final. Os números corretos devem vir do backlog confirmado pelo autor, sem inventar correspondências.

   **Limite remoto:** não foram consultadas Issues. Portanto, não afirmo que estejam ausentes ou fechadas; afirmo a ausência comprovada dos vínculos locais exigidos e a indisponibilidade de confirmação de seu estado remoto nesta auditoria exclusivamente local.

Nenhuma correção foi aplicada. Os apontamentos permanecem sujeitos à triagem do autor.

## Documentação

- **prd.md:** atualizado para US07 🟢 Live, com ressalva explícita de que auditoria e integração ainda estavam pendentes e de que o status não significa implantação. Os atalhos desabilitados foram alinhados à spec.
- **architecture.md:** acompanha DTOs, endpoints, estados, cálculos, migrations V6/V7, vínculo legado de despesas, máscara BRL e proteção contra respostas antigas. Também distingue modelo lógico de schema físico e descreve corretamente a infraestrutura atual de testes. O encerramento de sessão em 401 está documentado, mas a integração da expiração real permanece pendente conforme o bloqueio 1.
- **specs/README.md:** contém a US07 como implementada, com auditoria e PR pendentes. Não anuncia integração concluída.
- **Schema e demonstração:** V6/V7 são migrations novas; há testes de constraints, saneamento de duplicatas e categorias. O seeder automático exige perfil `dev` e habilitação explícita; `SEED_ENABLED` é falso por padrão.
- **Escopo:** as alterações de projetos e seleção global pertencem à dependência US14 declarada originalmente. Os ajustes autorizados de máscara, badges e atualização da mesma obra foram considerados no exame. Não houve implementação de CRUD/reclassificação de despesas nem ativação dos atalhos adiados.
- **Integração:** não houve consulta remota, fetch, push ou criação de Issue/PR. A integração da US14 e o estado das Issues de dívida não estão confirmados por esta auditoria local.

## Matéria-prima para a seção "O que este PR faz e por quê"

- Define e atualiza um teto por obra/categoria, com unicidade ativa e bloqueio de valores positivos inferiores ao gasto realizado.
- Apresenta totais, saldo, progresso e alertas usando despesas ativas e limiares financeiros calculados com `BigDecimal`.
- Permite zerar o teto com confirmação, preservando o registro e evidenciando despesas sem planejamento.
- Integra o painel à obra ativa, com cancelamento de diálogos na troca e descarte de respostas pertencentes a contextos antigos.
- Entrega nove categorias por migration e um cenário demonstrativo opcional em desenvolvimento, mantendo os atalhos de despesas desabilitados.
