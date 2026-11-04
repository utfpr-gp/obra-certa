# Validação — Tarefa 7, rodada 2

O usuário autorizou o ajuste da fixture de `ProjectLifecycleTest`: “Ajuste esse teste”. Um novo implementador alterou somente o INSERT de `pending_payments`, acrescentando `status = 'PENDING'`; nenhuma asserção, produção, migration ou configuração versionada foi alterada.

## Resultado

Em 01/11/2026, a suíte completa da API concluiu com **287 testes, zero falhas, zero erros e zero ignorados — BUILD SUCCESS**, exit 0, em 54,711 segundos. Os dois testes de `ProjectLifecycleTest` passaram. Log local: `apps/api/target/us04-t7-full-backend-r2-root.log`.

Comando em `apps/api`: `.\mvnw.cmd '-Dspring.test.context.cache.maxSize=4' '-Djava.external.resources=target/validation' test`, perfil `test`, PostgreSQL exclusivo `obracerta_us04_t3_test`, `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=4` e `SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=0`. Pool e cache foram ajustados somente para a execução, evitando saturação de conexões e permitindo os testes com conexões aninhadas de migration.

As evidências anteriores permanecem registradas, sem reescrita: Angular completo com 344 sucessos e build concluído, com aviso de bundle de 642,57 kB para orçamento de 500 kB. Não houve alteração frontend após essas execuções. Não foi necessário repeti-las para uma mudança exclusiva na fixture Java.

Os pareceres e a validação R1 preservam os resultados daquele momento. Esta execução resolve a limitação global registrada anteriormente. Ainda não foi feito commit nem marcada a tarefa como concluída.
