import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectOption } from "@/shared/ui";
import { FLAGS, FLAG_PREFIX, PROFILE_TITLE_LIMIT, replaceFlag } from "./flag-options";
import { FlagOption } from "./FlagOption";
export function ProfileFields({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const flag = value.match(FLAG_PREFIX)?.[0].trim() ?? "";
  const countries = new Intl.DisplayNames(i18n.language, { type: "region" });
  const count = Array.from(value).length;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <label className="md:col-span-2" htmlFor={id}>
        {t("Название подписки")}
        <input
          id={id}
          aria-label={t("Название подписки")}
          aria-invalid={count > PROFILE_TITLE_LIMIT}
          value={value}
          placeholder="🇩🇪 Германия"
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={id + "-hint"}
        />
        <small id={id + "-hint"}>
          {count} / {PROFILE_TITLE_LIMIT}
        </small>
        <small>
          {t("Название появится в Happ после обновления подписки. Можно вставить свой флаг или эмодзи.")}
        </small>
      </label>
      <label htmlFor={id + "-flag"}>
        {t("Флаг")}
        <Select id={id + "-flag"} value={flag} onValueChange={(next) => onChange(replaceFlag(value, next))}>
          <SelectOption value="">{t("Без флага")}</SelectOption>
          {flag && !FLAGS.some((option) => option.flag === flag) && <FlagOption value={flag} label="" />}
          {FLAGS.map((option) => (
            <FlagOption
              key={option.region}
              value={option.flag}
              label={countries.of(option.region) ?? option.region}
            />
          ))}
        </Select>
      </label>
    </div>
  );
}
