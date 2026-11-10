import { CloudFields } from "@/components/admin/cloud/CloudFields";
import { CommandBlock } from "@/components/elements/copy";
import { Form } from "@/components/ui/forms";
import { useCloudForm } from "@/hooks/admin/forms";
import { useTranslation } from "react-i18next";

export function CloudForm({ isEnabled }: { isEnabled: boolean }) {
  const { t } = useTranslation();
  const { form, isDisabling, isPending, confirmationRules, onSubmit } = useCloudForm();
  return (
    <Form form={form} className="cloud-password-form" onSubmit={onSubmit}>
      <fieldset disabled={isPending}>
        {isEnabled && (
          <label className="checkbox">
            <input type="checkbox" {...form.register("isDisabling")} />
            {t("Отключить облачный пароль")}
          </label>
        )}
        <CloudFields
          form={form}
          confirmationRules={confirmationRules}
          isEnabled={isEnabled}
          isDisabling={isDisabling}
        />
      </fieldset>
      <p className="caption">
        {t("После сохранения все сеансы завершатся. Если забудете облачный пароль, выполните на сервере:")}
      </p>
      <CommandBlock command="sudo hy2-panel cloud-password-reset" />
      <button className="primary" disabled={isPending}>
        {t(
          isPending
            ? "Сохраняем…"
            : isDisabling
              ? "Отключить пароль"
              : isEnabled
                ? "Изменить облачный пароль"
                : "Включить облачный пароль",
        )}
      </button>
    </Form>
  );
}
