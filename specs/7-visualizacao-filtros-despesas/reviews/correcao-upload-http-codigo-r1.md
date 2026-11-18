# Parecer de Código — Correção do transporte HTTP, rodada 1

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum.

## Fundamentação

Revisado integralmente o diff dos três arquivos `apps/web/src/app/app.config.ts`, `apps/web/src/app/app.config.server.ts` e `apps/web/src/app/app.config.spec.ts`, contra `92ce54998a31ea3bf2025f67658d3b2494cbb53e`, incluindo alterações da worktree. A régua arquitetural considera o conteúdo commitado de `docs/architecture.md`, desconsiderando as alterações externas da US15 identificadas pelo diff contra HEAD.

- **Arquitetura e escopo:** a mudança permanece na configuração de infraestrutura HTTP. Não introduz comunicação HTTP em componentes, regra financeira duplicada, abstração desnecessária, segredo ou configuração de ambiente. Respeita a separação de responsabilidades e o contrato do interceptor descritos em `docs/architecture.md`, seção 5.1.
- **Injeção de dependências:** no Angular 21.2.11 instalado, `provideHttpClient()` seleciona `HttpXhrBackend` quando não existe provider de Fetch. A configuração do servidor acrescenta `withFetch()` após a configuração comum. Os interceptores funcionais são providers múltiplos; a segunda configuração preserva o `authInterceptor` registrado na primeira. A leitura da implementação instalada confirma essa composição.
- **Autenticação e erros:** os testes exercitam os providers efetivos e verificam Bearer no upload, propagação do erro 401 e uma chamada de logout. O teste do servidor também confirma que a composição com Fetch mantém o header de autenticação.
- **Qualidade dos testes:** a instrumentação ocorre na fronteira de transporte, por `XhrFactory`, mantendo o backend Angular real. A verificação de `UploadProgress` intermediário, antes da resposta, cobre precisamente a regressão que um backend de testes substituto esconderia. As verificações das classes de backend são pertinentes ao requisito explícito de transporte deste ajuste.
- **Isolamento:** cada teste de navegador recebe um novo XHR instrumentado; `open` e `send` não acessam a rede. Os spies de Fetch também impedem tráfego externo. As assinaturas são encerradas em `finally`, e os spies seguem o ciclo de restauração do Jasmine. Não identifiquei estado compartilhado mutável que contamine outros testes.

Conferi os logs centralizados: RED com 3 falhas e 2 sucessos, GREEN com 5 sucessos, suíte com 395 sucessos e build concluído com seis rotas prerenderizadas. Não repeti testes, Chrome ou GUI. Essa evidência valida a configuração e a passagem dos eventos pelo backend real; não representa upload remoto ou medição de progresso em rede real.

## Sugestões (não bloqueiam)

Nenhuma necessária para este recorte.

## Observações fora do escopo deste diff

- A integração da US04 permanece sob responsabilidade exclusiva do autor, conforme decisão registrada. Este parecer aprova a correção HTTP; não libera o PR inteiro nem resolve a pendência de integração.
- O aviso preexistente de orçamento do bundle permanece no build: 710,30 kB para limite de aviso de 500 kB.
- Os testes dos providers emitem NG0505 por ausência de resposta SSR serializada no ambiente de teste; os logs não indicam falha associada.
- As alterações externas da US15 e os artefatos da auditoria da Issue #9 não foram atribuídos a esta correção.

Revisão realizada somente por leitura, sem alterações, staging ou commits.
