import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { type IInstance } from "@/services/instances/types";
import { useTranslation } from "react-i18next";
export function CoreOption({
  instance,
  isChecked,
  isDisabled,
  onToggle,
}: {
  instance: IInstance;
  isChecked: boolean;
  isDisabled: boolean;
  onToggle: (id: string, isChecked: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Field className="user-core-option p-2 m-0 min-w-0" isInline>
      <Input
        type="checkbox"
        checked={isChecked}
        disabled={isDisabled}
        onChange={(event) => onToggle(instance.id, event.target.checked)}
      />
      <span>
        <strong>{instance.name}</strong>
        <small>
          {t(
            instance.authMode === "native"
              ? "Собственная аутентификация"
              : instance.error
                ? "Конфигурация недоступна"
                : instance.publishedPort
                  ? "Порт опубликован"
                  : "Порт пока не опубликован",
          )}
        </small>
      </span>
    </Field>
  );
}
