# Revisão prévia — Tarefa 4

Base: `bf84b5d8f79195d2dbd1e55ffd0800fdf888405e`, após conclusão da Tarefa 3. Conferência de escopo antes da implementação, conforme condição do autor no plano; não substitui as revisões independentes posteriores.

## Estado conferido

- Spec aprovada; Tarefas 1, 2 e 3 concluídas; Tarefa 4 é a próxima pendente. Nenhum parecer de conformidade/código da Tarefa 4 existe neste momento.
- `ExpenseReceiptService.upload` ainda recusa comprovante UPLOADED e utiliza chave determinística por despesa. A substituição precisa de chave diferente para não sobrescrever o atual antes da confirmação.
- A consulta Angular não permite selecionar/enviar arquivo quando há comprovante confirmado. Seleção, progresso e download existentes serão estendidos.
- A exclusão física do storage já existe e foi validada na Tarefa 3. A remoção isolada continuará com exclusão direta e tentativa manual, conforme CA4 simplificado.
- Última migration: V10. A Tarefa 4 não precisa de migration.
- Nenhuma implementação da Tarefa 4 foi iniciada.

## Escopo e dependências

Após a apresentação inicial, o autor determinou remover da Tarefa 4 todo o conteúdo de recuperação de arquivos trazido da Tarefa 3 e não implementar esse mecanismo. Esta revisão prévia foi atualizada para o escopo resultante: envio com chave nova, confirmação da associação, tentativa imediata de apagar o antigo e aviso de falha. Não transferir recuperação para a Tarefa 5; preservar a regra de que falha do storage não desfaz exclusão financeira. Não implementar exclusão de despesas na Tarefa 4.

Arquivos previstos: serviço de comprovantes e colaborador de persistência somente se necessário para delimitar commit, DTO/mapper do resultado imediato, testes de substituição e upload existentes, serviço/modelo Angular e consulta individual. Sem tabela de trabalhos, entidade/repositório/processador de limpeza, migration, agendamento ou configuração de intervalo.

## Pontos que os testes devem esclarecer

- Novo envio inválido ou falho preserva arquivo e metadados atuais.
- Envio confirmado e associação persistida precedem a exclusão da chave antiga; rollback não apaga o antigo.
- Falha ao apagar o antigo mantém o novo disponível e informa o erro, sem oferecer o antigo nem prometer nova tentativa automática.
- Falha na associação preserva o antigo e provoca uma tentativa imediata de apagar o novo sem vínculo. Falha dessa tentativa deve ser informada, sem registro de trabalho posterior.
- Uma sequência de substituições apaga somente a chave antiga correspondente, preservando o comprovante atual.
- `receiptDeletionFailed` informa apenas falha na tentativa feita pela requisição, sem persistir acompanhamento de limpeza nem expor chaves privadas.
- Regressão mantém a remoção isolada simples da Tarefa 3 e os demais contratos da US03.

Implementação ainda não iniciada. Próximo passo: apresentar a explicação antes do código e obter o aceite do autor, conforme utf-task.
