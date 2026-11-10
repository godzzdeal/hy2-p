import { Field } from "@/components/ui/fields/Field";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { useTranslation } from "react-i18next";
export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  return (
    <Field className="language-control text-lg mb-3 max-tablet:m-0 max-tablet:flex-1 tablet:group-data-collapsed/app:hidden">
      {t("Язык")}
      <Select value={i18n.language} onValueChange={(nextValue) => void i18n.changeLanguage(nextValue)}>
        <SelectOption value="ru">Русский</SelectOption>
        <SelectOption value="en">English</SelectOption>
      </Select>
    </Field>
  );
}
