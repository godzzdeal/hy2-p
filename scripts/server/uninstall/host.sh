#!/usr/bin/env bash
uninstall_unit_owned() {
  [[ -f $1 && ! -L $1 ]] && grep -Fxq "Environment=HY2_INSTALL_DIR=$ROOT" "$1" &&
    grep -Fxq "ExecStart=$ROOT/firewall/agent" "$1"
}

uninstall_host_check() {
  local unit=/etc/systemd/system/hy2-panel-firewall.service
  UNINSTALL_HELPER=false
  if uninstall_unit_owned "$unit"; then
    command -v systemctl >/dev/null || die "Не найден systemctl для удаления помощника. Ничего не удалено."
    UNINSTALL_HELPER=true
  fi
}

uninstall_host_remove() {
  local unit=/etc/systemd/system/hy2-panel-firewall.service launcher=/usr/local/bin/hy2-panel
  if [[ $UNINSTALL_HELPER == true ]]; then
    # Do not stop or unlink a unit that was replaced after the confirmation.
    uninstall_unit_owned "$unit" || return 1
    systemctl disable --now hy2-panel-firewall.service || return 1
    rm -- "$unit" || return 1
    systemctl daemon-reload || return 1
    systemctl reset-failed hy2-panel-firewall.service 2>/dev/null || true
  fi
  if [[ -L $launcher && $(readlink -- "$launcher") == "$ROOT/hy2-panel" ]]; then
    rm -- "$launcher" || return 1
  fi
  local module=/etc/modules-load.d/hy2-panel-mimic.conf
  if [[ -f $module && ! -L $module ]] && grep -Fxq "# HY2-P $ROOT" "$module"; then rm -- "$module" || return 1; fi
}
