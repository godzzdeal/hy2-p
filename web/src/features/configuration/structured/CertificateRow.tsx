import { useTranslation } from "react-i18next";
import { type ICertificateInfo } from "./model/certificate-api";
export function CertificateRow({ certificate }: { certificate: ICertificateInfo }) {
  const { t } = useTranslation();
  return (
    <div className="certificate-row">
      <strong>{certificate.domains.join(", ") || certificate.path}</strong>
      <span>
        {certificate.expired ? t("Сертификат истёк") : t("Действует до")}{" "}
        {new Date(certificate.notAfter).toLocaleString()}
      </span>
    </div>
  );
}
