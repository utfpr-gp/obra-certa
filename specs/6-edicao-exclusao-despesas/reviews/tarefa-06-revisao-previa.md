# Revisão prévia — Tarefa 6

Base: `301414b622fecc0afb4330d47cc3c77014d213bd`, após conclusão da Tarefa 5. Conferência de escopo antes da implementação, conforme a condição do autor no plano; não substitui os pareceres independentes posteriores.

## Estado conferido

- Spec aprovada; Tarefas 1 a 5 concluídas. Tarefa 6 é a próxima pendente e ainda não tem pareceres de conformidade/código.
- `SecurityConfigurations` exige autenticação nas rotas de despesas, usa sessão stateless e entry point 401. `SecurityFilter` e `TokenService` já recusam JWT inválido ou expirado.
- O teste de autenticação de orçamento oferece precedente para usar JWTs reais e a cadeia de filtros habilitada. A nova matriz deve cobrir PUT de despesa, DELETE de despesa, DELETE de comprovante e PUT multipart de substituição.
- `authInterceptor` chama o `Auth.logout()` real em 401. O logout remove o token, limpa a obra ativa e navega para `/login`; o erro continua sendo entregue ao consumidor.
- Os testes existentes do interceptor usam um substituto de Auth. Ainda falta comprovação integrada do interceptor com logout, navegação e ausência de retomada das mutações da US04.

## Contrato da tarefa

401 deve ocorrer antes de qualquer escrita ou acesso ao storage. O usuário autentica novamente pelo fluxo comum e retorna manualmente à despesa, sem modal inline, intenção pendente, restauração de rascunho ou reenvio automático. Navegação comum de sucesso do login não equivale a retornar automaticamente à despesa e deve ser preservada.

## Provas e limites

- Testar credenciais ausentes, inválidas e expiradas para cada mutação, preservando registros e arquivos; JWT válido continua permitindo a operação própria.
- Testes backend mantêm filtros reais, sem substituir UserContextHelper/TokenService por autorização fictícia. Somente o storage externo pode ser substituído. Preparar dados confirmados antes das requisições: mutações usam limites transacionais independentes.
- Testes Angular usam interceptor e serviço Auth reais. Verificar remoção do token e obra ativa, ida ao login e ausência de retorno/reenvio à despesa depois da autenticação comum.
- Nenhuma migration, fila ou nova política de autenticação. Os arquivos principais previstos são `ExpenseMutationAuthenticationIntegrationTest.java` e `expense-mutation-auth.spec.ts`; produção somente se os testes revelarem lacuna, restrita aos handlers das novas mutações.
- Esta é uma tarefa de comprovação integrada. Como o comportamento global já existe, testes de caracterização podem passar na primeira execução. Não alterar produção nem introduzir falha artificial para forçar RED; qualquer mudança funcional necessária deve ser precedida por teste que demonstre a lacuna.
- A sugestão sobre consulta manual com GET 404 após resposta de DELETE perdida permanece para a Tarefa 7; não misturar recuperação de resultado incerto com autenticação.

Próximo passo: apresentar a explicação do tutor e obter o aceite antes do despacho do implementador.
