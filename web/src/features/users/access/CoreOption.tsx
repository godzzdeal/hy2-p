import { useTranslation } from "react-i18next";
import { type IInstance } from "@/features/instances/model";
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
    <label className="checkbox user-core-option">
      <input
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
    </label>
  );
}
