"""Contratos de implantação. Usa somente valores fictícios, nunca o .env local."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
EXAMPLE = """APP_DOMAIN=obra.example.com
RDS_HOST=database.example.com
RDS_DATABASE=obracerta
RDS_USERNAME=test_user
AWS_REGION=us-east-2
PGPASSWORD=test_iam_token
JWT_SECRET=test-secret-not-for-production
MAIL_FROM=ObraCerta <test@example.com>
SMTP_HOST=smtp.example.com
SMTP_USERNAME=test@example.com
SMTP_PASSWORD=test_password
RECEIPT_STORAGE_ENDPOINT=https://storage.example.com
RECEIPT_STORAGE_BUCKET=test-bucket
RECEIPT_STORAGE_REGION=us-east-1
RECEIPT_STORAGE_ACCESS_KEY=test_access
RECEIPT_STORAGE_SECRET_KEY=test_secret
"""


class ProductionContract(unittest.TestCase):
    def config(self, contents=EXAMPLE, check=True):
        with tempfile.TemporaryDirectory() as directory:
            env = Path(directory) / "test.env"
            env.write_text(contents, encoding="utf-8")
            result = subprocess.run(
                ["docker", "compose", "--env-file", str(env), "-f",
                 str(ROOT / "docker-compose.prod.yml"), "--profile", "tools",
                 "config", "--format", "json"],
                cwd=ROOT, capture_output=True, text=True,
            )
        if check:
            self.assertEqual(result.returncode, 0, result.stderr)
            return json.loads(result.stdout)
        return result

    def test_only_https_gateway_is_public_and_database_is_external(self):
        config = self.config()
        self.assertNotIn("db", config["services"])
        for name, service in config["services"].items():
            if name != "gateway":
                self.assertFalse(service.get("ports"), name)
        self.assertEqual({p["target"] for p in config["services"]["gateway"]["ports"]}, {80, 443})

    def test_real_credentials_are_required_instead_of_local_defaults(self):
        result = self.config(EXAMPLE.replace("JWT_SECRET=test-secret-not-for-production", "JWT_SECRET="), check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("JWT_SECRET", result.stderr)

    def test_production_has_verified_tls_and_no_demo_seed(self):
        config = self.config()
        api = config["services"]["backend"]
        env = api["environment"]
        self.assertEqual(env["SPRING_PROFILES_ACTIVE"], "prod,aws-iam")
        self.assertEqual(env["SPRING_JPA_HIBERNATE_DDL_AUTO"], "validate")
        self.assertEqual(env["OBRACERTA_SEED_ENABLED"], "false")
        self.assertIn("sslmode=verify-full", env["SPRING_DATASOURCE_URL"])
        self.assertTrue(env["SPRING_DATASOURCE_URL"].startswith("jdbc:aws-wrapper:postgresql:"))
        self.assertIn("wrapperPlugins=iam", env["SPRING_DATASOURCE_URL"])
        self.assertIn("wrapperDialect=pg", env["SPRING_DATASOURCE_URL"])
        self.assertIn("iamRegion=us-east-2", env["SPRING_DATASOURCE_URL"])
        self.assertEqual(env["SPRING_DATASOURCE_PASSWORD"], "")
        self.assertNotIn("AWS_SECRET_ACCESS_KEY", env)
        self.assertEqual(env["SPRING_DATASOURCE_URL"], env["FLYWAY_URL"])
        self.assertEqual(env["FRONTEND_URL"], "https://obra.example.com")
        self.assertTrue(any(v.get("read_only") and v["target"].endswith("AmazonRootCA1.pem")
                            for v in api["volumes"]))
        self.assertNotIn("SMTP_PASSWORD", config["services"]["frontend"].get("environment", {}))
        tools = config["services"]["db-tools"]["environment"]
        self.assertEqual(tools["PGSSLMODE"], "verify-full")
        self.assertEqual(tools["PGPASSWORD"], "test_iam_token")

    def test_services_wait_for_application_startup(self):
        services = self.config()["services"]
        self.assertEqual(services["frontend"]["depends_on"]["backend"]["condition"], "service_healthy")
        self.assertIn("healthcheck", services["backend"])
        for service in (services["backend"], services["frontend"], services["gateway"]):
            self.assertEqual(service["restart"], "unless-stopped")
            self.assertIn("max-size", service["logging"]["options"])


if __name__ == "__main__":
    unittest.main()
