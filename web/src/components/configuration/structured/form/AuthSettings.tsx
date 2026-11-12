import { InfoField } from "@/components/ui/fields/information";
import { Notice } from "@/components/ui/feedback";
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
    <div className="grid min-w-0 gap-3">
      {value.authMode === "native" && (
        <Notice variant="warning">
          {t("Пользователи панели не применяются. Доступ определяют параметры auth ниже.")}
        </Notice>
      )}
      <InfoField
        htmlFor="auth-source"
        label={t("Кто управляет доступом")}
        description={t(
          "HY2 проверяет пользователей через панель. После создания пользователя не нужно менять YAML или перезапускать экземпляр.",
        )}
      >
        <Select
          id="auth-source"
          value={value.authMode ?? "panel"}
          onValueChange={(next) => onChange({ ...value, authMode: next as "panel" | "native" })}
        >
          <SelectOption value="panel">{t("Пользователи панели")}</SelectOption>
          <SelectOption value="native">{t("Настройки Hysteria2")}</SelectOption>
        </Select>
      </InfoField>
    </div>
  );
}
