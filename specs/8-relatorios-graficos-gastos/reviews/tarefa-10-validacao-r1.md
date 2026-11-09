# Validação da tarefa 10 — PDF após falha da consulta

Data: 09/11/2026. A correção implementa a decisão da auditoria r6. O botão e a ação de exportar exigem uma resposta válida para a obra ativa. Após a falha, o PDF volta a ficar disponível quando a tentativa seguinte carrega o relatório e reconcilia a categoria.

- RED: o teste confirmou que o botão ficava habilitado e uma chamada direta enviava a requisição indevida. Resultado de um teste falhando e 27 aprovados. Log `apps/web/us06-r6-export-red.log`.
- GREEN: `npm.cmd test -- --watch=false --browsers=ChromeHeadless` passou nos 446 testes. Log `apps/web/us06-r6-export-green.log`.
- `npm.cmd run build` concluiu. Log `apps/web/us06-r6-export-build.log`.
- A API mantém os 348 testes aprovados em PostgreSQL 16 registrados em `validacao-pos-auditoria-r4.md`. A tarefa 10 altera o frontend.
