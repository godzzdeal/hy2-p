import { Field } from "@/components/ui/fields/Field";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { useTranslation } from "react-i18next";
export function AuthSettings({
  value,
  onChange,
}: {
  value: IConfiguration;
  onChange: (value: IConfiguration) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="config-note border-l-4 border-accent text-muted py-3 px-4 bg-surface-soft">
      <Field htmlFor="auth-source">{t("Кто управляет доступом")}</Field>
      <Select
        id="auth-source"
        value={value.authMode ?? "panel"}
        onValueChange={(next) => onChange({ ...value, authMode: next as "panel" | "native" })}
      >
        <SelectOption value="panel">{t("Пользователи панели")}</SelectOption>
        <SelectOption value="native">{t("Настройки Hysteria2")}</SelectOption>
      </Select>
      <p className="mt-3">
        {value.authMode === "native"
          ? t("Пользователи панели не применяются. Доступ определяют параметры auth ниже.")
          : t(
              "Пользователи хранятся в панели. Happ получает пароль по ссылке подключения, а HY2 проверяет его через панель. Добавлять пользователей в YAML и перезапускать экземпляр не нужно.",
            )}
      </p>
    </div>
  );
}
