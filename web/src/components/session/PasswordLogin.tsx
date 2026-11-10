import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Button } from "@/components/ui/button/Button";
import { ArrowUpRight } from "@/components/elements/icons";
import { AccountRecovery } from "@/components/admin/account/AccountRecovery";
import { Form, FormPassword } from "@/components/ui/forms";
import { LanguageSelect } from "@/components/elements/LanguageSelect";
import { type ILoginCredentials } from "@/services/session/session-api";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface IPasswordLogin {
  isPending: boolean;
  onSubmit: (value: ILoginCredentials) => void;
}
export function PasswordLogin({ isPending, onSubmit }: IPasswordLogin) {
  const { t } = useTranslation();
  const form = useForm<ILoginCredentials>({
    defaultValues: { username: localStorage.getItem("hy2.login") ?? "admin", password: "" },
  });
  return (
    <Form form={form} onSubmit={onSubmit}>
      <LanguageSelect />
      <Field>
        {t("Логин")}
        <Input
          autoComplete="username"
          required
          {...form.register("username", { required: t("Заполните это поле") })}
        />
      </Field>
      <FormPassword
        control={form.control}
        name="password"
        autoFocus
        required
        canGenerate={false}
        minLength={0}
        autoComplete="current-password"
      />
      <Button className="w-full justify-between" variant="primary" disabled={isPending}>
        {t(isPending ? "Входим…" : "Войти в панель")}
        <ArrowUpRight width={24} height={24} aria-hidden />
      </Button>
      <AccountRecovery />
    </Form>
  );
}
