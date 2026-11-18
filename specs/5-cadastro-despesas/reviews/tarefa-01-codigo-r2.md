# Parecer de Código — Tarefa 1

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum. O diff respeita os padrões arquiteturais aplicáveis ao escopo da tarefa 1.

A correção da rodada 1 foi confirmada: `ExpenseService.java:79` lança `ExpenseValidationException`, tratada em `GlobalExceptionHandler.java:17` com status `400` e corpo `ApiErrorResponse`, conforme §5.2.3 da arquitetura. Os testes de contrato verificam os campos padronizados para cinco cenários inválidos.

A navegação solicitada está em `accounts-page.component.ts:12`: botão “Cadastrar conta” em `/contas`, direcionando a `/despesas/nova`, sob o layout protegido. O menu não oferece cadastro separado.

## Sugestões (não bloqueiam)

Nenhuma nova nesta rodada.

## Observações fora do escopo deste diff

- Permanece o aviso preexistente do Maven sobre o escopo `annotationProcessor` do Lombok.
- O build apresenta aviso de bundle inicial: **589,58 kB**, acima do orçamento de **500 kB**. A ultrapassagem já constava na rodada anterior.

## Validação executada

- Diff integral: `git diff a759ee390202c63dff785ccfaa6db0f7eae370a2`, incluindo mudanças staged, sem `..HEAD`.
- Em `apps/api`, com perfil e variáveis de teste indicados: `.\mvnw.cmd '-Dtest=ExpenseValidationContractTest,ExpenseServiceTest' test` — **14 testes, zero falhas, zero erros; BUILD SUCCESS**. Essas classes usam mocks e não exercitam PostgreSQL.
- Em `apps/web`: `npm.cmd run build` — **aprovado**, código de saída `0`, com o aviso de bundle registrado acima.
- Karma e testes de persistência não foram executados nesta revisão, conforme divisão do despacho.
- Nenhum arquivo fonte, artefato de revisão ou estado do Git foi alterado.
