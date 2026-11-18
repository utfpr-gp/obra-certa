# Comprovantes no Supabase Storage

Desenvolvimento e produção usam a API S3 do Supabase Storage, com buckets privados separados. O PostgreSQL existente (Docker em desenvolvimento) e a autenticação JWT da aplicação permanecem os mesmos. Não migrar o banco nem habilitar Supabase Auth para este fluxo. Desenvolvimento precisa de internet para enviar e consultar comprovantes; os testes automatizados usam armazenamento controlado e HTTP local, sem acessar a conta Supabase.

## Configurar no painel

1. No projeto de desenvolvimento, abra **Storage** e crie o bucket `expense-receipts-dev` com acesso **privado** (Public desabilitado).
2. Nas restrições do bucket, configure `allowedMimeTypes` como `image/jpeg`, `image/png` e `application/pdf`, e `maxFileSize` como **10485760 bytes** (10 × 1024 × 1024). Se o painel mostrar unidades, confira o valor exato salvo. O limite global do projeto também precisa permitir esse tamanho.
3. Na configuração S3 do Storage, gere **Access Key ID** e **Secret Access Key**. Copie a região exibida no painel. Use o endpoint direto `https://<project-ref>.storage.supabase.co/storage/v1/s3`, substituindo `<project-ref>` pelo identificador do seu projeto; confira os dados do endpoint na configuração S3.
4. Para produção, configure outro bucket privado e outro par de credenciais, com as mesmas restrições. Prefira projetos separados para isolar os ambientes: as chaves S3 podem acessar todos os buckets do respectivo projeto. Nunca use o bucket ou as credenciais de produção nos testes de desenvolvimento.

Essas credenciais são chaves **S3**, diferentes de `anon` e `service_role`. Elas ignoram as políticas RLS e devem existir somente no backend. A aplicação autentica o proprietário e valida a posse e a exclusão lógica da obra/despesa antes de acessar o objeto. O frontend consulta o comprovante pela API autenticada, sem URL pública do bucket nem chaves S3.

## Preencher o único `.env` da raiz

Copie `.env.example` para `.env` somente na configuração inicial; preserve seu arquivo existente. Abra o `.env` da raiz e preencha manualmente:

| Campo | Valor |
| --- | --- |
| `RECEIPT_STORAGE_BUCKET` | Nome do bucket privado do ambiente; em desenvolvimento, `expense-receipts-dev` |
| `RECEIPT_STORAGE_ENDPOINT` | Endpoint direto S3 do seu projeto |
| `RECEIPT_STORAGE_REGION` | Região copiada da configuração S3 do painel |
| `RECEIPT_STORAGE_ACCESS_KEY` | Access Key ID gerado para S3 |
| `RECEIPT_STORAGE_SECRET_KEY` | Secret Access Key correspondente |
| `RECEIPT_STORAGE_PATH_STYLE` | `true` |

Não é necessário informar esses valores no chat. Não comite `.env`, não copie chaves para o Angular e não as imprima em comandos ou logs. Use valores simples `NOME=valor`, sem `export`, aspas ou interpolação de shell nos campos S3: o Spring lê o arquivo como propriedades e o Compose como arquivo de ambiente. Não duplique essas credenciais em outros arquivos.

Na execução nativa, `application.properties` importa opcionalmente `.env` no diretório atual e `../../.env`. Isso atende a execução a partir da raiz ou de `apps/api`; se ambos existirem, o arquivo do diretório atual tem precedência. Mantenha somente o arquivo da raiz. Variáveis exportadas no ambiente da aplicação têm precedência sobre o arquivo; remova valores antigos dessas variáveis se necessário. Arquivo ausente não bloqueia a inicialização; o cliente S3 é criado apenas quando um comprovante é acessado.

Execute nativamente a partir de `apps/api`:

```powershell
.\mvnw.cmd spring-boot:run
```

Ou, a partir da raiz, após gerar o pacote:

```powershell
java -jar apps/api/target/obracerta-backend-0.0.1-SNAPSHOT.jar
```

No Docker Compose, o backend recebe os mesmos campos pelo `env_file: .env` e pelas variáveis `RECEIPT_STORAGE_*`, sem container local de storage:

```powershell
docker compose up --build -d
```

Reinicie o backend após alterar os campos. Em produção, configure os valores exclusivos do ambiente no gerenciador de segredos/ambiente do backend.

## Verificação manual no ambiente de desenvolvimento

Esta lista é optativa e deve ser executada **somente no bucket de desenvolvimento**, após preencher os dados reais:

1. Entre na aplicação com uma conta de desenvolvimento, selecione uma obra própria e cadastre uma despesa com JPEG, PNG ou PDF válido. Confira o progresso e a confirmação do envio depois do salvamento financeiro.
2. Abra a consulta da despesa e baixe o comprovante. Confira tipo e conteúdo; no painel Storage, confirme que o objeto está no bucket privado de desenvolvimento.
3. Verifique o limite com um arquivo válido de exatamente **10485760 bytes**, respeitando o formato. Verifique também que a consulta exige autenticação e que outra conta recebe 404 para a despesa/comprovante.
4. Remova apenas os dados descartáveis desse teste no ambiente de desenvolvimento conforme os recursos disponíveis. Não altere objetos ou dados de produção.

Os testes locais do adaptador verificam caminho do endpoint, assinatura SigV4 e bytes enviados/recebidos. O cliente usa path style e envia o corpo sem encapsulamento AWS de chunks/trailers, com checksums somente quando exigidos. Isso não comprova acesso ao projeto real: sem executar a verificação com suas credenciais, a integração ao vivo com Supabase não está validada.

Referências oficiais: [autenticação S3](https://supabase.com/docs/guides/storage/s3/authentication), [compatibilidade S3](https://supabase.com/docs/guides/storage/s3/compatibility), [criação e restrições de buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets), [checksums no AWS SDK Java](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/s3-checksums.html) e [opções de chunks no SDK](https://docs.aws.amazon.com/java/api/latest/software/amazon/awssdk/services/s3/S3Configuration.Builder.html).
