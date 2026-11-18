# Parecer de Código — Tarefa 2A

**Veredito:** APROVADO

## Apontamentos

Nenhum bloqueio identificado.

As correções da rodada 1 foram verificadas:

- filtros Spring Security ativos;
- autenticação por `POST /api/auth/login` com credenciais persistidas e JWT real;
- fluxo Controller → Service → Repository real, sem mocks;
- consulta filtrada por usuário e `deletedAt IS NULL`;
- comparação de user, name, type, location, status, createdAt, updatedAt e deletedAt;
- `@DataJpaTest` com PostgreSQL real;
- payload 404 equivalente ao de ID inexistente;
- ausência de endpoints PUT/DELETE nesta tarefa;
- controller sem acesso direto ao repository;
- mapper explícito sem entidade na fronteira HTTP.

A suíte passou com 6 testes, 0 falhas e 0 erros; a mutação removendo o filtro falhou com 200 em vez de 404; o código foi restaurado.

## Sugestões

- Validar explicitamente o formato JWT no helper de autenticação.
- Documentar a separação entre o teste HTTP isolado e o teste integrado de segurança.

## Observações

Nenhuma observação de manutenção relevante para a rodada 2.
