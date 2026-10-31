# Histórico de implementação — Tarefa 6

## Interrupção antes da primeira revisão

O primeiro implementador interrompeu o trabalho ao identificar duas execuções com falha repetida na mensagem HTTP 413. A substituição de texto não encontrou a mensagem antiga e houve corrupção de acentuação em uma mensagem nova. O código permaneceu sem commit, e nenhum parecer de revisão da tarefa 6 foi emitido.

Nesse momento, a implementação utilizava PDFBox 3.0.8 para leitura estrutural de PDFs, ImageIO para decodificação de imagens e leitura assíncrona de assinaturas no navegador. Os últimos resultados informados foram 17 testes de integração com uma falha na mensagem 413, um teste de tratamento multipart aprovado e validação final web pendente. A execução completa iniciada pelo orquestrador foi interrompida após o relato do limite; não constitui suíte aprovada.

## Decisão do autor em 2026-10-29

Após solicitar uma explicação do tratamento de PDF e discutir a alternativa sem biblioteca, o autor determinou: “Simplifique a validação para apenas o tipo do arquivo e tamanho”.

A retomada aplica esse contrato simplificado: MIME, extensão correspondente e tamanho para JPEG, PNG e PDF, sem inspeção de conteúdo em nenhuma camada. Remove PDFBox, parsing estrutural, decodificação de imagens e leitura assíncrona de bytes. Mantém arquivo não vazio, limite exato de 10 MiB aceito, erros 400/413, orientação ao usuário, isolamento e preservação dos dados financeiros. O plano foi alinhado à decisão; o status da spec não foi alterado.

Um implementador com contexto limpo recebe a premissa revista e o diagnóstico da falha de texto para concluir a tarefa. Este histórico preserva a interrupção anterior, sem convertê-la em aprovação ou apagá-la. A próxima revisão continua sendo a rodada 1, pois ainda não houve pareceres da tarefa 6.
