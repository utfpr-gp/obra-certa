# Parecer de Código — Máscara monetária da US07

**Veredito:** APROVADO

## Apontamentos (bloqueiam)

Nenhum.

O diff preserva os padrões do `docs/architecture.md`, §5.1: formulário reativo tipado, comunicação HTTP pelo serviço existente e apresentação no componente responsável pelo campo.

A máscara separa o texto exibido do valor numérico do formulário. `Intl.NumberFormat` apresenta BRL; o handler interpreta os dígitos como centavos e mantém o DTO em reais. Valores carregados para edição são formatados diretamente, sem nova divisão por cem.

A implementação não acrescenta biblioteca, abstração compartilhada ou estado textual duplicado. Trata campo vazio, marcação de edição e toque, colagem e reposicionamento do cursor. As validações e proteções de contexto, envio repetido e tratamento de erro permanecem preservadas.

Os testes verificam os três exemplos solicitados, valor enviado à API, edição de orçamento existente, exclusão, substituição e preservação após conflito. As adaptações dos testes da página mantêm os montantes originais em reais.

**Validação executada nesta revisão:** `npm.cmd run build`, em `apps/web`, concluído com sucesso. Permanece o aviso de bundle inicial de **571,96 kB**, acima do orçamento de 500 kB. A suíte de **189 testes aprovados**, executada pelo orquestrador, não foi duplicada nesta revisão.

## Sugestões (não bloqueiam)

Nenhuma.

## Observações fora do escopo deste diff

- Os ajustes anteriores de navbar e indicadores permanecem separados desta revisão.
- O limite de tamanho do bundle já era excedido antes da máscara; sua redução demanda trabalho separado.
