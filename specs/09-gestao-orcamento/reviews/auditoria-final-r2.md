# Auditoria Final — Issue #9

**Rodada:** 2. A r1 deu NÃO PRONTO; os dois apontamentos aceitos em `auditoria-final-decisoes-r1.md` foram tratados nas tarefas 11 (607f196) e 12 (1b5b658).

**Veredito:** NÃO PRONTO

**Como esta rodada foi feita:**
- **Régua:** `git show 1b5b658:specs/09-gestao-orcamento/spec.md`, a spec aprovada. Li também as seções "Fora de escopo", "Abandono no meio" e "Assume que". O `plan.md` foi ignorado.
- **Diff auditado:** `git diff 396e97e 1b5b658`, com 104 arquivos. Só entra o que a US07 entregou sobre a ponta da US14.
- **Testes:** não rodei testes, porque não posso escrever arquivos. Uso como evidência a execução que o orquestrador fez em 1b5b658, com Postgres 16 limpo:
  - backend: 100 testes, 0 falhas;
  - frontend (Karma/ChromeHeadless): 189 de 189 passando;
  - build do frontend: OK, com aviso de bundle inicial de 571,96 kB para um orçamento de 500 kB;
  - migrations V1 a V7 aplicadas do zero.
- **Remoto:** não consultei o GitHub nem o estado das Issues.

## Situação das pendências da r1

1. **CA10, JWT expirado precisa devolver 401 real e acionar o logout. Resolvido como pedido, mas a correção abriu uma regressão (ver bloqueio 1 abaixo).**
   - `SecurityConfigurations.java:33-34` configura `authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))`.
   - `BudgetAuthenticationIntegrationTest` (`@SpringBootTest` com cadeia de segurança real) cobre token expirado, inválido e ausente nas quatro operações (GET, PUT de criação, PUT de atualização e zeramento). Em todas, exige 401 e nenhuma alteração na tabela `budgets`.
   - O mesmo teste confirma que o 403 continua valendo para usuário sem papel ADMIN em `/api/users`, que o ADMIN mantém o acesso e que login e registro continuam públicos.
   - No frontend, `budgets-page.component.spec.ts:894` cobre a ponta do contrato (401 encerra a sessão e navega para `/login`). Isso é apoiado por `auth.ts` (`logout()` vai para `/login`) e pela rota `login` em `app.routes.ts`.
2. **TODOs vinculados às Issues das premissas. Resolvido.**
   - A premissa do seeder ser a única fonte de despesas tem `TODO #5` (US03) e `TODO #7` (US05) em `DemoDataSeederService.java:34-36`.
   - A premissa dos atalhos desabilitados tem `TODO #6` (US04) e `TODO #7` (US05) em `budgets-page.component.html:201-202`, e `TODO #7` em `budget-form-modal.component.html:77`.
   - Os números são os que o autor confirmou em `auditoria-final-decisoes-r1.md`. A pasta `specs/5-cadastro-despesas/`, que já está na develop, bate com US03 = #5. O estado remoto das Issues não foi verificado.

## Critérios de aceite da spec

