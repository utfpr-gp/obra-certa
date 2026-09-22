---
description: Gera a estrutura inicial do projeto a partir do docs/architecture.md — os dois apps via geradores oficiais, a raiz do monorepo, o compose de desenvolvimento, template de PR, Portão de Entendimento e índice de specs. Roda UMA vez, antes da primeira Issue. É uma Task de manutenção — sem spec.
---

# Setup do projeto

Você gera a fundação sobre a qual o ciclo SDD vai rodar. Isso é uma **Task técnica**,
não uma história: não tem `spec.md`, e o PR dela recebe a etiqueta `manutencao`.

A fonte da verdade é o `docs/architecture.md`. Você **não decide stack** — você lê a
que foi decidida. O que não estiver escrito lá, você pergunta; não escolhe.

Este projeto tem **dois apps**: `apps/web` (Angular) e `apps/api` (Spring Boot), mais
um banco PostgreSQL. Os três nascem aqui, e nascem **vazios de negócio**.

---

## Passo 0 — Pré-condições (PARE se qualquer uma falhar)

0. **Os documentos da Fase 0 estão commitados.** Rode `git status --porcelain docs/`:
   se a saída **não** estiver vazia, **PARE** e peça o commit. O scaffold vai nascer a
   partir do `architecture.md`; se ele ainda não está no histórico, o repositório não tem
   como provar qual decisão gerou qual arquivo — e é essa rastreabilidade que a defesa
   cobra.
1. `docs/prd.md`, `docs/architecture.md` e `docs/design-tokens.md` existem. O
   `architecture.md` declara: a linha de versão e os padrões do **frontend**; a linha de
   versão e as camadas do **backend**; o **banco**, a ferramenta de migração e o
   `ddl-auto`; os **dois ambientes** e suas variáveis; a **estrutura de pastas** dos dois
   apps; e os **comandos de teste e lint** de cada um. O `design-tokens.md` traz os
   valores que o tema vai receber.
   Se algo disso estiver ausente ou ambíguo, **PARE** e diga o que falta —
   setup com stack adivinhada é retrabalho garantido.
2. As pastas de app previstas no `architecture.md` (`apps/web` e `apps/api`)
   **não existem** ou estão vazias — um `.gitkeep` ou um `README.md` de reserva
   não conta como conteúdo.
   Se já existirem com conteúdo de verdade, **PARE**: o setup
   roda uma vez, e rodá-lo de novo por cima é destrutivo.
3. Você está na `develop`, limpa e atualizada (se a `develop` ainda não existe, crie-a a partir da `main` e publique: `git switch -c develop && git push -u origin develop` — o Gitflow exige as duas).
4. O `gh` está autenticado (`gh auth status`) **ou** o MCP do GitHub está
   disponível — sem um dos dois, a etiqueta e o Pull Request do fim não saem.
   Se faltar, **PARE** e oriente: instalar o `gh`, `gh auth login`, com os
   escopos `repo` e `workflow`.
5. Docker disponível (`docker --version`) — o banco de desenvolvimento sobe em
   container, e a prova de vida do Passo 6 precisa dele.

## Passo 1 — Branch

```
git switch -c chore/setup-projeto
```

Nenhum arquivo é criado antes da branch existir. No Gitflow, `main` e `develop` são bloqueadas — a branch do setup nasce da `develop` e volta para ela por PR.

## Passo 2 — O frontend, pelo gerador oficial

Gere o app Angular com `ng new` em `apps/web`, mais o `ng add` do que o
`architecture.md` declarar (framework CSS, PWA).

- **Antes de rodar, confirme na documentação atual** (MCP Context7, se
  disponível) a versão corrente do CLI e sua compatibilidade com o Node
  instalado — gerador desatualizado ou incompatível descoberto no meio do passo
  é retrabalho.
- Desative o `git init` interno do gerador — o repositório é um só, na raiz.
- **Gere com a instalação de dependências desligada** (`--skip-install`). O
  `package.json` da raiz, que declara os workspaces, só nasce no
  Passo 4 — e um `npm install` disparado antes dele cria um `node_modules`
  próprio dentro de `apps/web`, sem hoisting. A instalação acontece uma vez só,
  na raiz, no fim do Passo 4. Se algum `ng add` precisar rodar antes disso,
  faça a instalação da raiz primeiro.
- Aceite os padrões do gerador. Não adicione biblioteca que o `architecture.md`
  não menciona.
