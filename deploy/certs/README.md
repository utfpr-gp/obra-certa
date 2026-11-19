# Autoridade certificadora do gateway Aurora Express

No servidor, a partir da raiz do repositorio:

```bash
curl --fail --show-error --location --proto '=https' --tlsv1.2 \
  https://www.amazontrust.com/repository/AmazonRootCA1.pem \
  --output deploy/certs/AmazonRootCA1.pem
chmod 644 deploy/certs/AmazonRootCA1.pem
```

Este arquivo e uma CA publica, nao uma chave privada. O Compose monta somente
este arquivo como leitura, sem copiar certificados particulares para a imagem.
`sslmode=verify-full` valida a cadeia e o hostname oficial do endpoint AWS.
O gateway Express usa Amazon Trust Services; o bundle de CAs tradicionais do RDS
nao valida esta conexao. A CA Amazon Root CA 1 foi confirmada em conexao real
EC2/Aurora com `sslmode=verify-full`.
