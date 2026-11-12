import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/overlays/Modal";
import { useCertificateRemoval } from "@/hooks/configuration/use-certificates";
import type { ICertificateInfo } from "@/services/configuration/structured/certificate-api";
import { useInstanceId } from "@/store/core/instance-store";
import { CertificateDetails } from "./CertificateDetails";
import { useTranslation } from "react-i18next";

export function CertificateDeleteDialog({
  certificate,
  onClose,
}: {
  certificate: ICertificateInfo;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const instanceId = useInstanceId();
  const remove = useCertificateRemoval();
  return (
    <Modal title="Удалить сертификат?" isDismissible={!remove.isPending} onClose={onClose}>
      <div className="grid min-w-0 gap-4">
        <Notice variant="warning">
          {t(
            certificate.source === "acme"
              ? "Сертификат, его ключ и данные выдачи будут удалены. При следующем запуске ACME сможет выпустить сертификат заново."
              : "Сертификат и связанный приватный ключ будут удалены. Если они указаны в настройках, загрузите замену перед запуском экземпляра.",
          )}
        </Notice>
        <CertificateDetails certificate={certificate} />
        <div className="flex justify-end flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={remove.isPending} onClick={onClose}>
            {t("Отменить")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={remove.isPending}
            onClick={() =>
              certificate.id &&
              remove.mutate({ certificateId: certificate.id, instanceId }, { onSuccess: onClose })
            }
          >
            {t(remove.isPending ? "Удаляем…" : "Удалить")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
