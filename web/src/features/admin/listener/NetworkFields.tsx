import { Select, SelectOption } from "@/shared/ui/select";
import { useTranslation } from "react-i18next";
import { type IWebConfig } from "@/features/admin/model";
export function NetworkFields({
  value,
  onChange,
}: {
  value: IWebConfig;
  onChange: (value: IWebConfig) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="field-grid">
      <label>
        {t("Адрес веб-панели")}
        <Select value={value.host} onValueChange={(nextValue) => onChange({ ...value, host: nextValue })}>
          <SelectOption value="127.0.0.1">{t("Только локально (127.0.0.1)")}</SelectOption>
          <SelectOption value="0.0.0.0">{t("Все IPv4 адреса (0.0.0.0)")}</SelectOption>
          <SelectOption value="::1">{t("Только локально по IPv6 (::1)")}</SelectOption>
          <SelectOption value="::">{t("Все IPv6 адреса (::)")}</SelectOption>
        </Select>
      </label>
      <label>
        {t("Порт веб-панели")}
        <input
          type="number"
          min={1}
          max={65535}
          required
          value={value.port}
          onChange={(event) =>
            onChange({
              ...value,
              port: Number(event.target.value),
              publicURL: /^https?:\/\/(localhost|127\.0\.0\.1):/.test(value.publicURL)
                ? value.publicURL.replace(/:\d+\/?$/, ":" + event.target.value)
                : value.publicURL,
            })
          }
        />
      </label>
      <label>
        {t("Публичный URL панели и подписок")}
        <input
          placeholder="https://panel.example.com:8443"
          value={value.publicURL}
          onChange={(event) => onChange({ ...value, publicURL: event.target.value })}
        />
        <small>{t("Укажите внешний адрес, если используете Docker или reverse proxy.")}</small>
      </label>
    </div>
  );
}
