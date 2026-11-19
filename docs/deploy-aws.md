# Publicação na AWS — EC2 e Aurora PostgreSQL Express

## Estado e arquitetura escolhida

A publicação só está concluída após a validação pública deste roteiro. A existência
de recursos com estado `Disponível` não comprova funcionamento do ObraCerta.

- Região dos recursos existentes: **Ohio (`us-east-2`)**.
- EC2: Amazon Linux 2023, x86_64. Docker executa API, Nginx e Caddy.
- Banco existente: **Aurora PostgreSQL 17, criado com configuração Express**.
  Esse modo não está em uma VPC: utiliza gateway gerenciado pela AWS e aceita
  **somente IAM**. Não se aplica o procedimento de senha/SG de um RDS convencional.
- A API usa o endpoint **gravador do cluster**, TLS `verify-full` e AWS Advanced
  JDBC Wrapper com plugin IAM. O driver renova tokens; não salve um token de
  quinze minutos como senha permanente.
- Comprovantes e XML permanecem no bucket privado do Supabase Storage. O banco
  guarda seus metadados. O dump PostgreSQL não inclui os arquivos do bucket.
- Caddy publica somente 80/443, emite e renova o certificado do domínio. Nginx
  entrega o Angular; `/obracerta/*` segue diretamente para a API na mesma origem.

O `docker-compose.prod.yml` é independente: **não** o combine com o Compose local.
Usa `prod,aws-iam`; desenvolvimento continua com PostgreSQL e senha locais.

## 1. Verificar os recursos existentes

Antes da publicação, registre e confira no console:

| Item | Critério |
| --- | --- |
| EC2 | Linux x86_64, Docker e Compose v2 funcionando; espaço para duas versões das imagens e backups |
| Memória | API limitada a 512 MB, frontend a 64 MB e Caddy a 64 MB; avaliar memória real após a subida |
| Disco | Recomendado 20 GB ou mais. A EC2 existente tem 8 GB e precisa de avaliação/expansão antes de armazenar imagens |
| Entrada da EC2 | 80/443 públicos; SSH restrito ao IP administrativo ou aos prefixos do EC2 Instance Connect; fechar 8080 após validar o proxy |
| IMDS | IMDSv2 obrigatório; hop limit **2** para as credenciais do perfil IAM chegarem ao backend na rede Docker |
| Perfil IAM | Somente `rds-db:connect` para o usuário dedicado e o ID de recurso do cluster correto |
| Aurora Express | Endpoint gravador correto; versão 17; mínimo 0 ACUs e pausa automática conferidos; máximo adequado ao orçamento |
| Backups | Retenção automática conferida; snapshot antes de mudanças; restauração ensaiada em destino separado |
| Consumo | Conferir saldo e prazo do Free Plan; Aurora é cobrado por ACUs enquanto ativo, armazenamento e E/S conforme plano |

A configuração observada de 0–4 ACUs não equivale a custo zero. O perfil `prod`
fecha conexões ociosas após um minuto (`minimum-idle=0`), permitindo a pausa do
Aurora após o intervalo configurado. O primeiro acesso pode demorar durante a
retomada; conexão tem timeout de 60 segundos. A sonda dos containers não consulta
o banco periodicamente, para não mantê-lo acordado.

Uma `t3.micro` pode servir uma demonstração pequena com imagens prontas; isso
precisa ser medido. **Não compile Angular e Maven nessa instância de 1 GB.**
Mudanças de tamanho, disco e ACUs exigem conferir o custo na região da conta.

## 2. Preparar autenticação IAM do banco

No CloudShell autenticado na conta/região corretas, use o administrador IAM
existente para preparar um banco dedicado. O endpoint deve ser o gravador do
cluster, não o leitor. O seguinte comando não salva o token em arquivo:

