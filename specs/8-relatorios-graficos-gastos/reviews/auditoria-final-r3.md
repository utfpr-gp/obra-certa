# Auditoria final — US06 (Issue #8), rodada 3

Commit auditado: `df41c48`. Base: `origin/develop` (`71b8e21`).

**Veredito:** NÃO PRONTO

**Limitação da leitura:** a sessão do auditor não tinha shell. Não foram executados `git diff`, build nem testes; a verificação foi por leitura de arquivos, grep e reflog.

## Bloqueios

1. **Pool do perfil `test`: resolvido.** O arquivo efetivo é `apps/api/src/test/resources/application-test.properties`, com `maximum-pool-size=5` e `minimum-idle=0`. Não há outra sobrescrita encontrada. Os dois arquivos têm os mesmos valores.
2. **Suíte completa da API (348) e frontend (441) no HEAD `df41c48`: sem evidência no parecer.** Na época, o auditor não encontrou o log nem o resumo no repositório. Este parecer não considera a execução do orquestrador como prova. Ver `validacao-final-r3.md`, que registra os comandos e os resultados, com os logs locais citados.
3. **Documentação desatualizada.** `specs/README.md:19` citava 41 testes de frontend e 26 unitários da API, e "auditoria final pendente". Atualizado nesta rodada com os números da validação.

## Critérios de aceite (por leitura)

- CA1, CA2, CA4, CA5, CA6, CA8, CA10, CA12: atendidos por leitura do código e dos nomes de teste.
- CA3: atendido na API. PDF não inspecionado.
- CA7 e CA9: superados pela integração, conforme a spec.
- CA11: parcial. Código de composição não lido e PDF não inspecionado.

## Sugestões (não bloqueiam)

1. `reports-demo.data.ts` continua no repositório, com massa fictícia e sem importador. O autor pediu apenas a remoção do TODO; a remoção do arquivo fica a critério do autor.
2. Há dois `application-test.properties`, um em `main` e outro em `test`. O de `main` fica sombreado nos testes. Vale manter um só.
3. O effect de `reports-page.component.ts:39-43` limpa o período ao receber nova emissão de `activeProject`, inclusive edição de nome da mesma obra. Já apontado na r2. Pode virar Issue separada.
4. O fallback de nome do PDF em `reports-page.component.ts:115-116` pode mascarar divergência de nome do servidor.
5. Artefatos na raiz de `apps/web`: `us06-audit-web-full.log` é ignorado pelo Git; `tarefa6-audit.json` está fora do commit.
