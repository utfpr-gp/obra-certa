# Parecer de Código — Tarefa 2

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Conversão Entity → DTO está na camada Service, em vez de utilizar a camada `mapper/` prevista pela arquitetura** — `apps/api/src/main/java/com/obracerta/service/ProjectService.java:72-80`  
   **Regra violada:** `docs/architecture.md`, seção 5.2: “Entidades JPA nunca atravessam a camada de Controller. A conversão é feita na camada `mapper/` de forma explícita e tipada.”  
   **Prejuízo concreto:** a lógica de mapeamento fica acoplada ao serviço de negócio. À medida que os endpoints de edição, exclusão e relatórios forem adicionados, a conversão tende a ser duplicada ou crescer dentro do `ProjectService`, dificultando manutenção e testes isolados.

2. **Resposta 404 de `ResourceNotFoundException` não utiliza o formato de erro padronizado da API** — `apps/api/src/main/java/com/obracerta/controller/ProjectController.java:34-40`  
   **Regra violada:** `docs/architecture.md`, seção 5.2: todas as falhas devem retornar payload estruturado por `@RestControllerAdvice`, incluindo timestamp, status, erro, mensagem e path.  
   **Prejuízo concreto:** o endpoint retorna 404 com corpo vazio. Isso não segue o contrato global de erros e cria comportamento diferente dos demais endpoints quando o tratamento centralizado for aplicado. O corpo vazio não vaza a existência da obra, mas também não respeita o formato de erro acordado.

## Verificações positivas

- O repositório aplica isolamento por usuário e exclusão lógica nas duas consultas:
  - `findByUserIdAndDeletedAtIsNull`
  - `findByIdAndUserIdAndDeletedAtIsNull`
- A criação usa o usuário autenticado obtido do `SecurityContextHolder`; não há `userId` no `ProjectCreateDTO`.
- O status inicial é definido no serviço como `IN_PROGRESS`, sem ser aceito como entrada no cadastro.
- Os DTOs são Java Records imutáveis.
- O `POST` retorna `201 Created`, corpo DTO e header `Location`.
- O acesso a obra de outro usuário resulta em `ResourceNotFoundException`, convertido em 404 sem detalhes da entidade.
- Os enums utilizados são compatíveis com a entidade `Project` da Tarefa 1.

## Sugestões (não bloqueiam)

- Expandir `ProjectControllerTest` para verificar explicitamente:
  - `POST /api/projects` com status `201`;
  - header `Location`;
  - corpo retornado;
  - ausência de `userId` na resposta;
  - delegação do usuário autenticado ao fluxo de criação.
- Adicionar teste para obra excluída (`deletedAt != null`), garantindo que ela não seja retornada no detalhe nem na listagem.
- Adicionar teste para autenticação ausente ou principal não reconhecido, verificando o comportamento esperado sem transformar falhas de autenticação em respostas inconsistentes.
- Considerar extrair `ResourceNotFoundException` para a hierarquia de exceções da aplicação, em vez de mantê-la como classe interna de `ProjectService`.
- Validar se o projeto utiliza `UUID` efetivamente no contrato Java. O código atual mantém `String` para IDs, aparentemente compatível com as entidades existentes, mas diverge da descrição arquitetural que menciona UUID.

## Observações fora do escopo deste diff

- A implementação de atualização, exclusão lógica e `ProjectUpdateDTO` pertence às tarefas posteriores e não foi avaliada como requisito da Tarefa 2.
- O `@RestControllerAdvice` padronizado descrito na arquitetura não foi localizado no caminho consultado; caso ainda não exista no restante do backend, isso deve ser tratado como uma pendência transversal de manutenção.
- Não foi possível executar literalmente `git diff c94182a536e4965a62af702d82fd15c9c2a0ad57` nem o teste `.\mvnw.cmd -f apps/api/pom.xml -Dtest=ProjectServiceTest,ProjectControllerTest test`, pois o ambiente disponibilizado nesta revisão não expôs uma ferramenta de terminal/Bash executável. Portanto, não há confirmação de compilação, resultado dos testes ou validação do delta exato em relação ao commit informado. A análise foi feita somente por leitura dos arquivos presentes no worktree.
