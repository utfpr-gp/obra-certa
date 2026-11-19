"""Integração local isolada: imagens reais, PostgreSQL 17 TLS e SMTP STARTTLS.

Executar após construir obracerta-api:deploy-completo e obracerta-web:deploy-completo.
Não acessa AWS nem lê .env. PostgreSQL de teste aceita o token IAM fictício:
permissões IAM e assinatura no gateway AWS precisam ser validadas no ambiente real.
"""
import base64
import json
import os
from pathlib import Path
import re
import shutil
import ssl
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

from test_production import EXAMPLE, ROOT

DB_HOST = "test.cluster-localtest.us-east-2.rds.amazonaws.com"
OPENSSL = shutil.which("openssl") or r"C:\Program Files\Git\usr\bin\openssl.exe"


def run(args, **kwargs):
    return subprocess.run(args, check=True, capture_output=True, **kwargs).stdout


def main():
    test_root = ROOT / "tmp"
    test_root.mkdir(exist_ok=True)
    directory = Path(tempfile.mkdtemp(prefix="deploy-smoke-", dir=test_root))
    project = "obracerta-smoke-" + str(int(time.time()))
    env_file = directory / "test.env"
    override_file = directory / "override.json"
    command = ["docker", "compose", "-p", project, "--env-file", str(env_file),
               "-f", str(ROOT / "docker-compose.prod.yml"), "-f", str(override_file)]

    def compose(*args, **kwargs):
        return run(command + list(args), **kwargs)

    def certificate(name, hostname):
        run([OPENSSL, "req", "-newkey", "rsa:2048", "-nodes", "-keyout", str(directory / f"{name}.key"),
             "-out", str(directory / f"{name}.csr"), "-subj", f"/CN={hostname}"])
        extensions = directory / f"{name}.ext"
        extensions.write_text(f"subjectAltName=DNS:{hostname}\nextendedKeyUsage=serverAuth\n")
        run([OPENSSL, "x509", "-req", "-in", str(directory / f"{name}.csr"),
             "-CA", str(directory / "ca.pem"), "-CAkey", str(directory / "ca.key"),
             "-CAcreateserial", "-out", str(directory / f"{name}.crt"),
             "-days", "2", "-extfile", str(extensions)])

    def request(path, data=None, token=None, expected=200):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        req = urllib.request.Request("https://localhost:18443" + path,
                                     data=None if data is None else json.dumps(data).encode(), headers=headers)
        try:
            response = urllib.request.urlopen(req, context=context, timeout=70)
        except urllib.error.HTTPError as exc:
            response = exc
        assert response.status == expected, (path, response.status, expected)
        body = response.read()
        return json.loads(body) if body and response.headers.get("Content-Type", "").startswith("application/json") else body

    try:
        # Certificados exclusivos deste teste; a CA real do RDS permanece intacta.
        run([OPENSSL, "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "2",
             "-keyout", str(directory / "ca.key"), "-out", str(directory / "ca.pem"),
             "-subj", "/CN=ObraCerta Isolated Test CA"])
        certificate("database", DB_HOST)
        certificate("smtp", "smtp-test")
        run(["docker", "run", "--rm", "-v", f"{directory.as_posix()}:/certs", "--entrypoint", "keytool",
             "eclipse-temurin:21-jre", "-importcert", "-noprompt", "-alias", "test-ca",
             "-file", "/certs/ca.pem", "-keystore", "/certs/truststore.p12", "-storepass", "changeit"])
        (directory / "truststore.p12").chmod(0o644)
        env_file.write_text(EXAMPLE.replace("APP_DOMAIN=obra.example.com", "APP_DOMAIN=localhost")
                            .replace("RDS_HOST=database.example.com", f"RDS_HOST={DB_HOST}")
                            .replace("RDS_USERNAME=test_user", "RDS_USERNAME=obracerta")
                            + "\nRELEASE_TAG=deploy-completo\nHTTP_PORT=18080\nHTTPS_PORT=18443\nPUBLIC_BIND=127.0.0.1\n")
        cert_mount = {"type": "bind", "source": directory.as_posix(), "target": "/test-certs", "read_only": True}
        ca_mount = {"type": "bind", "source": (directory / "ca.pem").as_posix(),
                    "target": "/etc/ssl/rds/AmazonRootCA1.pem", "read_only": True}
        override = {"services": {
            "backend": {"environment": {
                "AWS_ACCESS_KEY_ID": "test-access-key", "AWS_SECRET_ACCESS_KEY": "test-secret-key",
                "SMTP_HOST": "smtp-test", "SMTP_PORT": "1025", "SMTP_USERNAME": "test", "SMTP_PASSWORD": "test",
                "FRONTEND_URL": "https://localhost:18443", "CORS_ALLOWED_ORIGINS": "https://localhost:18443",
                "JAVA_TOOL_OPTIONS": "-Xmx384m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 "
                "-Djavax.net.ssl.trustStore=/test-certs/truststore.p12 -Djavax.net.ssl.trustStorePassword=changeit"},
                "volumes": [ca_mount, cert_mount], "depends_on": {"db-test": {"condition": "service_healthy"}}},
            "db-tools": {"volumes": [ca_mount]},
            "db-test": {"image": "postgres:17", "environment": {
                "POSTGRES_USER": "obracerta", "POSTGRES_DB": "obracerta", "POSTGRES_HOST_AUTH_METHOD": "trust"},
                "volumes": [cert_mount, "test_db_data:/var/lib/postgresql/data"],
                "entrypoint": ["sh", "-c", "cp /test-certs/database.key /tmp/server.key && chmod 600 /tmp/server.key "
                               "&& chown postgres /tmp/server.key && exec docker-entrypoint.sh postgres "
                               "-c ssl=on -c ssl_cert_file=/test-certs/database.crt -c ssl_key_file=/tmp/server.key"],
                "networks": {"default": {"aliases": [DB_HOST]}},
                "healthcheck": {"test": ["CMD", "pg_isready", "-U", "obracerta"], "interval": "2s", "retries": 30}},
            "smtp-test": {"image": "axllent/mailpit:v1.27", "environment": {
                "MP_SMTP_TLS_CERT": "/test-certs/smtp.crt", "MP_SMTP_TLS_KEY": "/test-certs/smtp.key",
                "MP_SMTP_REQUIRE_STARTTLS": "true", "MP_SMTP_AUTH": "test:test"},
                "volumes": [cert_mount], "ports": ["127.0.0.1:18025:8025"]}
        }, "volumes": {"test_db_data": {}}}
        override_file.write_text(json.dumps(override), encoding="utf-8")
        print("Iniciando ambiente isolado de producao...", flush=True)
        compose("up", "-d", "--no-build", "--wait", "--wait-timeout", "240")
        compose("cp", "gateway:/data/caddy/pki/authorities/local/root.crt", str(directory / "https-ca.crt"))
        context = ssl.create_default_context(cafile=str(directory / "https-ca.crt"))
        assert b"app-root" in request("/login")
        assert b"app-root" in request("/redefinir-senha")
        request("/obracerta/api/projects", expected=401)
        account = {"name": "Teste Deploy", "email": "deploy@example.test", "password": "senha123"}
        request("/obracerta/api/auth/register", account)
        token = request("/obracerta/api/auth/login", account)["token"]
        payload = token.split(".")[1]
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        assert abs(claims["exp"] - int(time.time()) - 86400) < 20
        types = (ROOT / "apps/api/src/main/java/com/obracerta/enums/ProjectType.java").read_text()
        project_type = re.search(r"enum ProjectType\s*\{\s*([A-Z_]+)", types).group(1)
        work = request("/obracerta/api/projects", {"name": "Obra teste deploy", "type": project_type}, token, 201)
        assert any(item["id"] == work["id"] for item in request("/obracerta/api/projects", token=token))
        tls = compose("--profile", "tools", "run", "--rm", "-T", "db-tools", "psql", "-Atc",
                      "SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()", text=True).strip()
        assert tls == "t", tls
        print("HTTPS, rotas SPA, login, JWT de 24h, persistencia e TLS PostgreSQL: OK", flush=True)
        request("/obracerta/api/auth/forgot-password", {"email": account["email"]})
        message = None
        for _ in range(40):
            with urllib.request.urlopen("http://localhost:18025/api/v1/messages") as response:
                messages = json.load(response)["messages"]
            if messages:
                with urllib.request.urlopen("http://localhost:18025/api/v1/message/" + messages[0]["ID"]) as response:
                    message = json.load(response)
                break
            time.sleep(0.5)
        assert message, "SMTP nao recebeu email via STARTTLS"
        recovery_token = re.search(r"https://localhost:18443/redefinir-senha#token=([A-Za-z0-9_-]+)", message["Text"]).group(1)
        request("/obracerta/api/auth/reset-password", {"token": recovery_token, "password": "novaSenha123"})
        account["password"] = "novaSenha123"
        token = request("/obracerta/api/auth/login", account)["token"]
        request("/obracerta/api/auth/reset-password", {"token": recovery_token, "password": "outraSenha123"}, expected=400)
        print("Email com autenticacao/STARTTLS, link HTTPS e recuperacao de senha: OK", flush=True)
        dump = compose("--profile", "tools", "run", "--rm", "-T", "db-tools", "pg_dump", "-Fc", "--no-owner", "--no-acl")
        assert b"projects" in compose("--profile", "tools", "run", "--rm", "-T", "db-tools", "pg_restore", "--list", input=dump)
        compose("stop", "gateway", "frontend", "backend")
        compose("--profile", "tools", "run", "--rm", "-T", "db-tools", "psql", "-v", "ON_ERROR_STOP=1", "-c", "DELETE FROM projects")
        compose("--profile", "tools", "run", "--rm", "-T", "db-tools", "pg_restore", "--dbname=obracerta", "--clean", "--if-exists",
                "--no-owner", "--no-acl", "--single-transaction", "--exit-on-error", input=dump)
        compose("up", "-d", "--no-build", "--wait", "--wait-timeout", "240")
        token = request("/obracerta/api/auth/login", account)["token"]
        assert any(item["id"] == work["id"] for item in request("/obracerta/api/projects", token=token))
        print("Backup/restauracao PostgreSQL 17 e persistencia apos reinicio: OK", flush=True)
    except Exception:
        if override_file.exists():
            logs = subprocess.run(command + ["logs", "--tail=45", "backend"], capture_output=True, text=True)
            print(logs.stdout)
        raise
    finally:
        if override_file.exists():
            subprocess.run(command + ["down", "--volumes", "--remove-orphans"], capture_output=True)
        # Apenas o diretorio temporario criado por este teste pode ser removido.
        assert directory.resolve().is_relative_to(test_root.resolve())
        shutil.rmtree(directory)


if __name__ == "__main__":
    main()
