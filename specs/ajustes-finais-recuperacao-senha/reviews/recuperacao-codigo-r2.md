# Recuperação de senha — revisão de código, rodada 2

Revisor independente password_code. Revisão somente leitura.

Veredito aprovado.

A API valida o limite de 72 bytes UTF-8 antes do BCrypt. O frontend bloqueia senhas excedentes e tem teste com caracteres acentuados.

A consulta da conta e o SMTP acontecem no executor para todos os endereços. O teste confirma o enfileiramento antes da consulta ao repositório.

Sem novos apontamentos bloqueantes.
