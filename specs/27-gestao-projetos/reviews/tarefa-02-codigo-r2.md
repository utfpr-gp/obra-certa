# Parecer de Código — Tarefa 2

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum bloqueio de arquitetura identificado nos arquivos analisados.

- O fluxo backend respeita `Controller ➔ Service ➔ Repository ➔ Entity`.
- `ProjectController` não injeta repository e permanece responsável apenas por receber, validar, delegar e definir o status HTTP.
- O isolamento Anti-IDOR é aplicado no repository por meio de `findByIdAndUserIdAndDeletedAtIsNull(...)`.
- O service usa o usuário autenticado do `SecurityContextHolder` e não confia em um `userId` fornecido pelo cliente.
- Tentativas de acesso a obra alheia resultam em `ResourceNotFoundException`, evitando revelar a existência do recurso.
- A conversão Entity/DTO está isolada no `ProjectMapper`, sem entidade JPA atravessando o controller.
- O cadastro retorna `201 Created` e header `Location`.
- O payload de erro de recurso inexistente contém `timestamp`, `status`, `error`, `message`, `path` e `fieldErrors`, sem incluir os dados privados da obra.
- Não foram identificados segredos, URLs de ambiente ou tratamento silencioso de falhas.

## Sugestões (não bloqueiam)

- `ProjectControllerTest` usa `@AutoConfigureMockMvc(addFilters = false)`. O teste valida corretamente o contrato HTTP do `404`, mas não comprova a cadeia completa com autenticação JWT e `SecurityFilter`. Um teste de integração adicional poderia verificar que o usuário B recebe `404` ao consultar uma obra do usuário A.
- `ProjectServiceTest` chama diretamente `projectRepository.findById("project-2")` apenas para demonstrar que a obra existe, embora esse método não faça parte do fluxo real. O teste ficaria mais resiliente se configurasse apenas o repository filtrado por usuário e verificasse que o service nunca utiliza uma busca sem filtro de posse.
- O tratamento de erros de validação `@Valid` ainda não aparece no `GlobalExceptionHandler`. Isso está previsto para a Tarefa 3 e não bloqueia a Tarefa 2, mas deve garantir posteriormente o mesmo formato `ApiErrorResponse`.
- Seria recomendável adicionar teste para obra excluída logicamente, garantindo que o filtro `deleted_at IS NULL` também produz `404` no detalhe.

## Observações fora do escopo deste diff

- O backend atual utiliza `String` para IDs e `LocalDateTime` para timestamps, enquanto `docs/architecture.md` descreve UUIDs e `timestamptz`. A ocorrência também existe em entidades e migrations anteriores; portanto, não a classifiquei como bloqueio desta rodada sem confirmação de que esses arquivos fazem parte do diff da Tarefa 2.
- Não foi possível executar o comando solicitado exatamente — `.\mvnw.cmd -f apps/api/pom.xml -Dtest=ProjectServiceTest,ProjectControllerTest test` — porque esta sessão não disponibilizou uma ferramenta de Bash/execução de comandos. Consequentemente, não há resultado de testes para registrar; a conclusão acima é baseada na leitura estática dos arquivos disponíveis.
- Nenhum arquivo foi alterado.
