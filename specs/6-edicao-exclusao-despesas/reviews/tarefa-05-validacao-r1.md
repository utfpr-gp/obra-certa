# Validação — Tarefa 5, rodada 1

## Pré-condições

Spec aprovada e plano commitado; Tarefas 1 a 4 concluídas. Revisão prévia e explicação antes do código foram apresentadas. O autor autorizou “Pode implementar”, retomando somente a Tarefa 5 da US04. Base do diff: `bbbc358c1427447ec1adc963cc0fbba900fcc0f0`.

A remoção local do rascunho da US05 e as alterações anteriores em docs/prd.md e docs/architecture.md não fazem parte desta implementação e foram preservadas.

## RED

- API: `ExpenseDeletionIntegrationTest`: **8 testes, 8 falhas esperadas, zero erros**, por HTTP 405 antes da implementação do DELETE. Log: `apps/api/target/us04-t5-red-root.log`.
- Angular focal: `expense-delete.spec.ts`: **9 testes, 9 falhas esperadas**, pela ausência da ação de exclusão. Log: `apps/web/us04-t5-red-root.log`.

## GREEN e regressão

- Backend: `./mvnw.cmd -Dtest=ExpenseDeletionIntegrationTest,ExpenseReceiptReplacementIntegrationTest,ExpenseReceiptRemovalIntegrationTest,ExpenseReceiptIntegrationTest,ExpensePaymentUpdateIntegrationTest,ExpenseUpdateIntegrationTest,ExpenseRegistrationIntegrationTest,ExpenseServiceTest,ExpenseRepositoryTest,BudgetServiceTest -Djava.external.resources=target/validation test`. Perfil test, PostgreSQL exclusivo `obracerta_us04_t3_test`, Flyway ativo e Hibernate validate. **148 testes, zero falhas, zero erros.** Log: `apps/api/target/us04-t5-green-root.log`.
- Frontend: `npx.cmd --no-install ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/**/*.spec.ts`. **124 testes aprovados, exit 0.** Log: `apps/web/us04-t5-green-root.log`. O launcher registrou demora para encerrar ChromeHeadless após concluir os testes, sem alterar o resultado aprovado.
- Build: `npm.cmd run build`: exit 0; aviso de bundle inicial 641,47 kB para orçamento de 500 kB. Log: `apps/web/us04-t5-build-root.log`.

## Comportamentos exercitados

- Exclusão lógica preserva a despesa e o pagamento, mantendo dados financeiros e histórico, com mesmo instante de deleted_at; gastos ativos são recalculados e tetos preservados.
- A chamada destrutiva ao storage ocorre depois da confirmação financeira; conexão PostgreSQL independente comprova o estado confirmado. Trigger de teste restrito ao cenário provoca falha de gravação, sem apagar arquivo, e é removido ao terminar.
- Erro no armazenamento não reativa a despesa; a resposta mantém sucesso financeiro e informa receiptDeletionFailed, com uma tentativa somente e sem recuperação automática.
- Ausência de comprovante confirmado não acessa armazenamento. Repetição, recursos alheios/inexistentes/excluídos e obra excluída retornam 404 sem acesso ao arquivo. Operações de consulta/edição/comprovante são bloqueadas após a exclusão.
- Modal compartilhado reutilizado sem alteração: cancelamento antes de enviar, X, Escape, backdrop inerte e duplo envio bloqueado. Fechar durante envio não libera nova exclusão; sucesso retira os dados e oferece retorno a /contas. Resultado incerto permite consultar manualmente, sem reenvio automático.

Comandos executados pelo orquestrador; nenhum storage real foi acessado. Não há migration, fila, agendamento, recuperação durável ou listagem da US05. A revisão independente ainda será registrada nos pareceres correspondentes.
