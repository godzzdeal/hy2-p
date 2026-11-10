#!/usr/bin/env bash
transfer_panel() {
  local sha=$1 command=$2 file=${3:-} mode=preview temporary
  local -a mappings=()
  [[ -n $file ]] || die "Укажите путь к JSON-файлу."
  shift 3
  if [[ $command == export ]]; then
    (($#==0)) || die "Лишние параметры."
    [[ ! -e $file && ! -L $file ]] || die "Файл уже существует. Выберите другое имя."
    temporary=$(mktemp -- "${file}.XXXXXX") || return 1
    if compose "$sha" exec -T panel /usr/local/bin/panel --transfer export >"$temporary"; then
      chmod 600 "$temporary"
      if ln -- "$temporary" "$file"; then rm -- "$temporary"; else rm -- "$temporary"; return 1; fi
      log "Экспорт готов: $file. Файл содержит пароли и ссылки подписок."
    else rm -- "$temporary"; return 1; fi
    return
  fi
  [[ -f $file && -r $file ]] || die "Файл импорта не найден."
  while (($#)); do
    case $1 in
      --preview) mode=preview ;;
      --apply) mode=apply ;;
      --map-core) (($#>1)) || die "Укажите source=target после --map-core."; mappings+=("$2"); shift ;;
      --skip-core) (($#>1)) || die "Укажите ID экземпляра после --skip-core."; mappings+=("$2=skip"); shift ;;
      *) die "Используйте --preview, --apply, --skip-core ID или --map-core source=target." ;;
    esac
    shift
  done
  compose "$sha" exec -T panel /usr/local/bin/panel --transfer "$mode" "${mappings[@]}" <"$file" | jq .
  if [[ $mode == preview ]]; then log "Для добавления новых записей: sudo hy2-panel import <файл> --apply"; fi
}
