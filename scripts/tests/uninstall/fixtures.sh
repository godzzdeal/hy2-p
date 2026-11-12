#!/usr/bin/env bash
SOURCE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
SHA=1111111111111111111111111111111111111111
PANEL_ID=$(printf 'a%.0s' {1..64})
WORKER_ID=$(printf 'b%.0s' {1..64})
FOREIGN_ID=$(printf 'c%.0s' {1..64})
AGENT_ID=$(printf 'd%.0s' {1..64})
IMAGE_ID=sha256:1111111111111111111111111111111111111111111111111111111111111111

setup_uninstall() {
  export HY2_INSTALL_DIR=$WORK/$1
  # shellcheck source=../../server/common.sh
  source "$SOURCE/server/common.sh"
  # shellcheck source=../../server/uninstall/index.sh
  source "$SOURCE/server/uninstall/index.sh"
  mkdir -p "$ROOT/releases/$SHA" "$ROOT/backups" "$ROOT/certs"
  printf '%s\n' "$SHA" >"$ROOT/current"
  printf 'services: {}\n' >"$ROOT/releases/$SHA/compose.yaml"
  printf 'secret\n' >"$ROOT/.env"
  printf 'backup\n' >"$ROOT/backups/backup.tar.gz"
  local label
  label=$(printf '%s' "$ROOT" | sha256sum); label=${label%% *}
  STATE=$WORK/$1.json
  EVENTS=$WORK/$1.events
  jq -n --arg root "$ROOT" --arg sha "$SHA" --arg image "$IMAGE_ID" --arg label "$label" \
    --arg panel "$PANEL_ID" --arg worker "$WORKER_ID" --arg foreign "$FOREIGN_ID" --arg agent "$AGENT_ID" '{
    containers:[
      {Id:$panel, Image:$image, Config:{Labels:{"io.hy2-panel.install-dir":$root}}, Mounts:[{Name:"hy2-panel_panel-data"}], State:{Status:"running"}},
      {Id:$worker, Image:$image, Config:{Labels:{"io.hy2-panel.maintenance":$label}}, Mounts:[], State:{Status:"exited"}},
      {Id:$foreign, Image:"foreign-image", Config:{Labels:{}}, Mounts:[], State:{Status:"running"}},
      {Id:$agent, Image:$image, Config:{Labels:{"io.hy2-panel.install-dir":$root,"com.docker.compose.service":"port-agent"}}, Mounts:[{Name:"hy2-panel_panel-data"},{Name:"hy2-panel_port-agent-socket"}], State:{Status:"running"}}
    ],
    volumes:[
      {Name:"hy2-panel_panel-data", Labels:{"io.hy2-panel.install-dir":$root}},
      {Name:"hy2-panel_port-agent-socket", Labels:{"com.docker.compose.project":"hy2-panel"}},
      {Name:"foreign-data", Labels:{}}
    ],
    networks:[{Name:"hy2-panel_default", Labels:{"com.docker.compose.project":"hy2-panel"}, Containers:{}}],
    images:[{Id:$image, RepoTags:[("hy2-panel:"+$sha)], Config:{Labels:{"io.hy2-panel.commit":$sha}}}]
  }' >"$STATE"
  : >"$EVENTS"
  engine() { uninstall_engine "$@"; }
  export REMOVE_FAIL=false
  uninstall_host_check() { export UNINSTALL_HELPER=false; }
  uninstall_host_remove() { printf 'host-remove\n' >>"$EVENTS"; }
}

change_state() {
  jq "$@" "$STATE" >"$STATE.next" && mv -- "$STATE.next" "$STATE"
}

# shellcheck source=engine.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/engine.sh"