```bash
export AWS_REGION=us-east-2
export RDSHOST=ENDPOINT_GRAVADOR_DO_CLUSTER
curl --fail --show-error --location --proto '=https' --tlsv1.2 \
  https://www.amazontrust.com/repository/AmazonRootCA1.pem \
  --output /tmp/obracerta-rds-ca.pem
export PGHOST="$RDSHOST" PGPORT=5432 PGUSER=postgres PGDATABASE=postgres
export PGSSLMODE=verify-full PGSSLROOTCERT=/tmp/obracerta-rds-ca.pem
export PGPASSWORD="$(aws rds generate-db-auth-token --hostname "$RDSHOST" \
  --port 5432 --username postgres --region "$AWS_REGION")"
psql --set=ON_ERROR_STOP=1 --file=deploy/bootstrap-database.sql
unset PGPASSWORD
```

Copie `deploy/bootstrap-database.sql` para o CloudShell antes de executar. É uma
preparação **única**; se usuário/banco já existirem, inspecione os donos antes de
prosseguir. Não exclua bancos para repetir o procedimento. O script cria
`obracerta`, concede `rds_iam` e cria o banco `obracerta` pertencente a esse usuário.
O administrador recebe temporariamente permissão para assumir o papel `obracerta`,
necessária ao criar um banco com outro proprietário no PostgreSQL 17; a permissão
é revogada após a criação. Execute os comandos separadamente, com autocommit.
As migrations Flyway criam o schema na primeira partida. Não há alteração de
migrations antigas nem seed de demonstração em produção.

Crie o perfil usando `deploy/iam/ec2-database-role.yml` no CloudFormation, em
`us-east-2`. Informe o **ID do recurso** `cluster-...` exibido na configuração do
Aurora e o usuário `obracerta`. O modelo cria somente a função/perfil IAM; não
cria outro banco ou outra EC2. Revise a permissão de criação IAM antes de confirmar.
Vincule o perfil resultante à EC2 existente. O JSON de exemplo em
`deploy/iam/rds-connect.example.json` mostra a política equivalente, sem curingas.

Configure IMDSv2 obrigatório com hop limit 2 na EC2. Isso permite ao SDK dentro
do container obter as credenciais temporárias do perfil. Não configure chaves AWS
permanentes nem monte o diretório pessoal `.aws` nos containers.

## 3. Preparar o servidor e o domínio

Conecte como `ec2-user`. Na AMI Amazon Linux 2023, confira primeiro:

```bash
free -m
df -h /
docker --version
docker compose version
aws --version
python3 --version
```

Se o Docker não estiver instalado, instale pelo repositório da distribuição:

```bash
sudo dnf install -y docker git python3
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
```

Reconecte após adicionar o grupo. Para Compose v2, use o procedimento oficial
de instalação do plugin listado nas referências. Confirme `docker compose version`
antes de prosseguir. A AMI normalmente inclui AWS CLI; confira seu funcionamento.

Use um domínio/subdomínio cujo registro A aponte para o IPv4 da EC2, sem registro
AAAA incorreto. Para demonstração sem domínio próprio, pode-se usar provisoriamente
um serviço DNS que resolva o IP, como `18-119-167-164.sslip.io`, **após confirmar a
resolução e disponibilidade**. Esse endereço depende do serviço externo e do IP
atual. O IP automático muda ao parar/iniciar a EC2; revalide DNS e certificados.
Um Elastic IP evita essa troca, mas também precisa ter seu custo conferido.

Não publique login/recuperação de senha em HTTP. Caddy só emite certificado público
com DNS correto e portas 80/443 acessíveis. Teste o HTTPS sem ignorar certificados.

## 4. Configurar arquivos no servidor

Coloque o código da mesma entrega aprovada no servidor, por Git ou cópia controlada.
Nunca coloque token Git no endereço do repositório ou no histórico do terminal.
Para repositório privado, utilize a autenticação já autorizada da sua conta.

Na raiz do checkout:

```bash
umask 077
cp deploy/.env.example .env.production
chmod 600 .env.production
```

Preencha esse arquivo somente no servidor. Mantenha `APP_DOMAIN` sem protocolo,
porta ou caminho; `RDS_HOST` sem protocolo/porta. Usuário/banco são `obracerta`.
`JWT_SECRET`: gere com `openssl rand -hex 48`. SMTP usa remetente autorizado,
autenticação e STARTTLS na porta 587; Gmail exige senha de aplicativo. Configure
bucket privado e credenciais S3 exclusivos de produção conforme
[supabase-storage.md](supabase-storage.md).

