#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
ROOT=${HY2_INSTALL_DIR:-/opt/hy2-panel}
[[ $EUID == 0 && $ROOT =~ ^/[a-zA-Z0-9/_.-]+$ && $ROOT != / && $ROOT != /opt && $ROOT != /tmp ]] || exit 1
[[ $(readlink -m -- "$ROOT") == "$ROOT" && ! -L $ROOT && -f $ROOT/.env ]] || exit 1
[[ -x /usr/sbin/ufw ]] || { printf 'Сначала установите UFW: sudo apt-get install ufw\n' >&2; exit 1; }
command -v systemctl >/dev/null
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=/dev/null
source "$SCRIPT_DIR/server/common.sh"
current=$(cat "$ROOT/current")
valid_sha "$current" || die "Повреждён файл текущей версии."
container=$(compose "$current" ps -q panel)
[[ $container =~ ^[a-f0-9]{12,64}$ ]] || die "Сначала запустите панель."
mkdir -p "$ROOT/firewall"
chmod 700 "$ROOT/firewall"
temporary=$(mktemp "$ROOT/firewall/.agent.XXXXXX")
trap 'rm -f -- "$temporary"' EXIT
engine cp "$container:/usr/local/bin/firewall-agent" "$temporary"
chmod 700 "$temporary"
mv -f -- "$temporary" "$ROOT/firewall/agent"
{
  /usr/sbin/sshd -T | awk '$1=="port" {print $2}'
  ss -H -ltnp | awk '/sshd/ {port=$4; sub(/^.*:/,"",port); if (port ~ /^[0-9]+$/) print port}'
  printf '22\n'
} | jq -s 'map(tonumber) | unique' >"$ROOT/firewall/protected.json"
[[ $(jq length "$ROOT/firewall/protected.json") -gt 0 ]] || exit 1
cat >/etc/systemd/system/hy2-panel-firewall.service <<EOF
[Unit]
Description=HY2-P UFW port rules helper
After=network.target
[Service]
Type=simple
Environment=HY2_INSTALL_DIR=$ROOT
ExecStart=$ROOT/firewall/agent
Restart=on-failure
UMask=0077
NoNewPrivileges=true
ProtectHome=true
ReadWritePaths=$ROOT/firewall
PrivateTmp=true
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_RAW
MemoryMax=128M
TasksMax=32
CPUQuota=50%
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable hy2-panel-firewall.service
systemctl restart hy2-panel-firewall.service
rm -f -- "$ROOT/firewall/handler.py" "$ROOT/firewall/server.py"
printf 'Помощник установлен. UFW и существующие правила не изменены.\n'
