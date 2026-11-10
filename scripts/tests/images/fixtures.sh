#!/usr/bin/env bash
SOURCE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
OLD=1111111111111111111111111111111111111111
NEW=2222222222222222222222222222222222222222
STALE=3333333333333333333333333333333333333333
FOREIGN=4444444444444444444444444444444444444444
setup_images() {
  export HY2_INSTALL_DIR=$WORK/$1
  # shellcheck source=../../server/common.sh
  source "$SOURCE/server/common.sh"
  # shellcheck source=../../server/releases/source/cleanup.sh
  source "$SOURCE/server/releases/source/cleanup.sh"
  # shellcheck source=../../server/releases/rollback.sh
  source "$SOURCE/server/releases/rollback.sh"
  mkdir -p "$ROOT/releases/"{"$OLD","$NEW","$STALE"}
  printf '%s\n' "$NEW" >"$ROOT/current"
  printf '%s\n' "$OLD" >"$ROOT/previous"
  printf '[]\n' >"$ROOT/containers.json"
  printf '{}\n' >"$ROOT/images.json"
  for sha in "$OLD" "$NEW" "$STALE" "$FOREIGN"; do
    mkdir -p "$ROOT/fixture/$sha"
    jq -n --arg sha "$sha" '{config:{Labels:{"io.hy2-panel.commit":$sha}}}' >"$ROOT/fixture/$sha/$sha"000000000000000000000000.json
    jq -n --arg tag "hy2-panel:$sha" --arg config "$sha"000000000000000000000000.json '[{RepoTags:[$tag],Config:$config}]' >"$ROOT/fixture/$sha/manifest.json"
    tar -C "$ROOT/fixture/$sha" -cf "$ROOT/fixture/$sha.tar" manifest.json "$sha"000000000000000000000000.json
    image_state "$sha" true
  done
  SAVE_FAIL=false
  engine() { image_engine "$@"; }
}
image_state() {
  jq --arg sha "$1" --argjson exists "$2" '.[$sha]=$exists' "$ROOT/images.json" >"$ROOT/images.next"
  mv "$ROOT/images.next" "$ROOT/images.json"
}
has_image() { jq -e --arg sha "$1" '.[$sha] == true' "$ROOT/images.json" >/dev/null; }
image_id() { printf 'sha256:%s000000000000000000000000\n' "$1"; }
image_engine() {
  local sha archive config identifier
  case "$1 $2" in
    'image inspect')
      sha=${!#}; sha=${sha#hy2-panel:}; sha=${sha#sha256:}; sha=${sha:0:40}
      has_image "$sha" || return 1
      printf '%s\n' "$sha" ;;
    'image save')
      [[ $SAVE_FAIL != true ]] || return 1
      sha=${3#hy2-panel:}; has_image "$sha" || return 1
      cat "$ROOT/fixture/$sha.tar" ;;
    'image ls')
      while read -r sha; do image_id "$sha"; done < <(jq -r 'to_entries[] | select(.value) | .key' "$ROOT/images.json") ;;
    'image rm')
      sha=${3#sha256:}; sha=${sha:0:40}
      [[ $(jq --arg image "$(image_id "$sha")" '[.[]|select(.Image==$image)]|length' "$ROOT/containers.json") == 0 ]] || return 1
      image_state "$sha" false
      printf 'remove-image %s\n' "$sha" >>"$ROOT/events" ;;
    'ps -aq')
      if [[ ${!#} == ancestor=* ]]; then
        jq -r --arg image "${!#}" '.[]|select(.Image==($image|ltrimstr("ancestor=")))|.Id' "$ROOT/containers.json"
      else jq -r '.[]|select(.State.Status=="exited" or .State.Status=="dead")|.Id' "$ROOT/containers.json"; fi ;;
    'container rm')
      identifier=$3
      jq -e --arg id "$identifier" '.[]|select(.Id==$id)|.State.Status != "running"' "$ROOT/containers.json" >/dev/null || return 1
      jq --arg id "$identifier" '[.[]|select(.Id!=$id)]' "$ROOT/containers.json" >"$ROOT/containers.next"
      mv "$ROOT/containers.next" "$ROOT/containers.json"
      printf 'remove-container %s\n' "$identifier" >>"$ROOT/events" ;;
    'load --input')
      archive=$3; config=$(tar -xzOf "$archive" manifest.json | jq -r '.[0].Config')
      sha=$(tar -xzOf "$archive" "$config" | jq -r '.config.Labels["io.hy2-panel.commit"]')
      image_state "$sha" true; printf 'load %s\n' "$sha" >>"$ROOT/events" ;;
    'inspect '*) jq --arg id "$2" '[.[]|select(.Id==$id)]' "$ROOT/containers.json" ;;
    'logs '*) printf 'saved diagnostic\n' ;;
    *) printf 'Unexpected Docker command: %s\n' "$*" >&2; return 1 ;;
  esac
}
add_container() {
  local id=$1 sha=$2 status=$3 label=$4 value=$5
  jq --arg id "$id" --arg image "$(image_id "$sha")" --arg status "$status" --arg label "$label" --arg value "$value" \
    '.+[{Id:$id,Image:$image,State:{Status:$status},Config:{Labels:{($label):$value}}}]' "$ROOT/containers.json" >"$ROOT/containers.next"
  mv "$ROOT/containers.next" "$ROOT/containers.json"
}
