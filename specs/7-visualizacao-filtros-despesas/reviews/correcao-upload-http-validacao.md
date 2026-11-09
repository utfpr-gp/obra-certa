# Validação — correção do transporte HTTP para uploads

Correção do item 1 aceito em `auditoria-final-decisoes-r1.md`, sem alterar a spec aprovada. A configuração global da US05 havia selecionado Fetch, incompatível com os eventos de progresso usados no cadastro e nos detalhes de despesas.

## Entrega

- `apps/web/src/app/app.config.ts`: mantém `provideHttpClient(withInterceptors([authInterceptor]))` sem habilitar Fetch no navegador. No Angular instalado 21.2.11, esse arranjo seleciona `HttpXhrBackend`.
- `apps/web/src/app/app.config.server.ts`: previsto no registro original, para habilitar Fetch apenas no SSR. Esse arquivo não existe na branch: o SSR foi removido pelo commit `0cf5dfa` (`chore: remover SSR do frontend`), integrado por `fcc3375`. Não há configuração de servidor a manter.
- `apps/web/src/app/app.config.spec.ts`: três testes (`it`) com os providers reais da aplicação, agrupados em `describe('Application HTTP transport')`. Não utiliza `HttpTestingController`, que substituiria o backend responsável pelo defeito. O teste de progresso instrumenta um `XMLHttpRequest` nativo por `XhrFactory`, emite um evento de progresso na fronteira do transporte e verifica que o backend Angular fornece `UploadProgress` antes da resposta final. Não foi feito envio a serviço remoto nem modificação de comprovante real.

Testes também verificam seleção de backend XHR, header Bearer e logout após 401. Credenciais dos testes são fixtures locais; o token fornecido anteriormente pelo usuário não foi usado.

## Execuções centralizadas em apps/web

- RED: `npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/app.config.spec.ts`. Resultado: 3 falhas e 2 sucessos; Fetch substituía XHR no navegador e o upload não emitia os eventos esperados. Log `correcao-upload-http-red.log`.
- GREEN direcionado: mesmo comando. Resultado: 3 sucessos. Log `correcao-upload-http-green.log`.
- Suíte completa, na época da correção: `npm test -- --watch=false --browsers=ChromeHeadless`. Resultado: 395 sucessos. Log `correcao-upload-http-suite.log`.
- Build, na época da correção: `npm run build`, exit 0, incluindo prerenderização de seis rotas. Bundle inicial de 710,30kB; permanece o aviso preexistente do orçamento de 500kB. Log `correcao-upload-http-build.log`. A prerenderização deixou de existir com a remoção do SSR.
- Reconferência na auditoria final r2, sobre a branch atual (`fcc3375`): suíte web com 396 sucessos de 396, e suíte API com 316 sucessos, executada contra PostgreSQL 16 com perfil `test`, como na CI. Os números acima são históricos e permanecem como registro.
- O teste dos providers registra aviso NG0505 por executar configuração de hidratação fora de uma resposta SSR serializada. Não houve falha de teste nem de build associada.

Nenhuma alteração em API, componentes de despesas, serviços, migrations ou tokens globais. A última suíte API completa, anterior a esta correção exclusivamente frontend, passou com 306 testes. As duas revisões independentes desta correção foram aprovadas sem bloqueios e preservadas integralmente em `correcao-upload-http-codigo-r1.md` e `correcao-upload-http-conformidade-r1.md`; essa aprovação cobre o item 1 e não remove a dependência de integração manual registrada abaixo.

## Integração da dependência

O autor determinou: “A US04 ainda vou dar merge manual. Não realize nenhum ajuste relacionada a ele”. Não houve mudança na branch, no código, no CI ou no PR #36 da US04; tampouco merge, rebase, mudança de base ou comentário remoto. O bloqueio de integração da dependência permanece sob controle do autor. A conferência final do diff da US05 contra `develop` deve ocorrer após o merge manual.

Nota de reconferência (auditoria r3): o merge manual foi feito. O PR #36 da US04 está em `develop` (`c34af74`), e a branch da US05 contém essa referência (`fcc3375`). Confirmado por `git merge-base --is-ancestor origin/develop HEAD`; o diff contra `develop` não traz arquivos da US04. Este parágrafo registra o estado anterior ao merge.

Alterações externas US15 e auditoria da Issue #9 foram preservadas. Nenhum commit novo foi realizado nesta correção. Os logs locais não integram o commit.
