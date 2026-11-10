import { type ICertificateInfo } from "@/services/configuration/structured/certificate-api";
import { useTranslation } from "react-i18next";
export function CertificateRow({ certificate }: { certificate: ICertificateInfo }) {
  const { t } = useTranslation();
  return (
    <div className="certificate-row flex flex-wrap gap-3 justify-between py-4 px-6 text-lg">
      <strong>{certificate.domains.join(", ") || certificate.path}</strong>
      <span>
        {certificate.expired ? t("Сертификат истёк") : t("Действует до")}{" "}
        {new Date(certificate.notAfter).toLocaleString()}
      </span>
    </div>
  );
}
