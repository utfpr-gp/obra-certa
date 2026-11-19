-- Executar UMA VEZ como administrador via CloudShell/psql com IAM.
-- Cria um banco dedicado; nao use o banco administrativo postgres na aplicacao.
-- Nao faz parte do Flyway: prepara o banco ANTES das migrations da aplicacao.
CREATE ROLE obracerta WITH LOGIN;
GRANT rds_iam TO obracerta;
-- PostgreSQL 17 exige poder assumir o papel do proprietario durante a criacao.
GRANT obracerta TO postgres WITH SET TRUE;
CREATE DATABASE obracerta OWNER obracerta;
REVOKE obracerta FROM postgres;
