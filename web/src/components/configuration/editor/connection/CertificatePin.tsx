import {
  useCertificatePin,
  type ICertificatePin,
} from "@/components/configuration/editor/connection/use-certificate-pin";
import { useTranslation } from "react-i18next";

export function CertificatePin(props: ICertificatePin) {
  const { t } = useTranslation();
  const { isAutomatic, pin, message, onToggle, onChangePin } = useCertificatePin(props);
  return (
    <div className="connection-sni">
      <label>
        pinSHA256
        <input
          aria-label="pinSHA256"
          value={pin}
          readOnly={isAutomatic}
          placeholder={isAutomatic ? t("После получения сертификата") : "SHA-256"}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => onChangePin(event.target.value)}
        />
        <small>{t(message || "После замены сертификата обновите подписку на устройствах.")}</small>
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={isAutomatic} onChange={(event) => onToggle(event.target.checked)} />
        {t("Вычислять по сертификату")}
      </label>
    </div>
  );
}
