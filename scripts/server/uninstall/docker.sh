#!/usr/bin/env bash
uninstall_inventory() {
  local identifiers metadata candidates identifier sha reference resource kind owner project users resources
  UNINSTALL_CONTAINERS='' UNINSTALL_VOLUMES='' UNINSTALL_NETWORKS='' UNINSTALL_IMAGES=''
  declare -gA UNINSTALL_RESOURCE_FINGERPRINTS=()
  UNINSTALL_LABEL=$(printf '%s' "$ROOT" | sha256sum); UNINSTALL_LABEL=${UNINSTALL_LABEL%% *}
  check_volume
  identifiers=$(engine ps -aq --no-trunc) || return 1
  metadata='[]'
  if [[ -n $identifiers ]]; then
    local -a containers
    read -r -a containers <<<"${identifiers//$'\n'/ }"
    metadata=$(engine container inspect "${containers[@]}") || return 1
  fi
  UNINSTALL_CONTAINERS=$(jq -r --arg root "$ROOT" --arg label "$UNINSTALL_LABEL" \
    '[.[] | select(.Config.Labels["io.hy2-panel.install-dir"]==$root or .Config.Labels["io.hy2-panel.maintenance"]==$label)] |
     sort_by(if .Config.Labels["com.docker.compose.service"]=="port-agent" then 0 else 1 end) | .[].Id' <<<"$metadata") || return 1
  for kind in volume network; do
    resources=$(engine "$kind" ls --format '{{.Name}}') || return 1
    candidates=$(engine "$kind" ls --format '{{.Name}}' --filter "label=io.hy2-panel.install-dir=$ROOT") || return 1
    if [[ $kind == volume ]]; then candidates+=$'\n'"${PROJECT}_panel-data"$'\n'"${PROJECT}_port-agent-socket"
    else candidates+=$'\n'"${PROJECT}_default"; fi
    while read -r resource; do
      [[ -n $resource ]] || continue
      grep -Fxq "$resource" <<<"$resources" || continue
      owner=$(engine "$kind" inspect "$resource") || return 1
      UNINSTALL_RESOURCE_FINGERPRINTS["$kind:$resource"]=$(uninstall_resource_fingerprint <<<"$owner") || return 1
      project=$(jq -r '.[0].Labels["com.docker.compose.project"] // ""' <<<"$owner") || return 1
      owner=$(jq -r '.[0].Labels["io.hy2-panel.install-dir"] // ""' <<<"$owner") || return 1
      [[ $owner == "$ROOT" || ( -z $owner && $project == "$PROJECT" ) ]] || continue
      if [[ $kind == volume ]]; then
        users=$(engine ps -aq --no-trunc --filter "volume=$resource") || return 1
        for identifier in $users; do
          grep -Fxq "$identifier" <<<"$UNINSTALL_CONTAINERS" ||
            die "Том $resource используется другим контейнером ($identifier). Ничего не удалено."
        done
        UNINSTALL_VOLUMES+="$resource"$'\n'
      else UNINSTALL_NETWORKS+="$resource"$'\n'; fi
    done < <(sort -u <<<"$candidates")
  done
  candidates=$(engine image ls --no-trunc --filter label=io.hy2-panel.commit --format '{{.ID}}' | sort -u) || return 1
  for identifier in $candidates; do
    metadata=$(engine image inspect "$identifier") || return 1
    sha=$(jq -r '.[0].Config.Labels["io.hy2-panel.commit"] // ""' <<<"$metadata") || return 1
    valid_sha "$sha" && [[ -d $ROOT/releases/$sha ]] || continue
    users=$(engine ps -aq --no-trunc --filter "ancestor=$identifier") || return 1
    for reference in $users; do
      if ! grep -Fxq "$reference" <<<"$UNINSTALL_CONTAINERS"; then
        log "Образ $identifier сохранится: его использует другой контейнер."
        continue 2
      fi
    done
    reference=$(jq -r --arg tag "hy2-panel:$sha" \
      '.[0] | select((.RepoTags // [] | length)==0 or .RepoTags==[$tag]) | .Id' <<<"$metadata") || return 1
    if [[ -n $reference ]]; then UNINSTALL_IMAGES+="$reference"$'\n'
    else log "Образ $identifier сохранится: у него есть сторонние теги."; fi
  done
}

uninstall_resource_fingerprint() {
  jq -Sc '.[0] | {Name,Id,CreatedAt,Created,Labels,Driver,Options}' | sha256sum
}

uninstall_resource_unchanged() {
  local fingerprint
  fingerprint=$(engine "$1" inspect "$2" | uninstall_resource_fingerprint) || return 1
  [[ $fingerprint == "${UNINSTALL_RESOURCE_FINGERPRINTS["$1:$2"]}" ]] || {
    log "Ресурс $2 изменился после проверки. Повторите удаление."
    return 1
  }
}

uninstall_owned_container() {
  engine container inspect "$1" | jq -e --arg root "$ROOT" --arg label "$UNINSTALL_LABEL" \
    'length==1 and (.[0].Config.Labels["io.hy2-panel.install-dir"]==$root or .[0].Config.Labels["io.hy2-panel.maintenance"]==$label)' >/dev/null
}

uninstall_docker() {
  local resource users
  # Inventory orders the deployment agent first; stop all services gracefully without forced removal.
  for resource in $UNINSTALL_CONTAINERS; do
    uninstall_owned_container "$resource" || return 1
  done
  for resource in $UNINSTALL_VOLUMES; do uninstall_resource_unchanged volume "$resource" || return 1; done
  for resource in $UNINSTALL_NETWORKS; do uninstall_resource_unchanged network "$resource" || return 1; done
  if [[ -n $UNINSTALL_CONTAINERS ]]; then
    local -a containers
    read -r -a containers <<<"${UNINSTALL_CONTAINERS//$'\n'/ }"
    engine container stop --time 30 "${containers[0]}" || return 1
    engine container stop --time 30 "${containers[@]}" || return 1
    engine container rm "${containers[@]}" || return 1
  fi
  for resource in $UNINSTALL_VOLUMES; do
    uninstall_resource_unchanged volume "$resource" && engine volume rm "$resource" || return 1
  done
  for resource in $UNINSTALL_NETWORKS; do
    uninstall_resource_unchanged network "$resource" || return 1
    users=$(engine network inspect --format '{{len .Containers}}' "$resource") || return 1
    if [[ $users != 0 ]]; then log "Сеть $resource сохранена: её использует другое приложение."
    else engine network rm "$resource" || return 1; fi
  done
  for resource in $UNINSTALL_IMAGES; do
    users=$(engine ps -aq --no-trunc --filter "ancestor=$resource") || return 1
    if [[ -n $users ]]; then log "Образ $resource сохранён: его использует другой контейнер."
    else engine image rm "$resource" || return 1; fi
  done
  users=$(engine ps -aq --no-trunc --filter "label=io.hy2-panel.install-dir=$ROOT") || return 1
  [[ -z $users ]] || { log 'После проверки появился новый контейнер HY2-P. Повторите удаление.'; return 1; }
}
