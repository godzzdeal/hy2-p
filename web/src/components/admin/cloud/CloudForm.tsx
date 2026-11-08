import { CloudFields } from "@/components/admin/cloud/CloudFields";
import { CommandBlock } from "@/components/elements/CommandBlock";
import { useSaveCloudPassword } from "@/hooks/admin/use-cloud-password";
import { type ICloudPasswordChange } from "@/services/session/cloud-password";
import { useUiStore } from "@/store/ui-store";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

export function CloudForm({ isEnabled }: { isEnabled: boolean }) {
  const { t } = useTranslation();
  const [value, setValue] = useState<ICloudPasswordChange>({
    currentPassword: "",
    currentCloudPassword: "",
    password: "",
  });
  const [confirmation, setConfirmation] = useState("");
  const [isDisabling, setDisabling] = useState(false);
  const save = useSaveCloudPassword();
  const showError = useUiStore((state) => state.showError);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDisabling && value.password !== confirmation) {
      showError(new Error(t("Пароли не совпадают")));
      return;
    }
    save.mutate({ ...value, password: isDisabling ? "" : value.password });
  }
  return (
    <form className="cloud-password-form" onSubmit={onSubmit}>
      <fieldset disabled={save.isPending}>
        {isEnabled && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={isDisabling}
              onChange={(event) => setDisabling(event.target.checked)}
            />
            {t("Отключить облачный пароль")}
          </label>
        )}
        <CloudFields
          value={value}
          onChange={setValue}
          confirmation={confirmation}
          onConfirmation={setConfirmation}
          isEnabled={isEnabled}
          isDisabling={isDisabling}
        />
      </fieldset>
      <p className="caption">
        {t("После сохранения все сеансы завершатся. Если забудете облачный пароль, выполните на сервере:")}
      </p>
      <CommandBlock command="sudo hy2-panel cloud-password-reset" />
      <button className="primary" disabled={save.isPending}>
        {t(
          save.isPending
            ? "Сохраняем…"
            : isDisabling
              ? "Отключить пароль"
              : isEnabled
                ? "Изменить облачный пароль"
                : "Включить облачный пароль",
        )}
      </button>
    </form>
  );
}
