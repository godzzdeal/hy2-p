import { FieldGrid } from "@/components/ui/fields/FieldGrid";
import { InfoField } from "@/components/ui/fields/information";
import { useId } from "react";
import { Input } from "@/components/ui/fields/controls/Input";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { type IWebConfig } from "@/services/admin/admin-types";
import { useTranslation } from "react-i18next";
export function NetworkFields({
  value,
  onChange,
}: {
  value: IWebConfig;
  onChange: (value: IWebConfig) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <FieldGrid>
      <InfoField
        htmlFor={id + "-host"}
        label={t("Адрес веб-панели")}
        description={t(
          "Выберите, на каких сетевых интерфейсах доступна панель. Локальный адрес подходит для reverse proxy.",
        )}
      >
        <Select
          id={id + "-host"}
          value={value.host}
          onValueChange={(nextValue) => onChange({ ...value, host: nextValue })}
        >
          <SelectOption value="127.0.0.1">{t("Только локально (127.0.0.1)")}</SelectOption>
          <SelectOption value="0.0.0.0">{t("Все IPv4 адреса (0.0.0.0)")}</SelectOption>
          <SelectOption value="::1">{t("Только локально по IPv6 (::1)")}</SelectOption>
          <SelectOption value="::">{t("Все IPv6 адреса (::)")}</SelectOption>
        </Select>
      </InfoField>
      <InfoField
        htmlFor={id + "-port"}
        label={t("Порт веб-панели")}
        description={t(
          "Порт для входа в веб-панель. После изменения сохраните настройки и перезапустите панель.",
        )}
      >
        <Input
          id={id + "-port"}
          type="number"
          min={1}
          max={65535}
          required
          value={value.port}
          onChange={(event) =>
            onChange({
              ...value,
              port: Number(event.target.value),
            })
          }
        />
      </InfoField>
      <InfoField
        htmlFor={id}
        label={t("Публичный URL панели и подписок")}
        description={t("Адрес формируется автоматически из домена или IP, протокола и порта панели.")}
      >
        <Input
          id={id}
          aria-label={t("Публичный URL панели и подписок")}
          placeholder={value.mode === "http" ? "http://203.0.113.10:8080" : "https://203.0.113.10:9443"}
          value={value.publicURL}
          readOnly
        />
      </InfoField>
    </FieldGrid>
  );
}
