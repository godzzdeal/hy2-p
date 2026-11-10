import { Select } from "@/components/ui/select/Select";
import { CommandBlock } from "@/components/elements/copy";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { certificateMode } from "@/utils/configuration/structured/yaml/fields";
import { useTranslation } from "react-i18next";
import { parseDocument } from "yaml";
export function CertificateMode({
  source,
  onChange,
  address,
  email,
}: {
  source: string;
  onChange: (source: string) => void;
  address?: string;
  email?: string;
}) {
  const { t } = useTranslation();
  const isAcme = parseDocument(source).has("acme");
  return (
    <div className="config-note">
      <label>
        {t("Сертификат Hysteria2")}
        <Select
          value={isAcme ? "acme" : "tls"}
          onValueChange={(nextValue) =>
            onChange(certificateMode(source, nextValue, { host: address, email }))
          }
        >
          <SelectOption value="tls">{t("Собственный TLS-сертификат")}</SelectOption>
          <SelectOption value="acme">{t("Автоматический сертификат ACME")}</SelectOption>
        </Select>
      </label>
      <p>
        {t(
          "ACME продлевает сертификаты, пока экземпляр работает. HTTP-проверке нужен TCP 80, TLS-проверке TCP 443. DNS-проверка не требует входящих портов.",
        )}
      </p>
      {isAcme && (
        <div className="certificate-restart">
          <p className="caption">{t("После включения общего HTTP-порта ACME перезапустите панель:")}</p>
          <CommandBlock command="sudo hy2-panel restart" />
        </div>
      )}
    </div>
  );
}
