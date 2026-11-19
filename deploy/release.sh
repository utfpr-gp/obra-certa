#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=deploy/common.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/common.sh"
if [[ $# -lt 1 || $# -gt 2 || ! "$1" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,127}$ || ( $# -eq 2 && "$2" != --build ) ]]; then
    printf '%s\n' 'Uso: bash deploy/release.sh tag [--build]. Sem --build, usa imagens ja carregadas.' >&2
    exit 2
fi
export RELEASE_TAG="$1"
require_config
if [[ "${2:-}" == --build ]]; then
    # Sequencial para reduzir o pico de memoria. Prefira imagens prontas na t3.micro.
    compose build backend
    compose build frontend
fi
docker image inspect "obracerta-api:$RELEASE_TAG" "obracerta-web:$RELEASE_TAG" >/dev/null
compose --profile tools run --rm --no-deps -T --entrypoint caddy gateway validate --config /etc/caddy/Caddyfile
# Aplica tambem na primeira publicacao, com banco dedicado ja criado e vazio.
bash "$DEPLOY_ROOT/deploy/backup.sh"
compose up -d --no-build --wait --wait-timeout 240
printf 'Containers da versao %s iniciados. Verifique HTTPS, login e os fluxos do roteiro.\n' "$RELEASE_TAG"
