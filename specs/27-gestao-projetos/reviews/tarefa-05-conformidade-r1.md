# Parecer de Conformidade — Tarefa 5, rodada 1

**Veredito:** APROVADO

## Critérios verificados

- CA2 atendido com cliente HTTP tipado.
- Modelos TypeScript de obra e DTOs criados.
- Signal global para obra ativa.
- Persistência por usuário no `localStorage`.
- Reconciliação de cache inválido com primeira obra válida.
- Testes HTTP e de estado executados com sucesso.
- Navbar permanece fora do escopo e prevista para a Tarefa 6.

## Execução

`npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/services/project.service.spec.ts' --include='src/app/core/services/active-project.service.spec.ts'`

Resultado: 4 testes, 0 falhas, 0 erros.

## Observação

O projeto usa Karma/Jasmine, embora o plano mencione Vitest; não há Vitest configurado no `package.json`.
