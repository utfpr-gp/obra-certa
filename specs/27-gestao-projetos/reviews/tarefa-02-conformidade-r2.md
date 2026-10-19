# Parecer de Conformidade — Tarefa 2

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Cadastro vinculado exclusivamente ao usuário autenticado, com nome, tipo e localização opcional | atendido na implementação e no teste de criação | `ProjectService.java:37-47`; `ProjectCreateDTO.java:8-11`; `ProjectServiceTest.java:38-59` |
| CA7 — Acesso a obra alheia deve retornar HTTP 404 sem expor a existência ou detalhes | parcialmente comprovado | `ProjectService.java:51-55`; `ProjectRepository.java:10-12`; `ProjectControllerTest.java:23-40` |
| Teste deve configurar uma obra existente pertencente a outro usuário | parcialmente atendido | `ProjectServiceTest.java:64-74` |
| Conversão Entity → DTO por mapper explícito | atendido | `ProjectMapper.java:8-20`; uso em `ProjectService.java:41,48,53` |
| 404 com payload estruturado e sem dados da obra | atendido na implementação e no teste de controller | `GlobalExceptionHandler.java:15-26`; `ProjectControllerTest.java:29-40` |
| Arquivos adicionais diretamente necessários | atendido | `ProjectMapper.java`, `ResourceNotFoundException.java`, `GlobalExceptionHandler.java`, `ApiErrorResponse.java` |

## Apontamentos

1. **O teste de Anti-IDOR ainda não comprova o fluxo exigido de uma obra existente de outro usuário até o 404** — `apps/api/src/test/java/com/obracerta/service/ProjectServiceTest.java:64-74` e `apps/api/src/test/java/com/obracerta/controller/ProjectControllerTest.java:23-40`  
   Critério violado: CA7 — “tentativa de acesso a obra alheia [...] retorna HTTP 404 (Not Found) sem expor a existência do registro”; o plano da Tarefa 2 exige comprovar que “consultar uma obra existente pertencente a outro usuário retorna HTTP 404 [...] sem expor detalhes”.  
   Evidência: o teste de serviço cria uma `Project` pertencente a `otherUser`, mas a coloca apenas no retorno de `projectRepository.findById("project-2")`, método que `ProjectService.findById` não utiliza. O método efetivamente exercitado recebe `Optional.empty()` de `findByIdAndUserIdAndDeletedAtIsNull(...)`. Portanto, a obra alheia criada não participa do fluxo que produz a exceção. O teste de controller, por sua vez, apenas configura o `ProjectService` mockado para lançar `ResourceNotFoundException`; ele comprova o formato do erro, mas não a existência de uma obra alheia nem o isolamento aplicado pela consulta real.

## Limitações de execução

- Não foi possível executar literalmente `git diff c94182a536e4965a62af702d82fd15c9c2a0ad57` neste ambiente, pois não há ferramenta de shell/Bash disponível nesta sessão.
- Também não foi possível executar `.\mvnw.cmd -f apps/api/pom.xml -Dtest=ProjectServiceTest,ProjectControllerTest test`.
- Assim, não há confirmação de compilação nem do resultado da suíte direcionada; a análise foi feita por leitura dos arquivos presentes no workspace.
