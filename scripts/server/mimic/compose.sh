#!/usr/bin/env bash
mimic_ports() {
  mimic_instance=${1:-$(env_read PANEL_MIMIC_INSTANCE)}
  [[ $mimic_instance =~ ^(default|[a-f0-9]{16})$ ]] || return 1
  if [[ $mimic_instance == default ]]; then
    mimic_public=$(env_read HYSTERIA_PUBLIC_PORT); mimic_target=$(env_read HYSTERIA_LISTEN_PORT)
  else
    mimic_public=$(jq -er --arg id "$mimic_instance" '.[$id].publicPort' "$ROOT/extra-udp.json") || return 1
    mimic_target=$(jq -er --arg id "$mimic_instance" '.[$id].listenPort' "$ROOT/extra-udp.json") || return 1
  fi
  [[ $mimic_public =~ ^[1-9][0-9]{0,4}$ && $mimic_public -le 65535 && $mimic_target =~ ^[1-9][0-9]{0,4}$ && $mimic_target -le 65535 ]]
}

mimic_profile() {
  cat <<'EOF'
{"services":{"panel":{"user":"0:0","cap_drop":["ALL"],"cap_add":["DAC_OVERRIDE","NET_ADMIN","NET_RAW","BPF","PERFMON"],"ulimits":{"memlock":{"soft":-1,"hard":-1}},"environment":{"PANEL_MIMIC_ENABLED":"true","PANEL_MIMIC_INSTANCE":"${PANEL_MIMIC_INSTANCE}"},"ports":[{"target":"${MIMIC_LISTEN_PORT}","published":"${MIMIC_PUBLIC_PORT}","protocol":"tcp"}]}}}
EOF
}

mimic_release_supported() {
  [[ $(env_read PANEL_MIMIC_ENABLED) != true || -f $ROOT/releases/$1/scripts/server/mimic/setup.sh ]] ||
    die "Выбранная версия не поддерживает режим Mimic. Сначала отключите Mimic: sudo hy2-panel mimic-setup --disable"
}

normalize_mimic_ownership() {
  check_volume
  engine run --rm --network none --user 0:0 --cap-drop ALL --cap-add CHOWN --cap-add DAC_READ_SEARCH \
    --security-opt no-new-privileges --entrypoint chown --mount "type=volume,source=$VOLUME,target=/data" \
    "$(image_for "$1")" -Rh 10001:10001 /data
}
