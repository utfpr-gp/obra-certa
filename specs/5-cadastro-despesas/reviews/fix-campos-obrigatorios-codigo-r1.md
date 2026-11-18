# Complemento de Código — Campos obrigatórios

**Veredito: APROVADO**

**Apontamentos bloqueantes:** nenhum.

Os dez asteriscos `text-rose-600` correspondem aos campos com `Validators.required`, incluindo fornecedor, valores e vencimento nos respectivos ramos condicionais. Cada controle recebe `aria-required="true"`; os asteriscos usam `aria-hidden="true"`.

Modo de valor e pagamento preservam suas opções predefinidas, sem alternativa vazia. Comprovante permanece explicitamente opcional. Não foram alterados lógica, eventos, mensagens ou seletores de teste.

Compatível com Reactive Forms, conforme `docs/architecture.md`, seção 5.1. Validação informada pelo agente principal: 57 testes aprovados e build concluído; não repetidos nesta revisão.

**Sugestões:** nenhuma. **Observações fora do escopo:** nenhuma. Parecer anterior preservado.
