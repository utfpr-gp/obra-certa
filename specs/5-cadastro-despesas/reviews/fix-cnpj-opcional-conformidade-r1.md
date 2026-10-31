# Parecer de Conformidade — Tarefa CNPJ opcional e máscara

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA10: máscara `00.000.000/0000-00` durante digitação | atendido: formatação progressiva, limite de 14 dígitos, atualização do controle e reposicionamento do cursor | expense-form.component.ts:188 |
| Digitação, colagem, limpeza e edição | atendido: tratamento pelo evento `input`, limpeza para vazio e tratamento de Backspace sobre separadores; testes exercitam esses cenários | expense-flow.spec.ts:433 |
| CA10: nome obrigatório e CNPJ opcional | atendido: nome mantém validação; CNPJ vazio é válido, sem asterisco nem `aria-required` | expense-form.component.ts:164; expense-form.component.html:51 |
| API aceita documento omitido, nulo, vazio ou whitespace e persiste `null` | atendido: DTO permite ausência e serviço normaliza antes de gravar | ExpenseCreateDTO.java:12; ExpenseService.java:62 |
| CNPJ preenchido inválido retorna 400 sem escrita | atendido: validação anterior à criação; testes de integração verificam status e contagens preservadas | ExpenseService.java:64; ExpenseRegistrationIntegrationTest.java:91 |
| Documento ausente não agrupa fornecedores | atendido: ramo sem documento cria fornecedor sem consultar por CNPJ; integração verifica IDs distintos | ExpenseService.java:67 |
| CNPJ preenchido normalizado reutiliza fornecedor próprio | atendido: pontuação removida e busca mantém filtro pelo proprietário | ExpenseService.java:69 |
| Exibição sem documento | atendido: seletor omite sufixo ausente e consulta mostra “Não informado” | expense-form.component.html:64; expense-detail.component.ts:38 |
| Escopo e documentação | atendido: PRD, CA10, plano e arquitetura alinhados; sem migration, biblioteca ou retomada das tarefas retiradas | docs/architecture.md:446 |

Análise independente do código, contratos e testes concluída. Evidências executadas pelo agente principal: GREEN com 68 testes web e 44 API; suítes completas com 259 web e 179 API; build com código 0.

Tentativa própria: compilação web concluída, mas ChromeHeadless não iniciou no sandbox (sessão `33608`, código 1). A tentativa escalada foi interrompida sem retornar ID ou resultado; não é contabilizada como teste aprovado.

## Apontamentos
