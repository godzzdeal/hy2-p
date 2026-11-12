#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
WORK=$(mktemp -d /tmp/hy2-uninstall-test.XXXXXX)
cleanup() { [[ $WORK == /tmp/hy2-uninstall-test.* ]] && rm -rf -- "$WORK"; }
trap cleanup EXIT
# shellcheck source=fixtures.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/fixtures.sh"

setup_uninstall preview
uninstall_panel --dry-run
[[ -f $ROOT/.env ]]
! grep -Eq '^(container (stop|rm)|volume rm|network rm|image rm|host-remove)' "$EVENTS"

for answer in no n '' anything; do
  setup_uninstall "cancel-${answer:-empty}"
  uninstall_panel <<<"$answer"
  [[ -f $ROOT/backups/backup.tar.gz ]]
  ! grep -q '^container stop' "$EVENTS"
done
setup_uninstall eof
uninstall_panel </dev/null
[[ -f $ROOT/.env ]]

setup_uninstall remove
printf '{}\n' >"$ROOT/update.pending"
printf '{}\n' >"$ROOT/udp.pending"
uninstall_panel --yes
[[ ! -e $ROOT ]]
jq -e --arg id "$FOREIGN_ID" '.containers|length==1 and .[0].Id==$id and .[0].State.Status=="running"' "$STATE" >/dev/null
jq -e '.volumes==[{Name:"foreign-data",Labels:{}}] and .networks==[] and .images==[]' "$STATE" >/dev/null
! grep -Eq '(prune|--force|ufw|system rm)' "$EVENTS"

setup_uninstall shared-image
change_state --arg image "$IMAGE_ID" '.containers[2].Image=$image | .networks[0].Containers={foreign:{}}'
uninstall_panel <<<y
[[ ! -e $ROOT ]]
jq -e '.images|length==1' "$STATE" >/dev/null
jq -e '.networks|length==1' "$STATE" >/dev/null

setup_uninstall shared-tag
change_state '.images[0].RepoTags += ["another-app:shared"]'
uninstall_panel --yes
jq -e '.images[0].RepoTags | index("another-app:shared")!=null' "$STATE" >/dev/null

setup_uninstall shared-volume
change_state '.containers[2].Mounts=[{Name:"hy2-panel_panel-data"}]'
if (uninstall_panel --yes); then printf 'Shared data volume deletion allowed\n' >&2; exit 1; fi
[[ -f $ROOT/.env ]]
! grep -q '^container stop' "$EVENTS"

setup_uninstall foreign-volume
change_state '.volumes[0].Labels["io.hy2-panel.install-dir"]="/opt/another-install"'
if (uninstall_panel --yes); then printf 'Foreign installation deletion allowed\n' >&2; exit 1; fi
[[ -f $ROOT/.env ]]

setup_uninstall failure
export REMOVE_FAIL=true
if (uninstall_panel --yes); then printf 'Removal failure ignored\n' >&2; exit 1; fi
[[ -f $ROOT/current && -f $ROOT/backups/backup.tar.gz ]]
! grep -q '^host-remove' "$EVENTS"
export REMOVE_FAIL=false
uninstall_panel --yes
[[ ! -e $ROOT ]]

setup_uninstall invalid-root
printf '../escape\n' >"$ROOT/current"
if (uninstall_panel --yes); then printf 'Invalid installation accepted\n' >&2; exit 1; fi
[[ -f $ROOT/.env ]]

setup_uninstall replaced-resource
uninstall_inventory
change_state '.volumes[0].Labels["io.hy2-panel.install-dir"]="/opt/foreign"'
if uninstall_docker; then printf 'Resource replaced after confirmation was removed\n' >&2; exit 1; fi
! grep -q '^container stop' "$EVENTS"

setup_uninstall docker-failure
engine() { return 1; }
if (uninstall_panel --yes); then printf 'Docker lookup failure ignored\n' >&2; exit 1; fi
[[ -f $ROOT/.env ]]

setup_uninstall helper
unit=$WORK/helper.service
printf 'Environment=HY2_INSTALL_DIR=%s\nExecStart=%s/firewall/agent\n' "$ROOT" "$ROOT" >"$unit"
uninstall_unit_owned "$unit"
ln -s "$unit" "$unit.link"
! uninstall_unit_owned "$unit.link"
printf 'Environment=HY2_INSTALL_DIR=/opt/foreign\nExecStart=/opt/foreign/firewall/agent\n' >"$unit"
! uninstall_unit_owned "$unit"

printf 'Uninstall ownership, cancellation, shared resources and recovery tests passed.\n'
