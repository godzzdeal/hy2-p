import { useId } from "react";
import { useTranslation } from "react-i18next";
import { FlagPicker, FLAG_PREFIX, replaceFlag } from "@/shared/flags";
import { PROFILE_TITLE_LIMIT } from "./flag-options";
export function ProfileFields({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const id = useId();
  const flag = value.match(FLAG_PREFIX)?.[0].trim() ?? "";
  const count = Array.from(value).length;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <label className="md:col-span-2" htmlFor={id}>
        {t("Название подписки")}
        <input
          id={id}
          aria-label={t("Название подписки")}
          aria-invalid={count > PROFILE_TITLE_LIMIT}
          value={value.replace(FLAG_PREFIX, "")}
          placeholder={t("Например, Германия")}
          onChange={(event) =>
            onChange(
              FLAG_PREFIX.test(event.target.value)
                ? event.target.value
                : replaceFlag(event.target.value, flag),
            )
          }
          aria-describedby={id + "-hint"}
        />
        <small id={id + "-hint"}>
          {count} / {PROFILE_TITLE_LIMIT}
        </small>
        <small>
          {t("Название появится в Happ после обновления подписки. Можно вставить свой флаг или эмодзи.")}
        </small>
      </label>
      <FlagPicker value={value} onChange={(next) => onChange(replaceFlag(value, next))} />
    </div>
  );
}
