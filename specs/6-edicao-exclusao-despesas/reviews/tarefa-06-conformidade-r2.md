# Parecer de Conformidade — Tarefa 6, rodada 2

**Veredito:** APROVADO

## Critérios verificados

| Critério | Situação |
| --- | --- |
| API retorna 401 para sessão ausente, inválida ou expirada nas quatro mutações | atendido |
| 401 ocorre antes de alterar dados ou acessar storage | atendido |
| Token válido mantém as quatro operações autorizadas | atendido |
| 401 encerra a sessão, limpa o contexto e redireciona ao login | atendido |
| Não há reenvio automático nem preservação da intenção após novo login | atendido |
| Testes previstos executados com sucesso | atendido |

## Evidências

- Backend: 16 testes, BUILD SUCCESS.
- Angular: 6 testes SUCCESS.
- O apontamento aceito da rodada 1, relativo à ausência de execução verificável dos testes, foi resolvido.

## Apontamentos bloqueantes

Nenhum.

## Sugestões

1. O teste Angular simula a autenticação posterior salvando um novo token, em vez de executar o fluxo completo de login. Isso não viola o CA8, pois comprova a ausência de retorno ou reenvio automático.
