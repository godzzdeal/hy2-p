#!/usr/bin/env bash
resolve_version() {
  local version=${1:-latest}
  if [[ $version == latest ]]; then
    version=$(curl --fail --show-error --silent --retry 3 --proto '=https' --tlsv1.2 \
      https://api.github.com/repos/godzzdeal/hy2-p/releases/latest | jq -er '.tag_name')
  fi
  [[ $version == main || $version =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ || $version =~ ^[0-9a-f]{40}$ ]] ||
    die "Версия должна быть latest, main, vX.Y.Z или полным SHA коммита."
  printf '%s\n' "$version"
}
fetch_release() {
  local version temporary sha destination
  version=$(resolve_version "${1:-latest}") || return 1
  mkdir -p -- "$ROOT/releases"
  temporary=$(mktemp -d "$ROOT/releases/.fetch.XXXXXX")
  log "Загружаем $version из $REPOSITORY"
  if ! (
    git init -q "$temporary" &&
    git -C "$temporary" remote add origin "$REPOSITORY" &&
    git -C "$temporary" fetch --quiet --depth=1 origin "$version" &&
    git -C "$temporary" -c advice.detachedHead=false checkout --quiet --detach FETCH_HEAD
  ); then
    [[ $temporary == "$ROOT/releases/.fetch."* ]] && rm -rf -- "$temporary"
    return 1
  fi
  sha=$(git -C "$temporary" rev-parse HEAD)
  valid_sha "$sha" || die "Git вернул некорректный SHA."
  destination=$ROOT/releases/$sha
  if [[ -d $destination ]]; then
    [[ -z $(git -C "$destination" status --porcelain) ]] || die "Сохранённая версия изменена вручную: $destination"
    rm -rf -- "$temporary"
  else
    mv -- "$temporary" "$destination"
  fi
  printf '%s\n' "$sha"
}
