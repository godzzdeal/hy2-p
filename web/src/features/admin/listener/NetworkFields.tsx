import { useTranslation } from "react-i18next";
import type { IWebConfig } from "@/features/admin/model";
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
        <select value={value.host} onChange={(event) => onChange({ ...value, host: event.target.value })}>
          <option value="127.0.0.1">{t("127.0.0.1 \u2014 только локально")}</option>
          <option value="0.0.0.0">{t("0.0.0.0 \u2014 все IPv4-интерфейсы")}</option>
          <option value="::1">{t("::1 \u2014 только локально IPv6")}</option>
          <option value="::">{t(":: \u2014 все IPv6-интерфейсы")}</option>
        </select>
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
