import { useTranslation } from "react-i18next";
import { parseDocument } from "yaml";
import { certificateMode } from "@/features/configuration/structured/model";
export function CertificateMode({
  source,
  onChange,
}: {
  source: string;
  onChange: (source: string) => void;
}) {
  const { t } = useTranslation();
  const isAcme = parseDocument(source).has("acme");
  return (
    <div className="config-note">
      <label>
        {t("Сертификат Hysteria2")}
        <select
          value={isAcme ? "acme" : "tls"}
          onChange={(event) => onChange(certificateMode(source, event.target.value))}
        >
          <option value="tls">{t("Собственный TLS-сертификат")}</option>
          <option value="acme">{t("ACME \u2014 автоматический выпуск и продление")}</option>
        </select>
      </label>
      <p>
        {t(
          "ACME продлевает сертификаты, пока ядро работает. DNS-проверка не занимает порты 80/443 и удобна, если на них работает веб-панель.",
        )}
      </p>
    </div>
  );
}
