#!/usr/bin/env bash
prepare_image() {
  local sha=$1 arch version image directory expected actual archive
  image=$(image_for "$sha")
  if [[ $(engine image inspect --format '{{index .Config.Labels "io.hy2-panel.commit"}}' "$image" 2>/dev/null || true) == "$sha" ]]; then return 0; fi
  if [[ ${HY2_BUILD_FROM_SOURCE:-false} == true ]]; then compose "$sha" build --pull panel; return; fi
  arch=$(dpkg --print-architecture)
  [[ $arch == amd64 || $arch == arm64 ]] || die "Готовый образ доступен для amd64 и arm64."
  version=$(cat "$ROOT/image-version-$sha" 2>/dev/null || true)
  [[ $version =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "Для этой версии нет готового релизного образа. Для разработки задайте HY2_BUILD_FROM_SOURCE=true."
  directory=$(mktemp -d "$ROOT/.image.XXXXXX")
  archive=hy2-panel-linux-$arch.tar.gz
  log "Скачиваем готовый Docker-образ $version ($arch). Сборка на сервере не требуется."
  if ! curl -fLsS --retry 3 --proto '=https' --tlsv1.2 \
    "https://github.com/godzzdeal/hy2-p/releases/download/$version/$archive" -o "$directory/$archive" ||
    ! curl -fLsS --retry 3 --proto '=https' --tlsv1.2 \
    "https://github.com/godzzdeal/hy2-p/releases/download/$version/$archive.sha256" -o "$directory/checksum"; then
    rm -f -- "$directory/$archive" "$directory/checksum"; rmdir -- "$directory"; return 1
  fi
  expected=$(awk 'NR==1 {print $1}' "$directory/checksum")
  actual=$(sha256sum "$directory/$archive"); actual=${actual%% *}
  if [[ ! $expected =~ ^[a-f0-9]{64}$ || $actual != "$expected" ]]; then die "Контрольная сумма Docker-образа не совпадает. Архив оставлен: $directory"; fi
  engine load --input "$directory/$archive" || return 1
  [[ $(engine image inspect --format '{{index .Config.Labels "io.hy2-panel.commit"}}' "$image") == "$sha" ]] ||
    die "Docker-образ не соответствует выбранной версии."
  [[ $(engine image inspect --format '{{.Architecture}}' "$image") == "$arch" ]] || die "Неверная архитектура образа."
  rm -f -- "$directory/$archive" "$directory/checksum"; rmdir -- "$directory"
}
