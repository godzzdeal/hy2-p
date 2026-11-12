import { type ICertificateInfo } from "@/services/configuration/structured/certificate-api";
import { CertificateDetails } from "./CertificateDetails";
import { CertificateDeleteDialog } from "./CertificateDeleteDialog";
import { Button } from "@/components/ui/button/Button";
import { Trash2 } from "@/components/elements/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
export function CertificateRow({ certificate }: { certificate: ICertificateInfo }) {
  const { t } = useTranslation();
  const [isDeleting, setDeleting] = useState(false);
  return (
    <div className="certificate-row flex min-w-0 flex-wrap items-center gap-4 justify-between p-4 border-2 border-line bg-input text-lg">
      <CertificateDetails certificate={certificate} />
      <Button
        type="button"
        variant="danger"
        disabled={!certificate.id || !certificate.canDelete}
        aria-label={t("Удалить сертификат {{name}}", {
          name: certificate.domains.join(", ") || certificate.path,
        })}
        title={certificate.deleteReason ? t(certificate.deleteReason) : t("Удалить")}
        onClick={() => setDeleting(true)}
      >
        <Trash2 width={24} height={24} aria-hidden />
        {t("Удалить")}
      </Button>
      {isDeleting && <CertificateDeleteDialog certificate={certificate} onClose={() => setDeleting(false)} />}
    </div>
  );
}
