#!/usr/bin/env bash
set -euo pipefail
DEPLOY_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DEPLOY_ROOT"
ENV_FILE="${ENV_FILE:-$DEPLOY_ROOT/.env.production}"
compose() { docker compose --env-file "$ENV_FILE" -f "$DEPLOY_ROOT/docker-compose.prod.yml" "$@"; }
require_config() {
    test -f "$ENV_FILE" || { printf '%s\n' 'Falta .env.production. Consulte deploy/.env.example.' >&2; return 1; }
    test -s "$DEPLOY_ROOT/deploy/certs/AmazonRootCA1.pem" || { printf '%s\n' 'Falta a CA publica do RDS. Consulte docs/deploy-aws.md.' >&2; return 1; }
    compose config --quiet
}
iam_token() {
    require_config
    command -v aws >/dev/null
    command -v python3 >/dev/null
    # O JSON completo fica somente no pipe; imprime apenas host, usuario e regiao.
    mapfile -t db_settings < <(compose --profile tools config --format json | python3 -c '
import json, sys
env = json.load(sys.stdin)["services"]
print(env["db-tools"]["environment"]["PGHOST"])
print(env["db-tools"]["environment"]["PGUSER"])
print(env["backend"]["environment"]["AWS_REGION"])
')
    test "${#db_settings[@]}" -eq 3
    PGPASSWORD="$(aws rds generate-db-auth-token --hostname "${db_settings[0]}" \
        --port 5432 --username "${db_settings[1]}" --region "${db_settings[2]}")"
    test -n "$PGPASSWORD"
    export PGPASSWORD
}
current_release() {
    # Sem tag explicita, recupere a imagem realmente implantada pelos labels Compose.
    # Nao dependa de export feito por outro processo nem do default :local.
    if [[ -z "${RELEASE_TAG:-}" ]]; then
        require_config
        local container image
        container="$(compose ps --all --quiet backend)"
        if [[ -z "$container" || "$container" == *$'\n'* ]]; then
            printf '%s\n' 'Nao foi possivel identificar uma unica API. Informe RELEASE_TAG explicitamente.' >&2
            return 1
        fi
        image="$(docker inspect --format '{{.Config.Image}}' "$container")"
        [[ "$image" == obracerta-api:* ]] || { printf '%s\n' 'Imagem inesperada da API; informe RELEASE_TAG.' >&2; return 1; }
        RELEASE_TAG="${image#obracerta-api:}"
        export RELEASE_TAG
    fi
    docker image inspect "obracerta-api:$RELEASE_TAG" "obracerta-web:$RELEASE_TAG" >/dev/null
}