Compose interpreta `$` nos valores: se alguma credencial contiver `$`, use valor
entre aspas simples no `.env.production`. Esse arquivo é exclusivo do Compose e
não é importado pelo Spring nativo. **Nunca versionar `.env`, `.env.production`,
chaves privadas, tokens ou dumps.** Não execute `docker compose config` sem
`--quiet`/filtro: a saída completa expõe os segredos preenchidos.

Baixe a CA conforme [deploy/certs/README.md](../deploy/certs/README.md). A partir da
raiz, valide sem exibir credenciais:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
```

## 5. Construir fora da EC2 e publicar

Em uma máquina de desenvolvimento Linux/Windows com Docker Linux, construa as
duas imagens para **linux/amd64** com a mesma tag da entrega. No PowerShell:

```powershell
$releaseTag = 'SUBSTITUA_PELA_TAG_DA_ENTREGA'
docker build --platform linux/amd64 -t "obracerta-api:$releaseTag" apps/api
docker build --platform linux/amd64 -t "obracerta-web:$releaseTag" apps/web
docker save -o release-images.tar "obracerta-api:$releaseTag" "obracerta-web:$releaseTag"
scp -i C:\caminho\obra-certa-key.pem release-images.tar ec2-user@IP_DA_EC2:~/
```

As imagens não incluem `.env`, `node_modules` ou o `target` local. Transfira também
os arquivos de configuração/scripts **da mesma entrega**. O arquivo de imagens
pode ser grande; confira o espaço livre antes da transferência. Remova o arquivo
de transporte após carregar e validar, preservando imagens da versão anterior.
Nunca envie a chave `.pem` ao servidor.

Na EC2, já na raiz do projeto:

```bash
docker load -i ~/release-images.tar
bash deploy/release.sh TAG_DA_ENTREGA
```

O script valida configuração e Caddy, cria backup, aplica a versão e aguarda a
inicialização dos containers. Não usa `down -v`. A primeira publicação exige banco
dedicado já criado; o backup inicial pode estar vazio, antes do Flyway.

Para servidor com memória suficiente, `bash deploy/release.sh TAG --build`
constrói sequencialmente. Prefira imagens prontas na EC2 atual. O comando
`up --wait` comprova partida HTTP; a saúde do container não substitui os testes
de banco e dos serviços externos a seguir.

## 6. Validação obrigatória da publicação

Execute no servidor e de outro computador:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 backend
curl --fail --show-error --head https://DOMINIO/login
curl --show-error --head http://DOMINIO/login
```

Verifique perfil `prod,aws-iam`, Flyway concluído, `ddl-auto=validate`, HTTPS com
certificado válido e redirecionamento de HTTP. Não compartilhe logs com tokens.

- Cadastro e login; acesso anônimo bloqueado nas rotas privadas da API.
- Criar uma obra, fornecedor, orçamento e despesa; recarregar e confirmar os dados.
- Contas a pagar: marcar pagamento e conferir o painel/relatórios.
- Enviar/baixar comprovante; importar XML de NF-e e conferir a despesa.
- Recuperação de senha: receber e-mail, validar domínio HTTPS do link e redefinir.
- Confirmar validade de 24 horas no JWT; sessão expirada volta ao login com aviso.
- Recriar containers sem apagar volumes e confirmar persistência dos dados no Aurora.
- Aguardar **mais de quinze minutos**, abrir nova conexão e repetir uma operação:
  isso valida renovação IAM, não apenas uso de um token inicial ainda válido.
- Sem acessos, conferir no Aurora se a capacidade chega a 0 após ociosidade.
- Executar backup e ensaiar restauração em banco/destino isolado. Dados e contagens
  devem ser preservados; não ensaiar destrutivamente no banco em uso.

Somente depois dessas verificações atualize o README com o endereço real e o TCC
com a afirmação de hospedagem concluída. Enquanto houver pendências, registre-as.

