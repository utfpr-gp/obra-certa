# Auditoria de preparação — 18/11/2026

## Recursos observados no console e no servidor

- Região Ohio (`us-east-2`).
- EC2 Amazon Linux 2023, x86_64, **t3.micro**, IMDSv2 obrigatório, sem perfil IAM.
- Disco raiz de **8 GB**, sem criptografia observada no console; 4,9 GB livres.
- Memória observada no terminal remoto: 913 MB totais, 529 MB disponíveis, sem swap.
- Docker instalado. Compose, imagens existentes e aplicação publicada ainda não
  foram validados no servidor.
- IP atribuído automaticamente, sem Elastic IP; domínio próprio não informado.
- Grupo da EC2 permite 80/443 e também **SSH 22 e API 8080 de qualquer IPv4**.
  A exposição direta de 8080 deve ser encerrada após validação do proxy; SSH
  precisa ser restrito preservando o acesso administrativo autorizado.
- Aurora PostgreSQL **17.9 Express**, com gateway gerenciado, **fora de VPC**,
  autenticação IAM e usuário administrativo `postgres`.
- Capacidade **0–4 ACUs**, pausa configurada após cinco minutos; não equivale a
  custo zero enquanto ativo. Perfil da aplicação ajustado para fechar conexões ociosas.
- Retenção observada no formulário: **um dia**. Proteção contra exclusão desativada.
  Planejar retenção/proteção conforme necessidade e limites do plano.

Nenhuma alteração nos recursos AWS foi aplicada durante esta auditoria.
O formulário do banco foi cancelado sem salvar. Não foram lidas senhas/chaves.

## Validação local concluída

- Imagem da API: Maven/Java21; runtime sem root; driver oficial AWS com plugin IAM.
- Imagem web: Node22, npm ci, Angular compilado e Nginx.
- Quatro contratos do Compose de produção aprovados.
- Seis testes dos scripts Bash aprovados em Linux: backup privado, falha de
  credenciais, destino de restore, preservação da versão, falha de restauração
  mantendo aplicação parada e exigência de confirmação.
- Shellcheck aprovado para os quatro scripts.
- Smoke completo com imagens reais e ambiente local descartável:
  - HTTPS com CA de teste explicitamente confiada, sem ignorar certificados;
  - fallback das rotas Angular e API privada bloqueada para anônimos;
  - 14 migrations Flyway no PostgreSQL17 com TLS e validação Hibernate;
  - cadastro, login, JWT24h, criação/leitura de obra;
  - SMTP autenticado com STARTTLS, link HTTPS, redefinição e bloqueio de reuso;
  - dump e restauração reais do PostgreSQL17; dados preservados após reinício.

O PostgreSQL isolado aceita o token IAM fictício do teste. Essa evidência valida
o driver e os componentes integrados, **não** a autorização da conta AWS nem a
renovação de credenciais reais.

## Ajustes resultantes da revisão

Os dois revisores independentes aprovaram a segunda rodada. O usuário aceitou
as correções da primeira: incluir o perfil tools ao ler configuração de backup e
preservar a tag durante restore. O smoke também detectou e levou à correção da
ausência do banco de destino no pg_restore. Pareceres e decisão estão em
`specs/deploy-producao-completo/reviews/`.

## Condições ainda necessárias para publicar

1. Criar usuário/banco dedicados e vincular perfil IAM de acesso mínimo à EC2.
2. Permitir acesso do backend ao IMDSv2 na rede Docker com hop limit 2.
3. Definir espaço suficiente para imagens/backup e restrições de rede da EC2.
4. Preencher `.env.production` somente no servidor com SMTP/storage de produção.
5. Definir DNS/endereço público HTTPS e transferir imagens/arquivos da mesma entrega.
6. Validar IAM real por mais de 15 minutos, banco, SMTP/storage, HTTPS público e
   restauração no ambiente AWS. Só então registrar o sistema como publicado.

Todos os arquivos e ajustes pertencem à mesma branch de preparação. A publicação
não foi declarada concluída e o README continua indicando o estado pendente.

## Atualização após configuração pelo autor

O autor confirmou criação do banco/usuário `obracerta`, associação do perfil IAM
à EC2 e instalação do Compose v5.6.0. O comando STS retornou a função criada pela
pilha `obracerta-acesso-banco`.

Um teste real executado na EC2 com cliente PostgreSQL17 em Docker retornou
`current_database=obracerta` e `current_user=obracerta`, usando IAM e TLS
`verify-full` com Amazon Root CA 1. O gateway Express usa Amazon Trust Services;
o bundle tradicional RDS anteriormente indicado causava falha de certificado.
Compose, scripts, documentação e fixtures foram corrigidos para AmazonRootCA1.pem.

O bootstrap recebeu GRANT temporário de SET ROLE ao administrador, seguido de
revogação após CREATE DATABASE; sequência validada pelo autor no Aurora17.
Quatro contratos e seis testes operacionais passaram após o ajuste; os dois
revisores independentes aprovaram a tarefa02. Renovação IAM no processo Java,
publicação HTTPS e fluxos com os serviços reais ainda precisam ser validados.