- **Os tokens do design viram CSS.** Instalado o framework, o
  `docs/design-tokens.md` precisa chegar ao arquivo de estilo global do app — é
  lá que o Tailwind lê. Enquanto isso não acontece, o documento é decoração: o
  autor decidiu a paleta e o app continua com as cores de fábrica.
  **Pergunte antes de escrever:** *"escrevo o bloco de tema a partir do
  `design-tokens.md`, ou você prefere escrever?"*
  - Se ele escrever, espere e confira ao fim contra o documento.
  - Se você escrever: transcreva **só o que está no documento** — cor,
    tipografia, espaçamento, arredondamento, breakpoints — para os namespaces do
    Tailwind (`--color-*`, `--font-*`, `--text-*`, `--radius-*`, `--spacing`,
    `--breakpoint-*`) dentro de `@theme`, **mantendo os nomes semânticos que o
    documento deu** (`--color-primary`, nunca `--color-azul-2`). Se o documento
    declara uma biblioteca de componentes com mecanismo próprio de tema
    (daisyUI, por exemplo), use o dela em vez do `@theme` cru — dois lugares
    declarando cor é a duplicação que o método existe para evitar.
  - **Valor que não estiver no documento, você não inventa** — pergunte. Cor
    escolhida por modelo de linguagem é exatamente o que o `/utf-design` existe
    para impedir; refazer isso aqui anula a atividade inteira.

  Nos dois casos, **só o tema**: nenhuma tela, componente ou classe de negócio.

- **O linter não vem no `ng new`.** O `architecture.md` declara um comando de
  lint, então instale o oficial: `ng add angular-eslint`. Ele gera o
  `eslint.config.js` e cria o alvo `lint` no `angular.json`. Sem isso, a prova de
  vida do Passo 6 roda um comando que não existe.
- Se o `architecture.md` declara ferramenta de teste diferente do padrão do gerador,
  siga o documento; se não declara, fique com o padrão do gerador e **relate isso no
  fim** como decisão que o usuário precisa ratificar no `architecture.md`.

## Passo 3 — O backend, pelo gerador oficial

Gere o projeto Spring Boot em `apps/api` pelo **Spring Initializr** (`start.spring.io`,
via `curl`), com Maven e o wrapper (`mvnw`), na linha de versão que o
`architecture.md` declarou.

- **Confirme a versão corrente na documentação oficial antes de gerar** — o
  Initializr recusa linhas fora de suporte, e descobrir isso no meio do passo é
  retrabalho.
- **Dependências: só as que o `architecture.md` declara.** O conjunto mínimo deste
  projeto costuma ser `web`, `data-jpa`, `postgresql`, `validation`, `flyway` — mas é
  o documento que manda, não esta lista. Dependência que ele não menciona, você
  pergunta; não inclui.
- **Crie a estrutura de pacotes vazia** que o documento descreve (`controller`,
  `services`, `repository`, `model/entity`, `model/dto`, `configuration`,
  `exception`, `enums`). Pastas, não classes: a primeira classe de negócio nasce na
  primeira Issue.
- **Ligue o Flyway, sem migration de negócio.** Crie
  `src/main/resources/db/migration/` vazia e configure `spring.flyway.enabled=true`
  com `spring.jpa.hibernate.ddl-auto=validate` — os dois juntos, porque é a
  combinação que o `architecture.md` declarou e é ela que faz a primeira migration
  de história funcionar. **Nenhuma tabela de negócio aqui.**
- **Configuração por ambiente, sem segredo versionado.** O
  `application.properties` lê tudo do ambiente
  (`${SPRING_DATASOURCE_URL}` e afins). Desenvolvimento aponta para o container;
  produção, para a Neon. Nenhuma senha entra no arquivo versionado.

## Passo 4 — A raiz

1. `.gitignore` da raiz — **antes do primeiro `git add`** — cobrindo os dois apps:
   `node_modules/`, artefatos de build do front (`dist/`, `build/`, `.angular/`,
   `coverage/`), artefatos do Maven (`target/`), o volume de dados do banco local, e
   `.env`. Confira o que os geradores deixaram: com `--skip-git`, alguns
   não criam `.gitignore` próprio — não é esquecimento, o da raiz cobre o projeto.
   Valide com `git status --short`: se aparecerem
   milhares de arquivos, o ignore não cobriu algo. (A IDE mostrar uma
   avalanche de untracked **entre** a geração e este passo é normal — ela
   some aqui.)
2. `.gitattributes` com:

   ```
   * text=auto eol=lf
   ```

   Sem isso, um repositório tocado em Windows e Linux reescreve todos os arquivos a
   cada troca de máquina, e o diff de qualquer PR vira ruído. O `mvnw` precisa de
   `eol=lf` para rodar em container Linux.

