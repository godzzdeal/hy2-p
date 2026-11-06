#!/usr/bin/env bash
# Destructive cleanup is restricted to a new installation on a GitHub-hosted runner.
set -Eeuo pipefail
[[ ${GITHUB_ACTIONS:-false} == true && ${GITHUB_SHA:-} =~ ^[0-9a-f]{40}$ ]] ||
  { printf 'This integration test runs only in GitHub Actions.\n' >&2; exit 1; }
WORK=$(mktemp -d /tmp/hy2-docker-test.XXXXXX)
ROOT=$WORK/install
cleanup() {
  local result=$?
  if [[ -n ${BLOCKER:-} ]]; then kill "$BLOCKER" 2>/dev/null || true; wait "$BLOCKER" 2>/dev/null || true; fi
  if [[ -n ${CLIENT_CONTAINER:-} ]]; then sudo docker rm -f "$CLIENT_CONTAINER" >/dev/null 2>&1 || true; fi
  if [[ $(sudo docker volume inspect --format '{{index .Labels "io.hy2-panel.install-dir"}}' hy2-panel_panel-data 2>/dev/null || true) == "$ROOT" ]]; then
    if [[ $result != 0 ]]; then sudo docker ps -a; sudo docker logs hy2-panel-panel-1 || true; sudo docker logs hy2-panel-port-agent-1 || true; fi
    local sha
    sha=$(sudo cat "$ROOT/current" 2>/dev/null || true)
    if [[ $sha =~ ^[0-9a-f]{40}$ ]]; then
      sudo env PANEL_IMAGE="hy2-panel:$sha" PANEL_CERTS_DIR="$ROOT/certs" PANEL_INSTALL_DIR="$ROOT" \
        docker compose -p hy2-panel --env-file "$ROOT/.env" -f "$ROOT/releases/$sha/compose.yaml" -f "$ROOT/releases/$sha/compose.managed.yaml" down -v
    fi
  fi
  if [[ -L /usr/local/bin/hy2-panel && $(readlink /usr/local/bin/hy2-panel) == "$ROOT/hy2-panel" ]]; then
    sudo rm -- /usr/local/bin/hy2-panel
  fi
  [[ $WORK == /tmp/hy2-docker-test.* ]] && sudo rm -rf -- "$WORK"
  return "$result"
}
trap cleanup EXIT
[[ ! -e /usr/local/bin/hy2-panel ]] || { printf 'Existing installation found.\n' >&2; exit 1; }
if sudo docker volume inspect hy2-panel_panel-data >/dev/null 2>&1; then
  printf 'Existing application volume found.\n' >&2; exit 1
fi
sudo env HY2_ADMIN_PASSWORD=integration-test-password-only \
  bash scripts/install.sh --version "$GITHUB_SHA" --directory "$ROOT" --port 19080 --yes
manager() { sudo "$ROOT/hy2-panel" "$@"; }
manager status
URL=http://127.0.0.1:19080
curl -fsS "$URL/" | grep -q '<html'
curl -fsS "$URL/api/version" | jq -e --arg commit "$GITHUB_SHA" --arg version "$(cat internal/buildinfo/VERSION)" \
  '.revision == $commit and .version == $version' >/dev/null
# shellcheck source=/dev/null
source "$(dirname -- "${BASH_SOURCE[0]}")/hysteria/core.sh"
# shellcheck source=/dev/null
source "$(dirname -- "${BASH_SOURCE[0]}")/hysteria/ports.sh"
# shellcheck source=/dev/null
source "$(dirname -- "${BASH_SOURCE[0]}")/hysteria/instances.sh"
manager backup
snapshot=$(sudo find "$ROOT/backups" -name data.tar.gz -print -quit)
sudo tar -tzf "$snapshot" | grep -q './secrets/users.key'
manager update "$GITHUB_SHA"
manager status
printf 'Docker installation, core autostart and consistent backup passed.\n'

# shellcheck source=/dev/null
source "$(dirname -- "${BASH_SOURCE[0]}")/acme.sh"
test_acme_gateway
