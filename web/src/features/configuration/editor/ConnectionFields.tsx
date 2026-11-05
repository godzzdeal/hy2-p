import { useTranslation } from "react-i18next";
import { type IConfiguration } from "@/features/configuration/model";
interface IConnectionFields {
  value: IConfiguration;
  onChange: (value: IConfiguration) => void;
}
export function ConnectionFields({ value, onChange }: IConnectionFields) {
  const { t } = useTranslation();
  return (
    <section
      className="card form-card"
      id="config-connection"
      data-scroll-section
      data-scroll-label={t("Параметры подключения")}
    >
      <div className="card-header">
        <h2>{t("Параметры подключения")}</h2>
      </div>
      <div className="field-grid">
        <label>
          {t("Публичный адрес")}
          <input
            placeholder="vpn.example.com"
            value={value.host}
            onChange={(event) => onChange({ ...value, host: event.target.value })}
          />
          <small>{t("Домен или IP, доступный клиентам.")}</small>
        </label>
        <label>
          {t("Публичный UDP-порт")}
          <input
            required
            value={value.port}
            onChange={(event) => onChange({ ...value, port: event.target.value })}
          />
          <small>{t("Учитывайте проброс порта Docker.")}</small>
        </label>
        <label>
          TLS Server Name (SNI)
          <input value={value.sni} onChange={(event) => onChange({ ...value, sni: event.target.value })} />
          <small>{t("Имя в сертификате сервера.")}</small>
        </label>
      </div>
    </section>
  );
}