## 7. Backup, restauração e retorno de versão

```bash
bash deploy/backup.sh
```

Cria dump custom PostgreSQL 17 em `backups/`, com permissões restritas, e verifica
o catálogo do arquivo. O arquivo só recebe extensão `.dump` ao concluir. O script
gera um token IAM novo e o transmite ao cliente PostgreSQL no ambiente temporário.
Não salva token no `.env` nem no argumento de linha de comando do `pg_dump`.

Copie o dump para armazenamento privado fora da EC2. Backups apenas no mesmo
servidor não protegem contra a perda da instância. Defina retenção e conferência
periódica; backups automáticos do Aurora são complementares. Preserve também o
bucket de comprovantes por procedimento do provedor, pois os arquivos não estão
no dump. Confira a recuperação dos dois componentes na mesma data.

Para restaurar um **destino explicitamente escolhido**, ajuste `ENV_FILE` para o
arquivo desse destino e confira endpoint/nome antes de executar:

```bash
ENV_FILE=/caminho/destino.env bash deploy/restore.sh backups/ARQUIVO.dump --confirm-restore
```

O destino precisa ter o mesmo usuário com IAM habilitado e permissão de conexão
na função da EC2. O script identifica a tag da imagem realmente implantada antes
de parar qualquer serviço e verifica as duas imagens. Se não houver container da
API, informe `RELEASE_TAG=TAG_DA_ENTREGA` no comando; nunca há retorno implícito a
`:local`. O script primeiro cria backup do destino atual, para a aplicação
e restaura com `--single-transaction --exit-on-error`. Falha reverte a transação e
mantém a aplicação parada para análise; sucesso reinicia e aguarda os containers.
Restauração exige confirmação explícita e substitui os dados do destino.

Para retornar a aplicação, preserve imagens e arquivos da entrega anterior:

```bash
RELEASE_TAG=TAG_ANTERIOR docker compose --env-file .env.production \
  -f docker-compose.prod.yml up -d --no-build --wait --wait-timeout 240
```

Isso retorna **somente os containers**, não desfaz migrations. Se o schema novo
não for compatível, restaure um snapshot/dump anterior **em outro destino** e
aponte a versão anterior para ele, preservando o banco atual para recuperação.
Não execute migrations reversas improvisadas nem apague volumes do Caddy.

## Referências oficiais

### Tentativa anterior no Amplify

O log de 18/11/2026 terminou com `Artifact directory doesn't exist:
dist/obra-certa`, apesar de `ng build` ter concluído. O projeto Angular se chama
`frontend`; o artefato estático está em `apps/web/dist/frontend/browser`.
O `amplify.yml` na raiz contém `appRoot: apps/web`, `npm ci` e
`baseDirectory: dist/frontend/browser` relativo à raiz da aplicação. No console,
`AMPLIFY_MONOREPO_APP_ROOT` precisa ser `apps/web`. Esse arquivo corrige o build e
a coleta dos artefatos; não inicia uma publicação no Amplify.

A arquitetura desta entrega mantém o frontend na EC2. Para escolher Amplify no
futuro, também seria necessário configurar fallback das rotas Angular e o proxy
HTTPS da API, pois a URL do frontend é relativa (`/obracerta`). Publicar somente
os arquivos estáticos não configura esses dois comportamentos.

### Documentação consultada

- [Aurora Express e autenticação exclusivamente IAM](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_GettingStartedAurora.AuroraPostgreSQL.ExpressConfig.html).
- [Plugin IAM do AWS Advanced JDBC Wrapper](https://github.com/aws/aws-advanced-jdbc-wrapper/blob/main/docs/using-the-jdbc-driver/using-plugins/UsingTheIamAuthenticationPlugin.md).
- [Suspensão automática do Aurora Serverless](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2-auto-pause.html).
- [Política de conexão IAM](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.IAMPolicy.html).
- [Instalar o plugin Compose](https://docs.docker.com/compose/install/linux/).
- [HTTPS automático do Caddy](https://caddyserver.com/docs/automatic-https).
- [Build monorepo do Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/monorepo-configuration.html).
