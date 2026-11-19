#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=deploy/common.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/common.sh"
umask 077
iam_token
mkdir -p backups
backup_partial="$(mktemp "backups/obracerta-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX.partial")"
trap 'rm -f -- "$backup_partial"; unset PGPASSWORD' EXIT
compose --profile tools run --rm -T db-tools pg_dump \
    --format=custom --no-owner --no-acl > "$backup_partial"
test -s "$backup_partial"
compose --profile tools run --rm -T db-tools pg_restore --list < "$backup_partial" >/dev/null
backup_final="${backup_partial%.partial}.dump"
mv -- "$backup_partial" "$backup_final"
printf 'Backup concluido: %s\n' "$backup_final"
