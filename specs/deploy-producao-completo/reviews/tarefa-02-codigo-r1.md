# Revisão de código — tarefa 02, rodada 1

Correção descoberta na validação real: CA do gateway Aurora Express e permissão
temporária exigida pelo PostgreSQL17 para criar banco com outro proprietário.
Revisor independente: `/root/deploy_code_review`. **APROVADO.**

Amazon Root CA 1 consistente entre Compose, scripts, documentação e testes.
TLS verify-full e montagem somente leitura preservados. Bootstrap concede SET
temporariamente ao administrador e revoga a associação após criar o banco;
autocommit e execução única documentados. Nenhum apontamento bloqueante.

A conexão real informada comprova acesso IAM com a CA correta. Renovação IAM
pela aplicação permanece validação separada.
