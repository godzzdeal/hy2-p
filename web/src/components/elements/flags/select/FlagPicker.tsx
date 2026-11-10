import { FlagOption } from "@/components/elements/flags/select/FlagOption";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { FLAGS, FLAG_PREFIX, regionFromFlag } from "@/utils/flags/flag-options";
import { useId } from "react";
import { useTranslation } from "react-i18next";
export function FlagPicker({
  value,
  onChange,
  label = "Флаг",
  emptyLabel = "Без флага",
}: {
  value: string;
  onChange: (flag: string) => void;
  label?: string;
  emptyLabel?: string;
}) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const flag = value.match(FLAG_PREFIX)?.[0].trim() ?? "";
  const countries = new Intl.DisplayNames(i18n.language, { type: "region" });
  const region = regionFromFlag(flag);
  return (
    <label htmlFor={id}>
      {t(label)}
      <Select id={id} value={flag} onValueChange={onChange}>
        <SelectOption value="">{t(emptyLabel)}</SelectOption>
        {flag && !FLAGS.some((option) => option.flag === flag) && (
          <FlagOption value={flag} label={countries.of(region) ?? region} />
        )}
        {FLAGS.map((option) => (
          <FlagOption
            key={option.region}
            value={option.flag}
            label={countries.of(option.region) ?? option.region}
          />
        ))}
      </Select>
    </label>
  );
}
