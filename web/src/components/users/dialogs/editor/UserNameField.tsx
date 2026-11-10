import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { FlagPicker } from "@/components/elements/flags/select/FlagPicker";
import { useAnnouncement } from "@/hooks/admin/use-announcement";
import { FLAG_PREFIX, replaceFlag } from "@/utils/flags/flag-options";
import { useId, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
interface IUserNameField extends Omit<ComponentProps<"input">, "value" | "onChange" | "children"> {
  value: string;
  onChange: (value: string) => void;
}
export function UserNameField({ value, onChange, id: inputId, ...props }: IUserNameField) {
  const { t } = useTranslation();
  const generatedId = useId();
  const id = inputId ?? generatedId;
  const flag = value.match(FLAG_PREFIX)?.[0].trim() ?? "";
  const announcement = useAnnouncement();
  const hasDefault = !!announcement.data?.defaultUserFlag;
  return (
    <div className="user-name-fields grid grid-cols-2 gap-3 max-narrow:grid-cols-1">
      <Field htmlFor={id}>
        {t("Имя")}
        <Input
          id={id}
          autoFocus
          required
          maxLength={80}
          {...props}
          value={value.replace(FLAG_PREFIX, "")}
          onChange={(event) =>
            onChange(
              FLAG_PREFIX.test(event.target.value)
                ? event.target.value
                : replaceFlag(event.target.value, flag),
            )
          }
        />
      </Field>
      <FlagPicker
        value={flag}
        emptyLabel={hasDefault ? "Общий флаг" : "Без флага"}
        onChange={(next) => onChange(replaceFlag(value, next))}
      />
      <small className="user-name-hint col-span-full">
        {t(
          "Флаг станет иконкой подключения в Happ. Эмодзи можно добавить прямо в имя. После изменения обновите подписку.",
        )}
      </small>
    </div>
  );
}
