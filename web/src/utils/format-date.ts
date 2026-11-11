import { i18n } from "@/config/i18n/setup";
export function formatDate(value: string): string {
  return value ? new Date(value).toLocaleDateString(i18n.language) : i18n.t("Без срока");
}
export function formatDateTime(value: string): string {
  return value
    ? new Date(value).toLocaleString(i18n.language, {
        dateStyle: "short",
        timeStyle: "short",
      })
    : i18n.t("Пока нет");
}
