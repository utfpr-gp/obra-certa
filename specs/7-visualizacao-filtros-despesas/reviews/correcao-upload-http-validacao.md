# Validação — correção do transporte HTTP para uploads

Correção do item 1 aceito em `auditoria-final-decisoes-r1.md`, sem alterar a spec aprovada. A configuração global da US05 havia selecionado Fetch, incompatível com os eventos de progresso usados no cadastro e nos detalhes de despesas.

## Entrega

- `apps/web/src/app/app.config.ts`: mantém `provideHttpClient(withInterceptors([authInterceptor]))` sem habilitar Fetch no navegador. No Angular instalado 21.2.11, esse arranjo seleciona `HttpXhrBackend`.
- `apps/web/src/app/app.config.server.ts`: habilita Fetch exclusivamente no arranjo de renderização do servidor; preserva a configuração de autenticação herdada.
- `apps/web/src/app/app.config.spec.ts`: cinco testes com os providers reais da aplicação. Não utiliza `HttpTestingController`, que substituiria o backend responsável pelo defeito. O teste de progresso instrumenta um `XMLHttpRequest` nativo por `XhrFactory`, emite um evento de progresso na fronteira do transporte e verifica que o backend Angular fornece `UploadProgress` antes da resposta final. Não foi feito envio a serviço remoto nem modificação de comprovante real.

Testes também verificam seleção de backend, header Bearer, logout após 401 e Fetch/autenticação no servidor. Credenciais dos testes são fixtures locais; o token fornecido anteriormente pelo usuário não foi usado.

## Execuções centralizadas em apps/web

- RED: `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/app.config.spec.ts`. Resultado: 3 falhas e 2 sucessos; Fetch substituía XHR no navegador e o upload não emitia os eventos esperados. Log `correcao-upload-http-red.log`.
- GREEN direcionado: mesmo comando. Resultado: 5 sucessos. Log `correcao-upload-http-green.log`.
- Suíte completa: `npm test -- --watch=false --browsers=ChromeHeadless`. Resultado: 395 sucessos. Log `correcao-upload-http-suite.log`.
- Build: `npm run build`, exit 0, incluindo prerenderização de seis rotas. Bundle inicial de 710,30kB; permanece o aviso preexistente do orçamento de 500kB. Log `correcao-upload-http-build.log`.
- O teste dos providers registra aviso NG0505 por executar configuração de hidratação fora de uma resposta SSR serializada. Não houve falha de teste nem de build associada.

Nenhuma alteração em API, componentes de despesas, serviços, migrations ou tokens globais. A última suíte API completa, anterior a esta correção exclusivamente frontend, passou com 306 testes. As duas revisões independentes desta correção foram aprovadas sem bloqueios e preservadas integralmente em `correcao-upload-http-codigo-r1.md` e `correcao-upload-http-conformidade-r1.md`; essa aprovação cobre o item 1 e não remove a dependência de integração manual registrada abaixo.

## Integração da dependência

O autor determinou: “A US04 ainda vou dar merge manual. Não realize nenhum ajuste relacionada a ele”. Não houve mudança na branch, no código, no CI ou no PR #36 da US04; tampouco merge, rebase, mudança de base ou comentário remoto. O bloqueio de integração da dependência permanece sob controle do autor. A conferência final do diff da US05 contra `develop` deve ocorrer após o merge manual.

Alterações externas US15 e auditoria da Issue #9 foram preservadas. Nenhum commit novo foi realizado nesta correção. Os logs locais não integram o commit.
