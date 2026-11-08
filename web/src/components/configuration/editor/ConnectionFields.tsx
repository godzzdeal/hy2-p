import { DeploymentNotice } from "@/components/configuration/editor/DeploymentNotice";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
interface IConnectionFields {
  value: IConfiguration;
  onChange: (value: IConfiguration) => void;
}
export function ConnectionFields({ value, onChange }: IConnectionFields) {
  const { t } = useTranslation();
  const [isSniLinked, setSniLinked] = useState(value.sni === value.host);
  useEffect(() => {
    if (isSniLinked && value.sni !== value.host) setSniLinked(false);
  }, [isSniLinked, value.sni, value.host]);
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
            aria-label={t("Публичный адрес")}
            placeholder="vpn.example.com"
            value={value.host}
            onChange={(event) =>
              onChange({
                ...value,
                host: event.target.value,
                sni: isSniLinked ? event.target.value : value.sni,
              })
            }
          />
          <small>{t("Адрес, к которому будет подключаться Happ. Например vpn.example.com.")}</small>
        </label>
        <label>
          {t("Публичный UDP-порт")}
          <input
            aria-label={t("Публичный UDP-порт")}
            required
            value={value.port}
            onChange={(event) => onChange({ ...value, port: event.target.value })}
          />
          <small>
            {t(
              "Порт, к которому подключается Happ. После изменения сохраните и нажмите «Применить UDP-порт».",
            )}
          </small>
        </label>
        <div className="connection-sni">
          <label>
            SNI
            <input
              aria-label="SNI"
              disabled={isSniLinked}
              value={isSniLinked ? value.host : value.sni}
              onChange={(event) => onChange({ ...value, sni: event.target.value })}
            />
            <small>{t("Домен, на который выпущен сертификат. Обычно совпадает с публичным адресом.")}</small>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={isSniLinked}
              onChange={(event) => {
                setSniLinked(event.target.checked);
                if (event.target.checked) onChange({ ...value, sni: value.host });
              }}
            />
            {t("SNI совпадает с адресом")}
          </label>
        </div>
      </div>
      <DeploymentNotice />
    </section>
  );
}