| # | Critério | Situação | Evidência (arquivo:linha / teste) |
| --- | --- | --- | --- |
| CA1 | Criar ou atualizar o teto por obra/categoria, com um único registro ativo, devolvendo planejado, gasto e percentual recalculados | Conforme | `BudgetService.java:116-145`: verifica a propriedade da obra, reaproveita o registro ativo ou cria um novo e devolve `BudgetCategoryDTO`. O índice único ativo da V6 garante a unicidade. Testes: `BudgetServiceTest:202`, `:240` e `:441`; `BudgetSchemaMigrationTest:133` e `:147`; `budgets-page.component.spec.ts:495` e `:519`; `BudgetAuthenticationIntegrationTest.validJwtAllowsBudgetOperations` (CREATE e UPDATE pela cadeia real). |
| CA2 | Barras por categoria, totais, saldo possivelmente negativo, cores pela razão exata e "—" quando o planejado é zero | Conforme | `BudgetService.java:61-114` faz a agregação. `:193-204` decide o estado comparando `BigDecimal` antes de arredondar. `:206-211` devolve percentual `null` quando o teto é zero. `budgets-page.component.ts:205-208` exibe "—". Template: `budgets-page.component.html:52-87` e `:142-167`. Testes: `BudgetServiceTest:65`, `:106` (89,99% aparece como 90,0% e continua verde) e `:139`; spec da página `:360` e `:372`. |
| CA3 | Alerta de despesas sem teto, "Definir teto" habilitado e "Reclassificar despesa" desabilitado com tooltip | Conforme | `budgets-page.component.html:126-131` (texto exato do alerta), `:190-199` ("Definir teto" abre o formulário na categoria) e `:203-211` (botão `disabled` com o título exigido). Testes: spec da página `:666` (com e sem registro) e `:703`. |
| CA4 | Zerar com confirmação, sem apagar o registro e recalculando; cancelar, X ou Escape não enviam requisição | Conforme | `BudgetService.java:147-166` grava `0.00` no registro existente. `budgets-page.component.ts:166-192` só chama a API depois da confirmação e recarrega o painel do servidor. Testes: `BudgetServiceTest:319` e `:476`; spec da página `:652`, `:719` e `:732`; spec do `ConfirmModal` (backdrop inerte, Escape). |
| CA5 | 409 abaixo do gasto, formulário mantido aberto, atalho desabilitado com tooltip, igualdade aceita | Conforme | `BudgetService.java:124-128` valida antes de alterar. `GlobalExceptionHandler.java:17-29` devolve 409. `budget-form-modal.component.ts:165-170` e `.html:76-87`. Testes: `BudgetServiceTest:395` e `:419` (igualdade com escalas diferentes); `BudgetControllerTest:163`; spec do modal `:279`; spec da página `:746`. |
| CA6 | Vazio, zero, negativo ou mais de 2 casas: bloqueio na tela e 400 na API | Conforme | `BudgetSetDTO.java:10-13` usa `@NotNull`, `@DecimalMin("0.01")` e `@Digits(fraction=2)`. `budget-form-modal.component.ts:52-58` e `:193-206`. Testes: `BudgetControllerTest:150`; spec do modal `:143`, `:267` e `:303`. A máscara de centavos já tinha sido aceita em revisão anterior. |
| CA7 | Anti-IDOR: 404 "Projeto não encontrado" ou "Categoria não encontrada" em leituras e escritas | Conforme | `BudgetService.java:63`, `:119` e `:150` resolvem a obra pelo usuário autenticado antes de qualquer acesso; `:121-122` e `:152-153` tratam a categoria. Testes: `BudgetAntiIdorIntegrationTest:58` (GET com JWT real: obra alheia, inexistente e ID malformado); `BudgetServiceTest:188`, `:273`, `:287`, `:303` e `:382`; `BudgetControllerTest:116`, `:128` e `:141`. Para PUT e zeramento em obra alheia continua não existindo teste HTTP integrado (a cobertura é de serviço mais MVC), como já registrado na r1. Não bloqueia. |
| CA8 | Estado vazio com o texto e o CTA exigidos; sem obra ativa, nenhuma chamada à API e link para a Home | Conforme | `budgets-page.component.ts:89-96` não chama a API sem obra ativa. Template: `budgets-page.component.html:1-19` e `:89-106`. Testes: spec da página `:407`, `:433`, `:460` e `:569`. |
| CA9 | Cancelar/X/Escape, troca de obra e duplo envio | Conforme | `budgets-page.component.ts:82-99` fecha os diálogos e recarrega quando o ID da obra muda. `:167-192` trava o zeramento e controla o contexto. `budget-form-modal.component.ts:134-137` e `:176-189` impedem o reenvio e descartam respostas de contexto antigo. Testes: spec da página `:193`, `:231`, `:261`, `:284`, `:298` e `:336`; spec do modal `:197`, `:208`, `:224`, `:234` e `:245`. |
| CA10 | Rede/5xx mantêm os valores, avisam e permitem nova tentativa; 401 encerra a sessão e leva a `/login` sem gravação parcial | **Parcial (bloqueia)** | O caminho do 401 está resolvido (ver pendência 1 da r1). Rede, timeout e 5xx estão cobertos com respostas simuladas em `budgets-page.component.spec.ts:830`, `:844` e `:869`. Porém, com a mudança da tarefa 11, um 5xx real do backend vindo de exceção não mapeada, para usuário autenticado, tende a chegar ao navegador como 401. O usuário é deslogado e perde o que digitou, em vez de ver o aviso com nova tentativa. Detalhes no bloqueio 1. |

