import { type PickerLabels } from "emoji-picker-react";
import { useTranslation } from "react-i18next";
export function useEmojiLabels(): Partial<PickerLabels> {
  const { t } = useTranslation();
  return {
    searchPlaceholder: t("Найти или вставить эмодзи"),
    searchLabel: t("Поиск эмодзи"),
    searchClear: t("Очистить поиск"),
    searchResultsNone: t("Эмодзи не найдены"),
    searchResultsOne: t("Найден один эмодзи"),
    searchResultsMany: t("Найдено эмодзи: %n"),
    categoryNavigation: t("Категории эмодзи"),
    loading: t("Загружаем эмодзи…"),
    loadingError: t("Не удалось загрузить эмодзи"),
    retryLoading: t("Попробовать снова"),
    skinToneNeutral: t("Обычный тон кожи"),
    skinToneLight: t("Светлый тон кожи"),
    skinToneMediumLight: t("Средне-светлый тон кожи"),
    skinToneMedium: t("Средний тон кожи"),
    skinToneMediumDark: t("Средне-тёмный тон кожи"),
    skinToneDark: t("Тёмный тон кожи"),
  };
}
