import { type TFunction } from "i18next";
export function editorPhrases(t: TFunction): Record<string, string> {
  return {
    Find: t("Найти"),
    Replace: t("Заменить"),
    next: t("Далее"),
    previous: t("Назад"),
    all: t("Все"),
    "match case": t("Учитывать регистр"),
    regexp: t("Регулярное выражение"),
    "by word": t("Целое слово"),
    replace: t("Заменить"),
    "replace all": t("Заменить всё"),
    close: t("Закрыть"),
    "No matches": t("Совпадений нет"),
    "Go to line": t("Перейти к строке"),
    "current match": t("Текущее совпадение"),
    "replaced $ matches": t("Заменено совпадений: $"),
  };
}
