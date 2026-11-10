import { Form, FormPassword } from "@/components/ui/forms";
import { Modal } from "@/components/ui/modal/Modal";
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
        <label>
          {t("Доступ до")}
          <input type="date" {...form.register("expires")} />
          <small>{t("Оставьте пустым для бессрочного доступа.")}</small>
        </label>
        {user && (
          <label className="checkbox">
            <input type="checkbox" {...form.register("isEnabled")} />
            {t("Доступ включён")}
          </label>
        )}
        <FormPassword
          control={form.control}
          name="password"
          placeholder={user ? "Без изменений" : "Автоматически"}
          label={user ? t("Новый пароль подключения") : t("Пароль подключения (или автоматический)")}
        />
        <button disabled={isPending} className="primary full">
          {isPending ? t("Сохраняем\u2026") : t("Сохранить пользователя")}
        </button>
      </Form>
    </Modal>
  );
}
