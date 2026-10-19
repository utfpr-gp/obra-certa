# Parecer de Conformidade — Tarefa 2

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Cadastro de nova obra vinculada exclusivamente ao usuário autenticado, com nome, tipo e localização opcional | atendido | `ProjectService.java:35-45`; `ProjectCreateDTO.java:8-11`; `ProjectController.java:28-32` |
| CA7 — Consulta de obra alheia deve retornar HTTP 404 sem expor existência ou detalhes | atendido na implementação, mas sem comprovação executada | `ProjectService.java:47-51`; `ProjectRepository.java`; `ProjectController.java:34-40` |
| Teste de criação vinculada ao usuário autenticado e persistida | atendido no teste unitário | `ProjectServiceTest.java:38-59` |
| Teste de consulta de obra alheia retornando HTTP 404 | não atendido como evidência suficiente | `ProjectControllerTest.java:25-32`; `ProjectServiceTest.java:61-72` |

## Apontamentos

1. **Os testes de Anti-IDOR não comprovam integralmente o cenário exigido pela tarefa** — `apps/api/src/main/java/com/obracerta/controller/ProjectControllerTest.java:25-32` e `apps/api/src/main/java/com/obracerta/service/ProjectServiceTest.java:61-72`  
   Critério violado: CA7 — “tentativa de acesso a obra alheia [...] retorna HTTP 404 (Not Found) sem expor a existência do registro”; o plano também exige teste provando que a consulta de uma obra existente pertencente a outro usuário retorna HTTP 404.  
   Evidência: o teste de controller configura o `ProjectService` mockado para lançar `ResourceNotFoundException`, portanto valida apenas o mapeamento artificial da exceção para 404. O teste de serviço configura o repositório para retornar `Optional.empty()` e não simula uma obra existente pertencente a outro usuário. Assim, a suíte não demonstra ponta a ponta que uma obra alheia existente é filtrada pelo usuário autenticado e resulta em 404.

## Limitações de execução

- Não foi possível executar o diff solicitado (`git diff c94182a536e4965a62af702d82fd15c9c2a0ad57`) porque o ambiente disponibilizado nesta sessão não expõe uma ferramenta de shell/Bash.
- Também não foi possível executar `.\mvnw.cmd -f apps/api/pom.xml -Dtest=ProjectServiceTest,ProjectControllerTest test`.
- Portanto, não há confirmação de compilação ou aprovação dos testes direcionados; a análise acima foi feita somente sobre os arquivos presentes no workspace.
