import { DeploymentNotice } from "@/components/configuration/editor/DeploymentNotice";
import { CertificatePin } from "@/components/configuration/editor/connection";
import { useWebSettings } from "@/hooks/admin/use-admin";
import { setConnectionAddress } from "@/utils/configuration/address";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
interface IConnectionFields {
  value: IConfiguration;
  onChange: (value: IConfiguration) => void;
}
export function ConnectionFields({ value, onChange }: IConnectionFields) {
  const { t } = useTranslation();
  const [isSniLinked, setSniLinked] = useState(value.sni === value.host);
  const web = useWebSettings();
  const sharedAddress = web.data?.config.domain ?? "";
  const hasSuggested = useRef(!!value.host);
  useEffect(() => {
    if (!hasSuggested.current && !value.host && sharedAddress) {
      hasSuggested.current = true;
      onChange(setConnectionAddress(value, sharedAddress, isSniLinked));
    }
  }, [value, sharedAddress, isSniLinked, onChange]);
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
            onChange={(event) => onChange(setConnectionAddress(value, event.target.value, isSniLinked))}
          />
          <small>{t("Адрес, к которому будет подключаться Happ. Например vpn.example.com.")}</small>
          {sharedAddress && value.host !== sharedAddress && (
            <button
              type="button"
              className="text-btn"
              onClick={() => onChange(setConnectionAddress(value, sharedAddress, isSniLinked))}
            >
              {t("Использовать адрес панели")}
            </button>
          )}
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
        <CertificatePin value={value} onChange={onChange} />
      </div>
      <DeploymentNotice />
    </section>
  );
}
