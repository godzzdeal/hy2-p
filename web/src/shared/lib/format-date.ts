import { i18n } from "@/shared/i18n/setup";
export function formatDate(value: string): string {
  return value ? new Date(value).toLocaleDateString(i18n.language) : i18n.t("Без срока");
}
