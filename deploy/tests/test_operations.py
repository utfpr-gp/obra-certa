"""Executa os scripts Bash com processos Docker/AWS controlados, sem tocar a AWS.

No Windows, executar em python:3.14-slim com o repositorio montado somente leitura.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
MOCK = r'''
import json, os, sys
from pathlib import Path
args = sys.argv[1:]
with open(os.environ["CALLS"], "a") as calls:
    calls.write(json.dumps({"args": args, "tag": os.environ.get("RELEASE_TAG")}) + "\n")
if "config" in args and "json" in args:
    services = {"backend": {"environment": {"AWS_REGION": "us-east-2"}}}
    if "--profile" in args and "tools" in args:
        services["db-tools"] = {"environment": {"PGHOST": "test.example.com", "PGUSER": "obracerta"}}
    print(json.dumps({"services": services}))
elif "ps" in args:
    if not os.environ.get("NO_CONTAINER"):
        print("test-container")
elif args and args[0] == "inspect":
    print("obracerta-api:stable-42")
elif "pg_dump" in args:
    sys.stdout.buffer.write(b"PGDMP-test")
elif "pg_restore" in " ".join(args):
    sys.stdin.buffer.read()
    if "--list" not in args:
        assert '--dbname="$PGDATABASE"' in " ".join(args), "Destino ausente"
        if os.environ.get("RESTORE_FAIL"):
            sys.exit(1)
elif "up" in args:
    assert os.environ.get("RELEASE_TAG") == "stable-42", "Versao publicada perdida"
'''


@unittest.skipUnless(os.name == "posix" and shutil.which("bash"), "Requer Bash/Linux")
class OperationalScripts(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        (self.root / "deploy/certs").mkdir(parents=True)
        (self.root / "bin").mkdir()
        for file in (ROOT / "deploy").glob("*.sh"):
            shutil.copyfile(file, self.root / "deploy" / file.name)
        (self.root / "deploy/certs/AmazonRootCA1.pem").write_text("test-ca")
        (self.root / ".env.production").write_text("# test only\n")
        (self.root / "snapshot.dump").write_bytes(b"PGDMP-original")
        docker = self.root / "bin/docker"
        docker.write_text(f"#!{sys.executable}\n" + MOCK)
        docker.chmod(0o755)
        aws = self.root / "bin/aws"
        aws.write_text('#!/usr/bin/env bash\nif [[ -n "${AWS_FAIL:-}" ]]; then exit 254; fi\nprintf fake-iam-token\n')
        aws.chmod(0o755)
        self.env = dict(os.environ, PATH=str(self.root / "bin") + os.pathsep + os.environ["PATH"],
                        CALLS=str(self.root / "calls.jsonl"))
        self.env.pop("RELEASE_TAG", None)
        self.env.pop("ENV_FILE", None)

    def execute(self, script, *args, **env):
        return subprocess.run(["bash", "deploy/" + script, *args], cwd=self.root,
                              env=dict(self.env, **env), capture_output=True, text=True)

    def calls(self):
        file = self.root / "calls.jsonl"
        return [json.loads(line) for line in file.read_text().splitlines()] if file.exists() else []

    def test_backup_activates_tools_profile_and_creates_private_complete_dump(self):
        result = self.execute("backup.sh")
        self.assertEqual(result.returncode, 0, result.stderr)
        dumps = list((self.root / "backups").glob("*.dump"))
        self.assertEqual(len(dumps), 1)
        self.assertEqual(dumps[0].read_bytes(), b"PGDMP-test")
        self.assertEqual(dumps[0].stat().st_mode & 0o777, 0o600)
        self.assertFalse(list((self.root / "backups").glob("*.partial")))

    def test_missing_iam_credentials_stops_backup_before_creating_dump(self):
        result = self.execute("backup.sh", AWS_FAIL="1")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.root / "backups").exists())

    def test_restore_preserves_actual_release_and_has_explicit_database_destination(self):
        result = self.execute("restore.sh", "snapshot.dump", "--confirm-restore")
        self.assertEqual(result.returncode, 0, result.stderr)
        calls = self.calls()
        ups = [call for call in calls if "up" in call["args"]]
        self.assertEqual(len(ups), 1)
        self.assertEqual(ups[0]["tag"], "stable-42")
        self.assertTrue(any("--dbname=" in " ".join(call["args"]) for call in calls))
        self.assertTrue(list((self.root / "backups").glob("*.dump")))

    def test_restore_failure_keeps_application_stopped(self):
        result = self.execute("restore.sh", "snapshot.dump", "--confirm-restore", RESTORE_FAIL="1")
        self.assertNotEqual(result.returncode, 0)
        calls = self.calls()
        self.assertTrue(any("stop" in call["args"] for call in calls))
        self.assertFalse(any("up" in call["args"] for call in calls))

    def test_unidentified_release_fails_before_stopping_services(self):
        result = self.execute("restore.sh", "snapshot.dump", "--confirm-restore", NO_CONTAINER="1")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(any("stop" in call["args"] for call in self.calls()))

    def test_restore_without_confirmation_fails_before_any_external_command(self):
        result = self.execute("restore.sh", "snapshot.dump")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(self.calls())


if __name__ == "__main__":
    unittest.main()
