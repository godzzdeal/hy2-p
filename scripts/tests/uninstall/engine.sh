#!/usr/bin/env bash
uninstall_engine() {
  local kind=$1 action=$2 resource=${!#} ids value
  printf '%s\n' "$*" >>"$EVENTS"
  case "$kind $action" in
    'ps -aq')
      value=$(case $resource in
        ancestor=*) value=${resource#ancestor=}
          jq -r --arg reference "$value" '. as $state | [.images[] | select(.Id==$reference or any(.RepoTags[]; .==$reference)) | .Id] as $images |
            $state.containers[] | select(.Image==$reference or (.Image as $id | $images | index($id))) | .Id' "$STATE" ;;
        volume=*) jq -r --arg name "${resource#volume=}" '.containers[]|select(any(.Mounts[]; .Name==$name))|.Id' "$STATE" ;;
        label=*) jq -r --arg root "${resource#label=io.hy2-panel.install-dir=}" '.containers[]|select(.Config.Labels["io.hy2-panel.install-dir"]==$root)|.Id' "$STATE" ;;
        *) jq -r '.containers[].Id' "$STATE" ;;
      esac) || return 1
      if [[ " $* " == *' --no-trunc '* ]]; then printf '%s\n' "$value"
      else jq -Rr '.[0:12]' <<<"$value"; fi ;;
    'container inspect')
      shift 2; ids=$(printf '%s\n' "$@" | jq -R . | jq -s .)
      jq --argjson ids "$ids" '[.containers[]|select(.Id as $id | $ids|index($id))]' "$STATE" ;;
    'container stop')
      [[ $3 == --time && $4 == 30 ]] || return 1
      shift 4; ids=$(printf '%s\n' "$@" | jq -R . | jq -s .)
      change_state --argjson ids "$ids" '.containers|=map(if (.Id as $id | $ids|index($id)) then .State.Status="exited" else . end)' ;;
    'container rm')
      [[ $REMOVE_FAIL != true ]] || return 1
      shift 2; ids=$(printf '%s\n' "$@" | jq -R . | jq -s .)
      change_state --argjson ids "$ids" '.containers|=map(select(.Id as $id | $ids|index($id)|not))' ;;
    'volume ls'|'network ls')
      if [[ $resource == label=* ]]; then
        jq -r --arg kind "${kind}s" --arg root "$ROOT" '.[$kind][]|select(.Labels["io.hy2-panel.install-dir"]==$root)|.Name' "$STATE"
      else jq -r --arg kind "${kind}s" '.[$kind][].Name' "$STATE"; fi ;;
    'volume inspect'|'network inspect')
      value=$(jq -ce --arg kind "${kind}s" --arg name "$resource" '[.[$kind][]|select(.Name==$name)] | select(length>0)' "$STATE") || return 1
      if [[ $3 == --format ]]; then
        if [[ $kind == volume ]]; then jq -r '.[0].Labels["io.hy2-panel.install-dir"] // ""' <<<"$value"
        else jq -r '.[0].Containers | length' <<<"$value"; fi
      else printf '%s\n' "$value"; fi ;;
    'volume rm'|'network rm') change_state --arg kind "${kind}s" --arg name "$resource" '.[$kind]|=map(select(.Name!=$name))' ;;
    'image ls') jq -r '.images[].Id' "$STATE" ;;
    'image inspect') jq -ce --arg id "$resource" '[.images[]|select(.Id==$id)] | select(length>0)' "$STATE" ;;
    'image rm') change_state --arg reference "$resource" '.images|=map(select(.Id!=$reference and all(.RepoTags[]; .!=$reference)))' ;;
    *) printf 'Unexpected Docker operation: %s\n' "$*" >&2; return 1 ;;
  esac
}
