import { IconMenu } from "@/components/ui/menu";
import { Languages } from "@/components/elements/icons";
import { useUiStore } from "@/store/ui-store";
import { useTranslation } from "react-i18next";
const LANGUAGES = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
] as const;
export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  return (
    <IconMenu
      className="language-control"
      label={t("Язык")}
      icon={Languages}
      value={i18n.resolvedLanguage === "en" ? "en" : "ru"}
      options={LANGUAGES}
      onValueChange={(value) => {
        void i18n.changeLanguage(value).catch(useUiStore.getState().showError);
      }}
    />
  );
}
