# Revisão prévia — Tarefa 7

Base: `1dd2daa3376452a9eb1178c82917e841ee6401c7`, após conclusão da Tarefa 6. Conferência de escopo antes do código, conforme condição do autor; não substitui os dois pareceres independentes posteriores.

## Estado conferido

- Spec aprovada; Tarefas 1 a 6 concluídas. Tarefa 7 é a última pendente, sem pareceres de conformidade/código neste momento.
- Consulta e modal de edição já usam versão do contexto da obra para ignorar respostas após troca. A versão muda nas transições de identificador, inclusive A → B → A; atualização de metadados da mesma obra não deve abandonar o formulário.
- Os testes existentes já cobrem parte da confirmação/cancelamento da exclusão, duplo envio e sucesso tardio após troca nas operações de comprovante e exclusão. A edição tem validações e tratamento de falha, mas a matriz cruzada de contexto e abandono ainda precisa ser consolidada.
- O formulário de edição guarda os campos em memória; não existe recuperação persistente de rascunho após fechar ou autenticar novamente, conforme a spec.
- As suítes backend existentes já provam parte do isolamento, limites monetários, datas e preservação financeira. Devem ser complementadas onde faltar cenário, sem repetir testes equivalentes por rotina.

## Lacuna concreta a provar antes de corrigir

O parecer de código da Tarefa 5 indicou DELETE concluído com resposta perdida → consulta manual → GET 404. `checkCurrentState()` usa `loadExpense()`, cujo handler de erro atual mantém `expense()` anterior. O card e suas ações podem continuar apresentados mesmo após a consulta indicar indisponibilidade. A Tarefa 7 deve testar a retirada dos dados ativos nesse caso, sem tratar qualquer 404 como prova automática de exclusão.

## Escopo e provas previstas

- Cancelar, X e Escape antes do envio não gravam; backdrop inerte; envio repetido durante requisição não produz nova mutação.
- Erro de rede/servidor conserva os campos enquanto modal e obra forem os mesmos; permite consultar estado sem anunciar sucesso ou repetir automaticamente a mutação.
- Ausência de obra orienta seleção e não inicia mutação. Atualização da mesma obra preserva contexto; troca real abandona o anterior. Sucessos e erros tardios não se aplicam após troca, inclusive A → B → A.
- Consolidar respostas 404 para despesa/obra alheia, inexistente ou excluída nas mutações; nenhum storage antes da autorização. Completar limites numéricos, vencimento e ausência de gravação parcial quando necessário.
- Manter contratos simplificados: remoção isolada apaga arquivo antes da retirada do vínculo e permite tentativa manual; substituição e exclusão financeira confirmam o banco antes de tentar apagar a chave antiga. Não reintroduzir fila, agendamento ou garantia de recuperação futura.
- Nenhuma migration ou listagem da US05. Arquivos previstos: testes de edição/exclusão/comprovantes, novo `expense-mutation-context.spec.ts`, componentes/serviços Angular desses fluxos e suítes integradas existentes da US04. Corrigir somente lacunas demonstradas por testes.
- Após testes focais aprovados, executar as suítes completas da API e do Angular e o build, conforme o plano de fechamento, antes das revisões independentes.

O alinhamento documental de DELETE 200 com DTO permanece para o fechamento da história; a Tarefa 7 não altera o contrato já implementado.

O tutor apresentou a explicação antes do código e o autor autorizou: “Pode implementar”. O despacho se restringe à consolidação da US04, sem listagem da US05 nem recuperação automática de arquivos.
