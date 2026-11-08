import { FlagPicker } from "@/components/elements/flags/select/FlagPicker";
import { FLAG_PREFIX, replaceFlag } from "@/utils/flags/flag-options";
import { useId } from "react";
import { useTranslation } from "react-i18next";
export function UserNameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const id = useId();
  const flag = value.match(FLAG_PREFIX)?.[0].trim() ?? "";
  return (
    <div className="user-name-fields">
      <label htmlFor={id}>
        {t("Имя")}
        <input
          id={id}
          autoFocus
          required
          maxLength={80}
          value={value.replace(FLAG_PREFIX, "")}
          onChange={(event) =>
            onChange(
              FLAG_PREFIX.test(event.target.value)
                ? event.target.value
                : replaceFlag(event.target.value, flag),
            )
          }
        />
      </label>
      <FlagPicker value={flag} onChange={(next) => onChange(replaceFlag(value, next))} />
      <small className="user-name-hint">
        {t(
          "Флаг станет иконкой подключения в Happ. Эмодзи можно добавить прямо в имя. После изменения обновите подписку.",
        )}
      </small>
    </div>
  );
}
