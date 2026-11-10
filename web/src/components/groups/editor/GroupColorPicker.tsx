import { Field } from "@/components/ui/fields/Field";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { GROUP_COLORS, type TGroupColor } from "@/services/groups/types";
import { useTranslation } from "react-i18next";
export function GroupColorPicker({
  value,
  onChange,
}: {
  value: TGroupColor;
  onChange: (value: TGroupColor) => void;
}) {
  const { t } = useTranslation();
  return (
    <Field>
      {t("Цвет группы")}
      <Select
        value={value}
        onValueChange={(next) => {
          const color = GROUP_COLORS.find((item) => item === next);
          if (color) onChange(color);
        }}
      >
        <SelectOption value="cyan">{t("Бирюзовый")}</SelectOption>
        <SelectOption value="blue">{t("Синий")}</SelectOption>
        <SelectOption value="green">{t("Зелёный")}</SelectOption>
        <SelectOption value="amber">{t("Янтарный")}</SelectOption>
        <SelectOption value="purple">{t("Фиолетовый")}</SelectOption>
        <SelectOption value="gray">{t("Серый")}</SelectOption>
      </Select>
    </Field>
  );
}
