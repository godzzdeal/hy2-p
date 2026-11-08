#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
ROOT=${HY2_INSTALL_DIR:-/opt/hy2-panel}
[[ $EUID == 0 && $ROOT =~ ^/[a-zA-Z0-9/_.-]+$ && $ROOT != / && $ROOT != /opt && $ROOT != /tmp ]] || exit 1
[[ $(readlink -m -- "$ROOT") == "$ROOT" && ! -L $ROOT && -f $ROOT/.env ]] || exit 1
[[ -x /usr/sbin/ufw ]] || { printf 'Сначала установите UFW: sudo apt-get install ufw\n' >&2; exit 1; }
command -v python3 >/dev/null
command -v systemctl >/dev/null
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
mkdir -p "$ROOT/firewall"
chmod 700 "$ROOT/firewall"
install -m 600 "$SCRIPT_DIR/handler.py" "$SCRIPT_DIR/server.py" "$ROOT/firewall/"
/usr/sbin/sshd -T | awk '$1=="port" {print $2}' | jq -s 'map(tonumber) + [22]' >"$ROOT/firewall/protected.json"
[[ $(jq length "$ROOT/firewall/protected.json") -gt 1 ]] || exit 1
cat >/etc/systemd/system/hy2-panel-firewall.service <<EOF
[Unit]
Description=HY2-P UFW port rules helper
After=network.target
[Service]
Type=simple
Environment=HY2_INSTALL_DIR=$ROOT
ExecStart=/usr/bin/python3 $ROOT/firewall/server.py
Restart=on-failure
UMask=0077
NoNewPrivileges=true
ProtectHome=true
ReadWritePaths=$ROOT/firewall
PrivateTmp=true
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_RAW
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable hy2-panel-firewall.service
systemctl restart hy2-panel-firewall.service
printf 'Помощник установлен. UFW и существующие правила не изменены.\n'
