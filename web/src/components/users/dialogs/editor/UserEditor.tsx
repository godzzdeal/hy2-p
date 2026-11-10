import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
import { Form, FormPassword } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlays/Modal";
import { UserNameField } from "@/components/users/dialogs/editor/UserNameField";
import { useUserEditor } from "@/hooks/users/use-user-editor";
import { type IUser } from "@/services/users/user-types";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
interface IUserEditor {
  user?: IUser;
  onClose: () => void;
}
export function UserEditor({ user, onClose }: IUserEditor) {
  const { t } = useTranslation();
  const { form, isPending, onSubmit } = useUserEditor(user, onClose);
  return (
    <Modal title={user ? t("Редактировать пользователя") : t("Новый пользователь")} onClose={onClose}>
      <Form form={form} onSubmit={onSubmit}>
        <Controller
          control={form.control}
          name="name"
          rules={{ required: t("Заполните это поле"), maxLength: 80 }}
          render={({ field }) => (
            <UserNameField
              value={field.value}
              onChange={field.onChange}
              ref={field.ref}
              onBlur={field.onBlur}
            />
          )}
        />
        <Field>
          {t("Доступ до")}
          <Input type="date" {...form.register("expires")} />
          <small>{t("Оставьте пустым для бессрочного доступа.")}</small>
        </Field>
        {user && (
          <Field isInline>
            <Input type="checkbox" {...form.register("isEnabled")} />
            {t("Доступ включён")}
          </Field>
        )}
        <FormPassword
          control={form.control}
          name="password"
          placeholder={user ? "Без изменений" : "Автоматически"}
          label={user ? t("Новый пароль подключения") : t("Пароль подключения (или автоматический)")}
        />
        <Button disabled={isPending} className="full w-full" variant="primary">
          {isPending ? t("Сохраняем\u2026") : t("Сохранить пользователя")}
        </Button>
      </Form>
    </Modal>
  );
}
