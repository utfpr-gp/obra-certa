# Parecer de Código — Tarefa 6A — Rodada 1

## Veredito

Apontamentos bloqueadores.

## Apontamentos

1. **[Alta]** A Home mistura `ActiveProjectService` com `ObraMockService.activeObra`, podendo apresentar dados de obras diferentes no mesmo dashboard. A fonte global precisa ser única ou a associação por ID precisa ser explícita.
2. **[Média]** Navbar e modal duplicam a extração do usuário do JWT e usam o fallback global `current-user` quando o token é inválido ou não possui identificador. Isso pode compartilhar a chave de `localStorage` entre sessões e viola a persistência por usuário confiável.

## Sugestões não bloqueadoras

- Testar uma instância compartilhada real entre Home e Navbar.
- Cobrir uma segunda falha no retry.
- Avaliar limpeza do projeto ativo no logout.

