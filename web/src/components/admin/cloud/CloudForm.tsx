import { Fieldset } from "@/components/ui/fields/Fieldset";
import { Caption } from "@/components/elements/Caption";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
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
      <Fieldset disabled={isPending}>
        {isEnabled && (
          <Field isInline>
            <Input type="checkbox" {...form.register("isDisabling")} />
            {t("Отключить облачный пароль")}
          </Field>
        )}
        <CloudFields
          form={form}
          confirmationRules={confirmationRules}
          isEnabled={isEnabled}
          isDisabling={isDisabling}
        />
      </Fieldset>
      <Caption>
        {t("После сохранения все сеансы завершатся. Если забудете облачный пароль, выполните на сервере:")}
      </Caption>
      <CommandBlock command="sudo hy2-panel cloud-password-reset" />
      <Button variant="primary" disabled={isPending}>
        {t(isPending ? "Сохраняем…" : isDisabling ? "Отключить" : isEnabled ? "Изменить" : "Включить")}
      </Button>
    </Form>
  );
}
