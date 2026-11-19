#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=deploy/common.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/common.sh"
if [[ $# -ne 2 || "$2" != --confirm-restore || ! -f "$1" ]]; then
    printf '%s\n' 'Uso: bash deploy/restore.sh caminho/backup.dump --confirm-restore' >&2
    exit 2
fi
restore_file="$(realpath -- "$1")"
current_release
iam_token
trap 'unset PGPASSWORD' EXIT
compose --profile tools run --rm -T db-tools pg_restore --list < "$restore_file" >/dev/null
# Preserva o estado anterior antes de interromper a aplicacao.
bash "$DEPLOY_ROOT/deploy/backup.sh"
iam_token
compose stop gateway frontend backend
# PGDATABASE deve ser expandida pelo shell do container, nao pelo shell do host.
# shellcheck disable=SC2016
if ! compose --profile tools run --rm -T db-tools sh -c \
    'exec pg_restore --dbname="$PGDATABASE" --clean --if-exists --no-owner --no-acl --single-transaction --exit-on-error' < "$restore_file"; then
    printf '%s\n' 'Restauracao falhou; transacao revertida. Aplicacao permanece parada para verificacao.' >&2
    exit 1
fi
compose up -d --wait --wait-timeout 240
printf '%s\n' 'Banco restaurado e containers iniciados. Valide o acesso publico e os dados.'
