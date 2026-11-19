# Revisão de conformidade — rodada 1

Base: `git diff HEAD` e arquivos novos do escopo. Critérios de manutenção no
despacho do usuário; sem spec. Revisor: `/root/deploy_conformity_review`.

Veredito: apontamentos.

1. **Alta — deploy/restore.sh:21.** Restauração não preserva a tag publicada.
   O comando documentado informa só `ENV_FILE`; Compose usa `:local`, embora a
   publicação construa tags específicas. Viola recuperação operacional.

Configuração atende: Angular/Java21 na EC2, banco externo Aurora Express IAM,
TLS verify-full, Flyway/Hibernate validate, seed desligado e arquivos de ambiente
fora do Git. Publicação HTTPS, IAM real e serviços externos ainda pendentes.

Quatro contratos passaram. Tentativa do smoke pelo revisor foi impedida pelo
OpenSSL no ambiente restrito; essa tentativa não comprova integração.
