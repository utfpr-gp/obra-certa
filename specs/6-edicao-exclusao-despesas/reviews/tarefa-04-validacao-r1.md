# Validação — Tarefa 4, rodada 1

## Contrato e autorização

O autor retirou toda a infraestrutura de recuperação de arquivos, inclusive o que havia sido transferido da Tarefa 3, e depois autorizou iniciar o desenvolvimento. Spec, plano e revisão prévia atualizados foram commitados antes do código em `4f2e75120ef760647ce404dfac339900988640bf`. O campo de aprovação da spec permaneceu inalterado. O tutor apresentou o desenho simplificado antes do despacho do implementador.

Resultado esperado: novo arquivo em chave distinta; associação confirmada no banco antes de apagar o antigo; uma tentativa imediata; falha de exclusão comunicada sem recuperação automática. `receiptDeletionFailed` é resultado transitório, não estado persistido. Nenhuma migration, fila ou agendamento.

## RED

- Backend: `ExpenseReceiptReplacementIntegrationTest`, PostgreSQL exclusivo `obracerta_us04_t3_test`: 20 testes, 16 falhas esperadas por HTTP 409 quando os novos cenários exigiam substituição ou validação; quatro cenários de isolamento já passaram. Log: `apps/api/target/us04-t4-red-root.log`.
- Angular focal: nove testes, seis falhas novas pela ausência do seletor/substituição; três cenários da remoção anterior passaram. Log: `apps/web/us04-t4-red-root.log`.

## GREEN e regressão

- Backend: `./mvnw.cmd -Dtest=ExpenseReceiptReplacementIntegrationTest,ExpenseReceiptRemovalIntegrationTest,S3ReceiptStorageTest,ExpenseReceiptIntegrationTest,ExpensePaymentUpdateIntegrationTest,ExpenseUpdateIntegrationTest,ExpenseRegistrationIntegrationTest -Djava.external.resources=target/validation test`. Perfil test, PostgreSQL exclusivo, Flyway ativo, Hibernate validate. **117 testes, zero falhas, zero erros.** Log: `apps/api/target/us04-t4-green-root.log`.
- Primeira regressão Angular: 110/113; duas expectativas antigas exigiam ausência do seletor após UPLOADED e um teste novo simulava erro de download Blob com corpo incompatível. Adequados somente os testes: seletor presente/habilitado conforme CA5 e corpo nulo na simulação de erro de Blob. A adaptação em `expense-flow.spec.ts` integra os testes de upload da US03 previstos no plano, preservando demais asserções.
- Angular após ajustes: **113 aprovados**. Log: `apps/web/us04-t4-green-final-root.log`.
- RED adicional antes de corrigir mensagem: dois testes novos, status 0 e 500, provaram que uma resposta incerta afirmava indevidamente que o arquivo anterior fora preservado. Onze testes focais, duas falhas esperadas. Log: `apps/web/us04-t4-network-red-root.log`.
- Após ajuste mínimo de mensagem, regressão Angular final: `npx.cmd --no-install ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/expenses/**/*.spec.ts`: **115 aprovados**. Log: `apps/web/us04-t4-green-complete-root.log`.
- Build: `npm.cmd run build`, exit 0, aviso de bundle inicial 637,43 kB para orçamento de 500 kB. Log: `apps/web/us04-t4-build-root.log`. Executado antes do último ajuste restrito à mensagem de erro; a compilação dos testes Angular finais cobre o TypeScript atualizado. Nenhum Java foi alterado após os 117 testes aprovados.

## Limites transacionais verificados

O teste novo usa chamadas HTTP sem transação externa e conexão PostgreSQL independente para verificar commit antes de excluir o antigo. A falha de persistência é provocada por trigger restrito ao UUID do cenário, removido ao finalizar. O teste anterior de upload da US03 foi adaptado para transações reais e limpeza por obra/UUID, mantendo suas provas de comportamento.

Comandos executados pelo orquestrador; nenhum armazenamento externo real foi acessado. Revisões independentes ainda são necessárias e serão registradas separadamente.
