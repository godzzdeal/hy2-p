import { Badge } from "@/components/ui/status/Badge";
import type { ICertificateInfo } from "@/services/configuration/structured/certificate-api";
import { formatDateTime } from "@/utils/format-date";
import { useTranslation } from "react-i18next";

export function CertificateDetails({ certificate }: { certificate: ICertificateInfo }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-w-0 flex-1 gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <strong className="min-w-0 wrap-anywhere">
          {certificate.domains.join(", ") || certificate.path}
        </strong>
        {certificate.source && (
          <Badge variant="accent">{certificate.source === "acme" ? "ACME" : "TLS"}</Badge>
        )}
        {certificate.inUse && <Badge>{t("Используется")}</Badge>}
        {certificate.expired && <Badge variant="danger">{t("Сертификат истёк")}</Badge>}
      </div>
      <p className="m-0 text-muted">
        {t("Действует до")} {formatDateTime(certificate.notAfter)}
      </p>
      <code className="min-w-0 text-lg text-muted wrap-anywhere">{certificate.path}</code>
      {certificate.deleteReason && <small className="text-muted">{t(certificate.deleteReason)}</small>}
    </div>
  );
}