## Pendências que bloqueiam o PR

1. **CA10: a tarefa 11 transforma erros reais de servidor em 401, o que dispara o logout.**

   **Mecanismo, no código de 1b5b658:**
   - `GlobalExceptionHandler.java:14-65` trata só três exceções: `BudgetBelowSpentException`, `ResourceNotFoundException` e `MethodArgumentNotValidException`. Não há tratamento genérico.
   - Qualquer outra falha cai no despacho de erro do contêiner para `/error`. Exemplos: banco fora do ar, `DataIntegrityViolationException` numa corrida de dois PUTs contra o índice único da V6, JSON malformado (`HttpMessageNotReadableException`) ou `GET /api/budgets` sem `projectId`. As três últimas são tratadas pelo `DefaultHandlerExceptionResolver` com `sendError`, o que também leva a `/error`.
   - `SecurityConfigurations.java:35-41` não libera `/error` nem `DispatcherType.ERROR`; a rota cai em `anyRequest().authenticated()`.
   - `SecurityFilter.java:36` coloca a autenticação só no `SecurityContextHolder`, sem salvá-la no `SecurityContextRepository`. Como é um `OncePerRequestFilter`, também não roda de novo no despacho de erro.
   - Pela semântica do Spring Boot 3.5.4 com Spring Security 6.x, o despacho de erro passa de novo pela cadeia (o `AuthorizationFilter` filtra todos os tipos de despacho), agora como anônimo. Ali ele é negado e passa pelo entry point configurado na tarefa 11, que responde 401.
   - Antes da tarefa 11 esse mesmo caminho dava 403, o que estava errado, mas era inofensivo: a tela mostrava o aviso de falha e o botão de nova tentativa. Agora `auth-interceptor.ts:21-22` chama `logout()`.

   **Efeito:** o caminho "5xx, valores mantidos, nova tentativa" do CA10 só vale para 5xx de proxy ou gateway, ou para falha de rede. O `architecture.md` (§5.1 item 7 e a semântica de 500 em §5.2) promete o comportamento contrário.

   **Limite da evidência:** a conclusão vem da leitura do código e da semântica conhecida da versão do framework. Não foi observada por HTTP. Os testes atuais não conseguem revelar o problema, porque o MockMvc não executa o encaminhamento para `/error`, e o frontend simula o 5xx com `HttpTestingController`.

   **Para confirmar:** um teste `@SpringBootTest(webEnvironment = RANDOM_PORT)` com JWT válido que envie, por exemplo, `PUT /api/budgets/{id}/categories/{cat}` com corpo malformado, esperando 400 e não 401, ou que force uma exceção não mapeada, esperando 500. A correção cabe à triagem do autor. As direções óbvias são liberar o despacho de erro na cadeia ou guardar o contexto no repositório por requisição. Um tratador genérico de 500 cobre só parte do problema.

Não apliquei nenhuma correção. A triagem dos apontamentos é do autor.

### Observações que não bloqueiam

