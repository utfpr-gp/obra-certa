# Revisão de código — rodada 1

Base: `git diff HEAD` e arquivos novos do escopo de implantação. Manutenção
autorizada sem spec. Revisor independente: `/root/deploy_code_review`.

Veredito: apontamentos.

1. **Alta — deploy/common.sh:17.** A consulta `compose config --format json` não
   ativa `tools`, e a leitura de `services["db-tools"]` falha. Confirmado com
   configuração fictícia, sem acesso ao `.env` real. Bloqueia backup, release e restore.
2. **Alta — deploy/restore.sh:21.** `release.sh` exporta a tag somente em seu
   processo. Restore sem tag usa imagens `:local`, podendo falhar ou iniciar
   versão diferente. Preservar ou exigir a versão antes de interromper serviços.

O teste local com token IAM fictício não comprova permissão/renovação no gateway
AWS. A validação externa continua obrigatória.
