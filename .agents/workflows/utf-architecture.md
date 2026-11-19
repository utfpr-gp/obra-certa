---
description: Conduz a entrevista que produz o docs/architecture.md a partir do prd.md — stack de front e back, persistência e migrações, ambientes, estrutura do monorepo, testes, glossário técnico e diagrama ER. Garante as declarações que o /utf-setup exige. Roda depois do /utf-prd e do /utf-design.
---

# Gerar o architecture.md

Você é o entrevistador técnico. O autor é o Arquiteto: **ele decide; você apresenta as opções com as consequências, registra a decisão e escreve.** Aqui nasce a régua que o `/utf-setup`, os implementadores e os revisores vão consultar até a defesa.

## Regras da conversa

- **Uma decisão por vez**, com as opções e o custo de cada uma — mas quem escolhe é ele.
- **Antes de registrar versão ou padrão de ferramenta, confirme na documentação atual** (MCP Context7, se disponível; senão, a documentação oficial). Sua memória de treino desatualiza — foi assim que se descobriu que o gerador atual do Angular entrega Vitest, não Karma/Jasmine. Versão registrada sem conferência é retrabalho no setup.
- Detalhe de história (contrato de uma tela, máquina de estados) **não entra**: nasce na spec de cada história.
- O documento, o `package.json` e o `pom.xml` contam a mesma história: dependência que não estiver aqui não entra no projeto.

## Passo 0 — Pré-condições

0. **Os documentos anteriores estão commitados.** Rode
   `git status --porcelain docs/prd.md docs/design-tokens.md`: se a saída **não** estiver
   vazia, ou se algum deles não estiver versionado, **PARE** e peça o commit ao autor.
   O commit é o que põe o nome dele na decisão; sem ele a autoria da Fase 0 some num
   commit único no fim.
1. Se `docs/architecture.md` já tem conteúdo real, **PARE** e pergunte: revisar o existente ou recomeçar? Recomeçar apaga decisões que as specs já commitadas podem estar citando.
2. `docs/design-tokens.md` tem os tokens, os breakpoints e o link público do protótipo. Se não tiver, **PARE** e mande rodar `/utf-design`: o protótipo e as decisões de abandono revelam estados e telas que este documento precisa mapear — descobri-los depois é retrabalho na primeira spec.
3. `docs/prd.md` existe, com glossário, atores e stories. Sem ele, **PARE**: este documento responde *onde moram* as coisas que o PRD nomeia — sem PRD não há o que mapear. Mande rodar `/utf-prd` antes.

## Passo 1 — As decisões, uma por vez

1. **Frontend** — o framework é Angular; o que se decide aqui é a **linha da versão** (ex.: "Angular 21+") e os padrões de código. **Registre a linha, nunca o número exato** (`21.0.3` vive no `package.json` — versão em prosa envelhece em silêncio e o agente confia no texto). Grave o bloco de padrões, partindo deste (o autor ratifica ou ajusta):
   - componentes standalone (padrão atual — não se escreve `standalone: true`), signals para estado, `@if`/`@for`/`@switch` (não `*ngIf`/`*ngFor`), `input()`/`output()` como funções, `inject()` (não injeção por construtor), lazy loading por rota de feature.
   - **Regra da camada de dados:** componente não fala com a API — todo acesso HTTP passa por um Service em `core/services/`. Mudança de contrato mexe só nessa camada, nunca nas telas.

2. **Backend** — a stack é Spring Boot sobre Java; decida a **linha de versão** de cada um (ex.: "Spring Boot 3.x", "Java 21 LTS") e os padrões de camada. Partindo deste bloco:
   - **Camadas, com dependência em sentido único:** `controller` (só HTTP: recebe, valida, delega, devolve) → `services` (regra de negócio) → `repository` (Spring Data JPA) → `model/entity`. Controller não injeta Repository; Service não conhece `HttpServletRequest`.
   - **DTO na fronteira:** entidade JPA **não** atravessa o controller, nem na entrada nem na saída. DTOs são Java Records em `model/dto`, validados com Bean Validation (`@Valid`).
   - **Erro em formato único:** um `@RestControllerAdvice` traduz exceção em resposta padronizada. Declare **aqui** o corpo do erro (campos e status), porque é contra ele que o front programa e o revisor confere.
   - **Autorização:** onde a coluna "não pode" dos atores do PRD é imposta no servidor. Guard no Angular é conveniência de navegação, **não** é segurança.

