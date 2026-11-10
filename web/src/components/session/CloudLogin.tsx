import { Caption } from "@/components/elements/Caption";
import { Button } from "@/components/ui/button/Button";
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
      <Caption>{t("Введите дополнительный пароль, чтобы завершить вход.")}</Caption>
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
      <Button className="w-full" variant="primary" disabled={login.isPending}>
        {t(login.isPending ? "Проверяем…" : "Подтвердить")}
      </Button>
      <Button
        type="button"
        className="full w-full"
        variant="secondary"
        disabled={login.isPending}
        onClick={onBack}
      >
        {t("Вернуться к входу")}
      </Button>
      <Caption>{t("Забыли пароль? Сброс доступен владельцу сервера через SSH.")}</Caption>
    </Form>
  );
}
