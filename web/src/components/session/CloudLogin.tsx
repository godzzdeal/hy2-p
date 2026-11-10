import { useCloudLogin } from "@/hooks/session/use-cloud-login";
import { Form, FormPassword } from "@/components/ui/forms";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export function CloudLogin({ challenge, onBack }: { challenge: string; onBack: () => void }) {
  const { t } = useTranslation();
  const form = useForm({ defaultValues: { password: "" } });
  const login = useCloudLogin();
  return (
    <Form
      form={form}
      className="cloud-login"
      onSubmit={({ password }) => login.mutate({ challenge, password })}
    >
      <h2>{t("Облачный пароль")}</h2>
      <p className="caption">{t("Введите дополнительный пароль, чтобы завершить вход.")}</p>
      <FormPassword
        control={form.control}
        name="password"
        label="Облачный пароль"
        autoFocus
        required
        canGenerate={false}
        minLength={0}
        autoComplete="current-password"
      />
      <button className="primary" disabled={login.isPending}>
        {t(login.isPending ? "Проверяем…" : "Подтвердить")}
      </button>
      <button type="button" className="secondary full" disabled={login.isPending} onClick={onBack}>
        {t("Вернуться к входу")}
      </button>
      <p className="caption">{t("Забыли пароль? Сброс доступен владельцу сервера через SSH.")}</p>
    </Form>
  );
}
