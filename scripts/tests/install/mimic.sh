#!/usr/bin/env bash
test_mimic_installation() (
  setup_case mimic-install
  source "$TEST_SOURCE/server/mimic/setup.sh"
  mkdir -p "$ROOT/releases/$OLD/scripts/server/mimic"
  touch "$ROOT/releases/$OLD/scripts/server/mimic/setup.sh"
  env_set HYSTERIA_PUBLIC_PORT 8443; env_set HYSTERIA_LISTEN_PORT 8443
  install_mimic_module() { printf 'module-install\n' >>"$ROOT/mimic-events"; }
  mimic_autoload() { printf 'autoload %s\n' "$1" >>"$ROOT/mimic-events"; }
  normalize_mimic_ownership() { printf 'ownership\n' >>"$ROOT/mimic-events"; }
  start_release() {
    if [[ -f $ROOT/fail-next ]]; then rm -- "$ROOT/fail-next"; return 1; fi
    printf 'start\n' >>"$ROOT/mimic-events"
  }
  setup_mimic "$OLD" --dry-run
  [[ ! -e $ROOT/mimic-events ]]
  setup_mimic "$OLD" <<<n
  [[ ! -e $ROOT/mimic-events ]]
  setup_mimic "$OLD" --yes
  [[ $(env_read PANEL_MIMIC_ENABLED) == true && $(env_read PANEL_MIMIC_INSTANCE) == default ]]
  jq -e '.services.panel | .user=="0:0" and .cap_drop==["ALL"] and (.cap_add|index("SYS_ADMIN")|not)' "$ROOT/compose-mimic.json" >/dev/null
  setup_mimic "$OLD" --disable --yes
  [[ $(env_read PANEL_MIMIC_ENABLED) == false ]]
  grep -q '^ownership' "$ROOT/mimic-events"
  touch "$ROOT/fail-next"
  if setup_mimic "$OLD" --yes; then printf 'Failed Mimic activation accepted\n' >&2; exit 1; fi
  [[ $(env_read PANEL_MIMIC_ENABLED) == false ]]
  [[ -z $(find "$ROOT" -maxdepth 1 -name '.mimic-environment.*') ]]
  if (setup_mimic "$OLD" --instance invalid --yes); then exit 1; fi
  apt-get() { if [[ $1 == -s ]]; then printf 'Purg mimic-dkms [0.7.1]\n'; else printf 'purge\n' >>"$ROOT/mimic-events"; fi; }
  uninstall_mimic "$OLD" --yes
  [[ ! -e $ROOT/compose-mimic.json ]]
  ! grep -q '^purge' "$ROOT/mimic-events"
  printf '0.7.1\n' >"$ROOT/mimic-module-owned"
  uninstall_mimic "$OLD" --yes
  grep -q '^purge' "$ROOT/mimic-events"
  [[ ! -e $ROOT/mimic-module-owned ]]
  log 'Mimic setup, cancellation, disable and rollback tests passed.'
)
test_mimic_installation
