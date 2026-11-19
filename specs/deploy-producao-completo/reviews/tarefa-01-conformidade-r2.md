# Revisão de conformidade — rodada 2

Revisor independente: `/root/deploy_conformity_review`.
Base: diff HEAD e arquivos novos do escopo. **Veredito: APROVADO.**

Critérios atendidos na configuração: Angular/Java21 na EC2 e banco externo;
IAM renovável por perfil EC2; TLS verify-full; Flyway ativo e Hibernate validate;
seed desligado; HTTPS; orientação para a instância limitada; backup com perfil
tools; restore preserva versão publicada e informa banco de destino; documentação
distingue preparação de publicação; artefato Amplify correto sem mudar arquitetura;
ausência de .env real no diff.

Quatro contratos passaram nesta revisão. Os seis testes operacionais e o smoke
completo foram aprovados pelo executor; não repetidos pelo revisor.
Validação IAM/AWS real e publicação pública permanecem pendentes, documentadas.
Novos apontamentos: nenhum.