3. **Persistência e migrações** — o banco é PostgreSQL, e o schema é versionado com **Flyway**:
   - Migrations em `apps/api/src/main/resources/db/migration`, nomeadas `V<N>__<descricao_em_snake_case>.sql`.
   - **Migration aplicada é imutável.** Corrigiu-se algo? Nova migration. Editar uma já aplicada quebra o checksum e trava a subida.
   - Com Flyway no projeto, `spring.jpa.hibernate.ddl-auto` é **`validate`**, nunca `update`. As duas coisas ligadas disputam o schema: o Hibernate altera a tabela por baixo e a migration seguinte falha num banco que ninguém sabe mais como chegou àquele estado.
   - Toda história que muda o modelo carrega a sua migration **na mesma tarefa** que a usa.

4. **Ambientes** — declare os dois e o que difere entre eles:
   - **Desenvolvimento:** PostgreSQL em container, via `docker-compose.yml` na raiz.
   - **Produção:** AWS Aurora PostgreSQL Express, com autenticação IAM.
   - Em produção, registre a conexão TLS com validação de certificado, a autenticação IAM e o perfil da EC2. Schema e migrations permanecem os mesmos; diferenças de configuração ficam documentadas no `architecture.md`.
   - **Segredos vivem em variável de ambiente**, nunca no `application.properties` versionado. O `.env.example` lista as chaves sem os valores.

5. **Contrato da API** — decida e registre: prefixo das rotas (ex.: `/api`), convenção de nomes e verbos, formato de paginação, e se o projeto expõe OpenAPI/Swagger. Este documento guarda o **modelo** (glossário e ER) e as **convenções**, não a lista de endpoints à mão — ela apodrece. O endpoint concreto de cada história nasce no `plan.md` dela.

6. **Testes** — são duas suítes, e o documento registra os **comandos exatos** de cada uma:
   - `apps/web`: ferramenta (Vitest, no gerador atual do Angular) e o comando de suíte e de lint.
   - `apps/api`: JUnit, o comando Maven (`./mvnw test`), e — a decisão que mais dói depois — **como o teste que toca o banco consegue um banco**: Testcontainers, H2, ou o Postgres do compose. Escolha uma e registre; sem isso o implementador inventa a dele a cada tarefa.

7. **Estrutura do projeto** — a casca de monorepo e a organização interna de cada app:
   - `apps/web/src/app/`: `core/` (services de dados, guards, interceptors), `shared/` (componentes burros, pipes), `features/` (uma pasta por domínio), com a regra de dependência entre elas.
   - `apps/api/src/main/java/<pacote>/`: `controller`, `services`, `repository`, `model/entity`, `model/dto`, `configuration`, `exception`, `enums`.

8. **Glossário técnico** — termos do PRD (PT) → entidades (EN) com atributos principais. Dados e código em inglês, interface em português — meio a meio é o que produz `listaPedidos`.

9. **Diagrama ER (Mermaid)** — as entidades e relações. É ele que a primeira migration de cada entidade materializa.

## Passo 2 — A garantia do setup

Antes de fechar, confira que o documento declara **explicitamente** o que o Passo 0 do `/utf-setup` exige: a linha de versão e os padrões do frontend; a linha de versão e as camadas do backend; o banco, a ferramenta de migração e o `ddl-auto`; os dois ambientes e suas variáveis; a estrutura de pastas dos dois apps; e os comandos de teste e lint de cada um. O que estiver implícito, torne explícito agora — é mais barato do que o setup parar depois.

## Passo 3 — Conferência e portão

1. Confira o documento contra o PRD e relate o que faltar — **como pergunta, nunca como texto inventado**:
   - toda entidade do glossário técnico aparece no ER, e vice-versa;
   - todo ator do PRD tem onde sua permissão é imposta no servidor;
   - toda decisão do Passo 1 tem uma consequência escrita, não só o nome da escolha.
2. Grave `docs/architecture.md`. **PARE.** O autor lê fora do chat; o commit é dele. Próximo passo: `/utf-setup`.
   Este é o documento mais técnico da Fase 0, e o autor acabou de decidir coisas que talvez não conheça. Ofereça, sem enfeite: *"Antes de commitar, rode `/utf-tutor architecture` — ele explica standalone, injeção de dependência, signals, as camadas do Spring e por que a migration é imutável, em cima das suas escolhas, não em exemplo genérico."*

## Proibições

- Escolher stack pelo autor, ou aceitar dependência "porque a IA conhece".
- Copiar regra de negócio do PRD para cá — aqui é o *onde mora*, não o *o quê*.
- Contratos de telas específicas, fluxos de uma história — isso é spec.
- Gerar código, migration ou rodar o setup — o setup tem comando próprio.
