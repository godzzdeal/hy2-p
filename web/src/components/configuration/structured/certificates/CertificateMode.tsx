import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { certificateMode } from "@/utils/configuration/structured/yaml/fields";
import { useTranslation } from "react-i18next";
import { parseDocument } from "yaml";
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
        <Select
          value={isAcme ? "acme" : "tls"}
          onValueChange={(nextValue) => onChange(certificateMode(source, nextValue))}
        >
          <SelectOption value="tls">{t("Собственный TLS-сертификат")}</SelectOption>
          <SelectOption value="acme">{t("Автоматический сертификат ACME")}</SelectOption>
        </Select>
      </label>
      <p>
        {t(
          "ACME продлевает сертификаты, пока ядро работает. В Docker HTTP-проверка панели и ядра использует общий внешний TCP-порт 80. После её включения выполните sudo hy2-panel restart. TLS-проверка требует отдельного проброса TCP 443; DNS-проверка не занимает порты.",
        )}
      </p>
    </div>
  );
}
