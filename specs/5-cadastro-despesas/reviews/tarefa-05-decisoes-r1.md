# Decisões — Tarefa 5, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Teste do adaptador acessa campo privado por reflexão | código | aceito | Autor respondeu “Sim, corrigir o teste” em 2026-10-28. |

O bloqueio de execução dos testes de conformidade foi sanado sem alteração de fontes, conforme `tarefa-05-conformidade-r1-adendo.md`; o veredito de conformidade da rodada é APROVADO.

A sugestão não bloqueante de preservar diagnóstico de exceções não foi promovida a correção pelo autor.

## Mudança de provedor autorizada

Em 2026-10-28, o autor escolheu Supabase Storage para desenvolvimento e produção. A tarefa 5 mantém o contrato S3 e o acesso privado pela API da aplicação, remove o MinIO da configuração e documenta buckets e credenciais separados por ambiente. O autor já criou um projeto e informará URL e região; segredos serão configurados localmente. A V9 aplicada permanece imutável. Esta decisão não reinicia o contador de revisão: a próxima é a rodada 2.

Posteriormente, o autor determinou: “Defina de forma que os dados para o supabase fiquem no .env e eu coloque eles manualmente lá”. Assim, endpoint, região, bucket e credenciais serão preenchidos manualmente no `.env` da raiz e usados pela API nativa e pelo Docker, sem solicitar segredos pelo chat.

## Interrupção de TDD e autorização de retomada

Na implementação da rodada 2, o teste do adaptador falhou em duas execuções pela ausência do construtor de injeção exigido pelo novo teste. A primeira execução também encontrou um erro de sintaxe no próprio teste, corrigido antes da segunda. O implementador interrompeu o trabalho e não alterou produção nem configuração.

Após o relato do limite e o pedido explícito de retomada, o autor autorizou: “Pode realizar as mudanças para comportar o supabase e remover o miniIO”. A retomada implementará o construtor esperado e concluirá a configuração aprovada. Preserva-se este histórico e a rodada 2 de revisão; não há reinício silencioso de contadores.
