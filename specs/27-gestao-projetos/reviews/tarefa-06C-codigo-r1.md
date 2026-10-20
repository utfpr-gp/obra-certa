# Parecer de Código — Tarefa 6C — Rodada 1

## Veredito

Apontamentos bloqueadores.

## Apontamentos

1. **[Alta]** `Auth` e `AuthenticatedIdentityService` duplicam e divergem na validação/decodificação JWT; identidade expirada ou malformada pode continuar sendo usada para a chave de `localStorage`.
2. **[Média]** A validação local aceita algoritmo arbitrário e não rejeita explicitamente tokens incompatíveis antes do guard liberar a rota.
3. **[Média]** A Navbar captura o identificador do usuário uma única vez no construtor, podendo operar com a identidade da sessão anterior após troca/renovação de sessão.

## Sugestões

- Centralizar parsing/validação do payload.
- Cobrir `alg: none`, assinatura inválida, identidade expirada e troca de usuário sem recriar o componente.
- Manter dashboard vazio enquanto não houver endpoints financeiros.

