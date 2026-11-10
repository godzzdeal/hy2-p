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
  const { form, isPending, onSubmit } = useAccountForm(username);
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
                required: t("Заполните это поле"),
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
              "Оставьте новый пароль пустым, чтобы изменить только логин. После сохранения все сессии будут завершены.",
            )}
          </Caption>
          <Button variant="primary" disabled={isPending}>
            {t("Изменить данные входа")}
          </Button>
          <AccountRecovery />
        </CardBody>
      </Form>
    </SettingsSection>
  );
}
