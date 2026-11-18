# Recuperação de senha — revisão de código, rodada 1

Revisor independente password_code. Revisão somente leitura.

Veredito com apontamentos.

- O limite de 72 caracteres permitia ultrapassar os 72 bytes UTF-8 aceitos pelo BCrypt e provocar erro interno.
- O SMTP síncrono permitia diferenças de tempo entre pedidos de contas conhecidas e desconhecidas.

Na implementação seguinte foram acrescentados validação por bytes nas duas camadas, testes com caracteres acentuados e processamento da consulta e envio em executor com fila limitada.
