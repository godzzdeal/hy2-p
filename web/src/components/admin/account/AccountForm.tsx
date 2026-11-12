import { Caption } from "@/components/elements/Caption";
import { CardBody } from "@/components/ui/cards/CardBody";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
import { Form, FormPassword } from "@/components/ui/forms";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { AccountRecovery } from "@/components/admin/account/AccountRecovery";
import { useAccountForm } from "@/hooks/admin/forms";
import { useTranslation } from "react-i18next";
export function AccountForm({ username }: { username: string }) {
  const { t } = useTranslation();
  const { form, canSubmit, onSubmit } = useAccountForm(username);
  return (
    <SettingsSection id="panel-account" title={t("Учётная запись администратора")}>
      <Form form={form} className="settings-form" onSubmit={onSubmit}>
        <CardBody>
          <Field>
            {t("Логин")}
            <Input
              required
              autoComplete="username"
              minLength={3}
              maxLength={64}
              {...form.register("username", {
                required: t("Заполните поле «{{field}}».", { field: t("Логин") }),
                minLength: 3,
                maxLength: 64,
              })}
            />
          </Field>
          <FormPassword
            control={form.control}
            name="currentPassword"
            label="Текущий пароль"
            required
            canGenerate={false}
            minLength={0}
            autoComplete="current-password"
          />
          <FormPassword
            control={form.control}
            name="password"
            label={t("Новый пароль (не менее 16 символов)")}
            minLength={16}
            placeholder="Без изменений"
          />
          <Caption>
            {t(
              "Чтобы изменить только логин, оставьте новый пароль пустым. После сохранения войдите заново на всех устройствах.",
            )}
          </Caption>
          <Button aria-label={t("Изменить данные входа")} variant="primary" disabled={!canSubmit}>
            {t("Изменить")}
          </Button>
          <AccountRecovery />
        </CardBody>
      </Form>
    </SettingsSection>
  );
}
