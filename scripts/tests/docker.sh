#!/usr/bin/env bash
# Destructive cleanup is restricted to a new installation on a GitHub-hosted runner.
set -Eeuo pipefail
[[ ${GITHUB_ACTIONS:-false} == true && ${GITHUB_SHA:-} =~ ^[0-9a-f]{40}$ ]] ||
  { printf 'This integration test runs only in GitHub Actions.\n' >&2; exit 1; }
WORK=$(mktemp -d /tmp/hy2-docker-test.XXXXXX)
ROOT=$WORK/install
cleanup() {
  local result=$?
  if [[ $(sudo docker volume inspect --format '{{index .Labels "io.hy2-panel.install-dir"}}' hy2-panel_panel-data 2>/dev/null || true) == "$ROOT" ]]; then
    if [[ $result != 0 ]]; then sudo docker ps -a; sudo docker logs hy2-panel-panel-1 || true; fi
    local sha
    sha=$(sudo cat "$ROOT/current" 2>/dev/null || true)
    if [[ $sha =~ ^[0-9a-f]{40}$ ]]; then
      sudo env PANEL_IMAGE="hy2-panel:$sha" PANEL_CERTS_DIR="$ROOT/certs" PANEL_INSTALL_DIR="$ROOT" \
        docker compose -p hy2-panel --env-file "$ROOT/.env" -f "$ROOT/releases/$sha/compose.yaml" down -v
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
url=http://127.0.0.1:19080
curl -fsS "$url/" | grep -q '<html'
curl -fsS -c "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data '{"username":"admin","password":"integration-test-password-only"}' "$url/api/login" >/dev/null
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -days 1 \
  -subj /CN=localhost -addext subjectAltName=DNS:localhost \
  -keyout "$WORK/server.key" -out "$WORK/server.crt" 2>/dev/null
sudo cp "$WORK/server.key" "$WORK/server.crt" "$ROOT/certs/"
# Disposable self-signed test fixture, readable by the non-root container.
sudo chmod 644 "$ROOT/certs/server.key" "$ROOT/certs/server.crt"
jq -n --arg config 'listen: 127.0.0.1:0
tls:
  cert: /certs/server.crt
  key: /certs/server.key
' '{host:"localhost",port:"8443",sni:"localhost",config:$config}' >"$WORK/settings.json"
curl -fsS -b "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  -X PUT --data-binary "@$WORK/settings.json" "$url/api/settings" >/dev/null
curl -fsS -b "$WORK/cookies" -H 'X-Panel-Request: 1' -X POST "$url/api/core/start" >/dev/null
manager restart
# Sessions intentionally expire on restart; sign in again.
curl -fsS -c "$WORK/cookies" -H 'Content-Type: application/json' -H 'X-Panel-Request: 1' \
  --data '{"username":"admin","password":"integration-test-password-only"}' "$url/api/login" >/dev/null
core_running=false
for ((attempt=0; attempt<45; attempt++)); do
  if curl -fsS -b "$WORK/cookies" "$url/api/core" | jq -e '.running == true and .watchdog.desiredRunning == true' >/dev/null; then
    core_running=true; break
  fi
  sleep 1
done
[[ $core_running == true ]] || { printf 'Core did not resume after panel restart.\n' >&2; exit 1; }
manager backup
snapshot=$(sudo find "$ROOT/backups" -name data.tar.gz -print -quit)
sudo tar -tzf "$snapshot" | grep -q './secrets/users.key'
manager update "$GITHUB_SHA"
manager status
printf 'Docker installation, core autostart and consistent backup passed.\n'
