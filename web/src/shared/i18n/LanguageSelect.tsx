import { useTranslation } from "react-i18next";
export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  return (
    <label className="language-control">
      {t("Язык")}
      <select value={i18n.language} onChange={(event) => void i18n.changeLanguage(event.target.value)}>
        <option value="ru">Русский</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