- **Timeout no cliente:** não há timeout explícito em `budget.service.ts:14-35`. O caso "timeout" do CA10 depende do navegador ou de um proxy (504) para virar erro. O teste em `:830` simula `ProgressEvent('timeout')`.
- **Unicidade sem tratamento de 409:** o `architecture.md` §5.2 promete 409 para "violações de unicidade de banco" (linha anterior à US07), mas nenhum tratador mapeia `DataIntegrityViolationException`. Com o bloqueio 1, uma corrida entre dois PUTs resultaria em 401.
- **Bundle:** o build passa com aviso de bundle inicial de 571,96 kB para 500 kB, como já registrado na r1.

## Documentação

- **prd.md:** US07 aparece como Live, com a ressalva "Auditoria final e integração por PR ainda pendentes". Com o PR #30 mergeado e esta rodada registrada, essa ressalva precisa ser atualizada. Também precisa refletir o resultado da triagem do bloqueio 1. O critério 7 do PRD foi alinhado à spec (atalho desabilitado).
- **architecture.md:** cobre o contrato da US07 (endpoints, DTOs, `BudgetState`, V6/V7, seeder) e a separação 401/403 introduzida na tarefa 11. Mas §5.1 item 7 ("Falhas de rede/5xx chegam aos componentes…") e a linha de 500 em §5.2 não valem no stack real enquanto o bloqueio 1 existir. O documento acerta ou o código acerta: é preciso alinhar um dos dois.
- **specs/README.md:** a linha `#09` diz "Dez tarefas… auditoria final e PR pendentes", mas há 12 tarefas e o PR foi mergeado. Continua lá a linha `#04 specs/004-gestao-orcamento/ Aguardando (HU07)`, que duplica a história e aponta para uma pasta que não existe. As linhas `#05`, `#06` e `#07` (Project, Seeder, integração da Home) usam números que os novos `TODO #5/#6/#7` atribuem a US03/US04/US05. A develop já marca `#05` como "legado", mas `#06` e `#07` continuam ambíguas.
- **Dívida declarada:** as duas premissas de "Assume que" têm TODO vinculado (ver pendência 2 da r1). O estado remoto das Issues #5, #6 e #7 não foi confirmado. Nota: a US03 (#5) já foi integrada na develop depois desta história (PR #31), então o `TODO #5` do seeder pode ter virado trabalho exequível.
- **Escopo:** nada fora da spec. As mudanças laterais servem à história:
  - extração de `UserContextHelper`, com `ProjectService` refatorado para usá-lo;
  - rota `/login` e `logout()` navegando para ela, por causa do CA10;
  - `saving` no `ConfirmModal`, por causa do CA9;
  - seeder restrito ao perfil `dev` e desligado por padrão, que é a premissa declarada.

  O CRUD e a reclassificação de despesas não foram implementados, e os atalhos continuam desabilitados, como a spec pede.

## Matéria-prima para a seção "O que este PR faz e por quê"

- Endpoints `GET /api/budgets`, `PUT .../categories/{categoryId}` e `POST .../zero` para definir, atualizar e zerar o teto por obra/categoria. Há um único registro ativo garantido por índice parcial (V6), e o PUT bloqueia, com 409, valor positivo abaixo do gasto já realizado.
- Painel com totais, saldo, percentual global e barras por categoria. As cores saem da razão exata em `BigDecimal`, e o percentual fica nulo quando o teto é zero, evitando divisão por zero.
- Auditoria de despesas em categoria sem teto, com "Definir teto" habilitado e atalhos de despesas visíveis porém desabilitados (TODO #6/#7) até US04/US05.
- Painel ligado à obra ativa: a troca de obra fecha os diálogos e descarta respostas antigas, e o duplo envio fica bloqueado durante a requisição.
- Nove categorias via migration V7, seeder de demonstração opcional no perfil `dev`, e a cadeia de segurança agora responde 401 para JWT ausente, inválido ou expirado. Este último ponto ainda depende da triagem do bloqueio 1.
