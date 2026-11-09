# Parecer de Código — Tarefa 5

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum.

A implementação respeita a arquitetura:

- Ordenação encapsulada em `ExpenseSort` e refletida no contrato TypeScript.
- Service converte o enum em `Sort` e cria `PageRequest` com ordenação antes da paginação.
- Desempate determinístico por `id`.
- Validação de valores desconhecidos, vazios e repetidos com erro padronizado.
- Controller permanece magro e delega ao service.
- Componente usa `inject()`, signals e `@for`/`@if`, sem acesso direto ao `HttpClient`.
- Alteração de ordenação preserva filtros/aba e reseta a página.
- Contratos HTTP/TypeScript estão alinhados.
- Testes cobrem ordenação, desempates, paginação, validação, preservação de contexto e reset.

## Sugestões (não bloqueiam)

- Adicionar um teste específico comprovando que a ordenação por valor trata valores iguais distribuídos exatamente na fronteira entre páginas.
- Preferir um DTO de parâmetros explicitamente tipado no controller em uma evolução futura; a conversão atual via `MultiValueMap` está concentrada no service e não viola a separação de camadas.

## Observações fora do escopo deste diff

- A invalidação completa de respostas antigas depende das Tarefas 7/8 e não foi considerada como reprovação.

## Resultados

Não foi possível executar os comandos Maven/Angular nem `git diff`, pois esta sessão não disponibiliza shell/Bash. O parecer foi baseado nos arquivos implementados e nos testes presentes no repositório.