3. `package.json` da raiz — **a raiz do npm workspace**, no formato que o
   `architecture.md` declarar: `"private": true`, `"workspaces": ["apps/web"]` e os
   scripts de orquestração. O `apps/api` **não entra nos workspaces** — ele é Maven,
   não npm; quem o orquestra é o compose. Os scripts da raiz poupam o autor de entrar
   em `apps/web` a cada comando — a flag `-w apps/web` faz isso por ele. Se o
   documento traz os scripts prontos, copie-os literalmente.

   **Depois de criá-lo, rode `npm install` na raiz** — é esta instalação que junta as
   dependências num `node_modules` só. Se `apps/web/node_modules` existir (geração
   feita sem `--skip-install`), remova antes de instalar.

   Se o `architecture.md` declara **PWA**, rode `ng add @angular/pwa` e preencha o
   `manifest.webmanifest` com a identidade decidida no `/utf-design`
   (nome curto, cores, ícones) — sem inventar valores.

4. **`docker-compose.yml` e `.env.example` na raiz.** O compose sobe os serviços do
   `architecture.md` — no mínimo o `db` (PostgreSQL na linha declarada), e os apps se
   o documento previr containers para eles. Todas as credenciais vêm de variável de
   ambiente; o `.env.example` lista **as chaves sem os valores**, e o `.env` real fica
   fora do Git (Passo 4.1). Este é o banco de **desenvolvimento**: a Neon de produção
   não tem entrada nenhuma aqui, só a connection string no ambiente de deploy.

5. **Formatação, na raiz — regra do projeto, não preferência de quem digita.**

   Na raiz (sem `-w`, para ficarem como dependência da raiz e hoisted para todos
   os apps):

   ```
   npm install -D prettier eslint-config-prettier
   ```

   Mais um `.prettierrc` (pode nascer `{}` — o padrão do Prettier serve) e um
   `.editorconfig` com `indent_style`, `indent_size`, `end_of_line = lf` e
   `insert_final_newline`. Acrescente ao `package.json` da raiz:
   `"format": "prettier --write ."`.

   O `eslint-config-prettier` desliga as regras de estilo do ESLint que brigariam
   com o Prettier — a config recomendada do angular-eslint inclui
   `tseslint.configs.stylistic`, então o conflito é real, não teórico. Aplique-o
   **por último** no `eslint.config.js`.

   O lado Java tem a sua própria convenção: se o `architecture.md` declara um
   formatador (Spotless, google-java-format), configure-o no `pom.xml`; se não
   declara, **relate no fim** como decisão a ratificar. Não escolha por conta.

   Estes arquivos são o que o agente lê para saber como escrever: sem eles, cada
   máquina formata de um jeito e todo Pull Request vira ruído de espaço em
   branco. **Não instale extensão de IDE por eles** — extensão é da máquina de
   cada um; aqui o que se versiona é a regra.

## Passo 5 — As ferramentas do método

O `.github/` **já vem no template**: `pull_request_template.md`,
`ISSUE_TEMPLATE/` e `workflows/portao-de-entendimento.yml`.
Você não os gera — você **confere** que existem. Copiar YAML de dentro da prosa
do guia é exatamente como o Portão nasce parafraseado e sem efeito.

1. Confira que `.github/pull_request_template.md`,
   `.github/ISSUE_TEMPLATE/` e `.github/workflows/portao-de-entendimento.yml`
   existem. Se faltar algum,
   **PARE** e avise: o repositório não veio do template, e eles são
   pré-requisito do método — não subproduto do setup.
2. A etiqueta de manutenção no GitHub (é ela que marca PRs sem spec, a começar
   pelo deste setup):

   ```
   gh label create manutencao --description "PR tecnico, sem spec" --color FBCA04
   ```

