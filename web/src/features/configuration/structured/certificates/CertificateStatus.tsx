import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { certificateApi } from "@/features/configuration/structured/model/certificate-api";
import { CertificateRow } from "@/features/configuration/structured/CertificateRow";
import { QUERY_KEYS } from "@/shared/http";
import { QueryState } from "@/shared/ui";
export function CertificateStatus() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: QUERY_KEYS.hy2Certificates, queryFn: certificateApi.read });
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
        <p className="config-note">
          {t("Сертификаты пока не найдены. Для ACME проверьте запуск ядра, DNS и журнал выдачи.")}
        </p>
      )}
    </section>
  );
}
