import { useTranslation } from "react-i18next";
import { Select, SelectOption } from "@/shared/ui/select";
import { GROUP_COLORS, type TGroupColor } from "../model";
export function GroupColorPicker({
  value,
  onChange,
}: {
  value: TGroupColor;
  onChange: (value: TGroupColor) => void;
}) {
  const { t } = useTranslation();
  return (
    <label>
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
    </label>
  );
}
