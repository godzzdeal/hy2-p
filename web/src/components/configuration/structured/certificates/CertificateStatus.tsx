import { Notice } from "@/components/ui/feedback";
import { CertificateRow } from "@/components/configuration/structured/CertificateRow";
import { QueryState } from "@/components/ui/loading";
import { useCertificates } from "@/hooks/configuration/use-certificates";
import { useTranslation } from "react-i18next";
export function CertificateStatus() {
  const { t } = useTranslation();
  const query = useCertificates();
  return (
    <section className="certificate-status">
      <div className="card-header">
        <h3>{t("Состояние сертификатов Hysteria2")}</h3>
        <button type="button" className="text-btn" onClick={() => void query.refetch()}>
          {t("Проверить сертификаты")}
        </button>
      </div>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.data?.certificates.map((certificate) => (
        <CertificateRow key={certificate.path} certificate={certificate} />
      ))}
      {query.data?.certificates.length === 0 && (
        <Notice>
          {t("Сертификаты пока не найдены. Для ACME проверьте запуск экземпляра, DNS и журнал выдачи.")}
        </Notice>
      )}
    </section>
  );
}
