#!/usr/bin/env bash
extra_udp() {
  if [[ -f $ROOT/extra-udp.json ]]; then cat "$ROOT/extra-udp.json"; else printf '{}\n'; fi
}
extra_udp_override() {
  extra_udp | jq '{services:{panel:{environment:{HYSTERIA_EXTRA_PORTS:tojson},ports:[
    to_entries[] | .value | {target:(.listenPort|tonumber),published:.publicPort,protocol:"udp"}
  ]}}}' >"$ROOT/.compose-udp.json"
  mv -- "$ROOT/.compose-udp.json" "$ROOT/compose-udp.json"
}
save_extra_udp() {
  local id=$1 public=$2 target=$3 remove=${4:-false}
  extra_udp | jq --arg id "$id" --arg public "$public" --arg target "$target" --argjson remove "$remove" \
    'if $remove then del(.[$id]) else .[$id]={publicPort:$public,listenPort:$target} end' >"$ROOT/.extra-udp.json" || return 1
  mv -- "$ROOT/.extra-udp.json" "$ROOT/extra-udp.json" && extra_udp_override
}
udp_metadata() {
  local identifier
  identifier=$(compose "$1" ps -q panel)
  [[ -n $identifier ]] || return 1
  engine exec "$identifier" wget -T 5 -q -O - "http://127.0.0.1:8081/deployment?instance=$2"
}
begin_udp() {
  cp -- "$ROOT/.env" "$ROOT/udp-environment" || return 1
  extra_udp >"$ROOT/udp-extra-backup.json" || return 1
  chmod 600 "$ROOT/udp-environment" "$ROOT/udp-extra-backup.json"
  jq -n --arg commit "$1" --arg id "$2" '{commit:$commit,id:$id}' >"$ROOT/.udp.pending" || return 1
  mv -- "$ROOT/.udp.pending" "$ROOT/udp.pending"
}
complete_udp() {
  printf '%s\n' "$1" >"$ROOT/.udp-completed" &&
    mv -- "$ROOT/.udp-completed" "$ROOT/udp-completed" &&
    rm -f -- "$ROOT/udp.pending" "$ROOT/udp-environment" "$ROOT/udp-extra-backup.json"
}
