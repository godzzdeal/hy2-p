import { CardHeader } from "@/components/ui/cards/CardHeader";
import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
import { CertificateRow } from "@/components/configuration/structured/certificates/list";
import { QueryState } from "@/components/ui/loading";
import { useCertificates } from "@/hooks/configuration/use-certificates";
import { usePagination } from "@/hooks/ui";
import { Pagination } from "@/components/ui/Pagination";
import { useTranslation } from "react-i18next";
export function CertificateStatus() {
  const { t } = useTranslation();
  const query = useCertificates();
  const pagination = usePagination(query.data?.certificates ?? []);
  return (
    <section className="certificate-status grid min-w-0 gap-3">
      {query.data?.certificates.length === 0 && (
        <Notice variant="warning">
          {t(
            "Сертификаты не найдены. Если используете ACME, проверьте запуск экземпляра, DNS и журнал выдачи.",
          )}
        </Notice>
      )}
      <CardHeader className="p-0 pb-3 max-tablet:p-0 max-tablet:pb-3 bg-transparent">
        <h3>{t("Состояние сертификатов Hysteria2")}</h3>
        <Button
          aria-label={t("Проверить сертификаты")}
          type="button"
          variant="outline"
          onClick={() => void query.refetch()}
        >
          {t("Проверить")}
        </Button>
      </CardHeader>
      <QueryState isLoading={query.isPending} error={query.error} />
      {pagination.items.map((certificate) => (
        <CertificateRow key={certificate.path} certificate={certificate} />
      ))}
      <Pagination
        className="p-0"
        page={pagination.current}
        pageCount={pagination.pageCount}
        onChange={pagination.setPage}
      />
    </section>
  );
}