3. **Proteção das branches `main` e `develop`.** Sem isso, *"a `main` é sagrada"* é a única
   regra da constituição sem mecanismo nenhum — e proteção de branch **não é
   herdada de repositório template**, então é preciso ligá-la neste repositório.
   Proponha ao usuário e, com o OK, rode:

   ```
   gh api -X PUT repos/{owner}/{repo}/branches/main/protection --input - <<'JSON'
   {
     "required_status_checks": { "strict": false, "checks": [ { "context": "explicacao" } ] },
     "enforce_admins": true,
     "required_pull_request_reviews": { "required_approving_review_count": 0 },
     "restrictions": null,
     "allow_force_pushes": false,
     "allow_deletions": false
   }
   JSON
   ```

   O bloco `required_status_checks` exige que o check
   `explicacao` (o job do Portão de Entendimento) **passe antes do merge** — sem
   ele, o Portão reprovaria mas não bloquearia nada.
   `enforce_admins: true` faz a regra valer também para o
   dono do repositório: sem isso, o autor é justamente quem fura a regra sem
   perceber. Para destravar uma emergência ele desliga a proteção
   conscientemente, e isso fica registrado no log do repositório.

   **`required_approving_review_count` é `0` porque o TCC é individual** — não há
   colega para aprovar, e exigir uma aprovação travaria todo PR do autor no próprio
   repositório. O que continua valendo é o resto: PR obrigatório, Portão verde, sem
   force-push. **Se o orientador for colaborador do repositório** e quiser aprovar
   cada entrega, suba para `1` — é decisão do autor, então **pergunte** antes de
   gravar o número.

   **Repita o mesmo comando trocando `main` por `develop`** — no Gitflow as
   duas são protegidas: features entram na `develop` por PR, e a `main` só
   recebe releases vindas da `develop`.

   **Se a API recusar**, quase sempre é conta gratuita com repositório privado —
   proteção de branch exige repositório público ou plano pago. Relate e siga;
   não insista.
4. `specs/README.md` — o índice de specs, com a tabela vazia:

   ```markdown
   # Índice de specs

   | Issue | Spec | Estado | Observação |
   | --- | --- | --- | --- |
   ```

## Passo 6 — Prova de vida

São **duas suítes e um banco**, e as três precisam responder:

1. Suba o banco de desenvolvimento (`docker compose up -d db`) e confira que o
   Flyway inicializa sem erro — com `db/migration` vazia, ele só cria a tabela de
   controle. É agora que se descobre se a connection string está certa, não na
   primeira história.
2. Rode a suíte e o lint do `apps/web` pelos comandos da raiz.
3. Rode a suíte do `apps/api` (`./mvnw test`).

O scaffold precisa nascer **verde** dos dois lados. É esse verde que dá sentido ao
RED do TDD a partir da primeira tarefa: um teste que falha só é informação num
repositório onde os testes comprovadamente rodam.

**Mesmo princípio das 2 rodadas:** se um gerador ou a suíte falhar duas vezes pelo mesmo
motivo, **PARE** e relate. Não tente uma terceira abordagem.

## Passo 7 — Entrega

1. Commits pequenos e nomeados por passo (front, back, raiz, ferramentas do método) —
   **cada um proposto ao usuário antes** ("commit do passo X: <mensagem>?"),
   nenhum sem o OK dele.
2. **Despache o tutor em modo `setup`, antes do PR.** Este é o único momento do
   TCC em que o autor recebe um monte de arquivos que ele não escreveu e não
   viu nascer — se ninguém explicar, ele abre o primeiro PR sem saber o que tem
   dentro do próprio repositório. Não pergunte se ele quer: despache, apresente a
   explicação na íntegra e só então siga. O despacho leva `docs/architecture.md`,
   `docs/design-tokens.md`, a lista de arquivos gerados (incluindo o arquivo de
   estilo global com o tema, o `pom.xml` e o compose) e a saída dos testes.
3. Relate ao usuário: o que foi gerado, a saída dos testes, e as decisões que o
   `architecture.md` não cobria (Passos 2 a 4) para ele ratificar no documento.
   **Ratificação aprovada pelo usuário = atualize o `architecture.md` na mesma
   branch**, antes do PR — documento e scaffold entram juntos, contando a mesma
   história.
4. Instrua o usuário a abrir o PR com a etiqueta **`manutencao`** — setup é Task,
   não história. O corpo já vem preenchido pelo
   `.github/pull_request_template.md`, que está na `main` desde o template.
   Explique o detalhe que ninguém adivinha:
   - **`Closes #<n>` no corpo do PR** liga o PR à Issue e a fecha no merge — é
     esse elo que fecha a rastreabilidade Issue → spec → código que a defesa
     cobra. O PR do setup não fecha Issue nenhuma, então não leva
     `Closes` — mas todo PR de história leva.

---

## Proibições

- **Nenhuma entidade, endpoint, tela, DTO, migration ou tabela de negócio.** Se um nome
  do glossário do PRD aparecer em código gerado por você, você passou do ponto — o
  negócio começa na primeira Issue, pelo `/utf-issue`, com spec aprovada.
- Nada de CI além do Portão de Entendimento — esteira de testes é Issue própria.
- Nada de deploy nem de configuração da Neon — produção é Issue própria. Aqui só
  nasce a leitura por variável de ambiente que torna o deploy possível depois.
- Não editar `docs/prd.md` nem `docs/architecture.md`. Se encontrar contradição
  entre eles, relate; não resolva por conta própria.
