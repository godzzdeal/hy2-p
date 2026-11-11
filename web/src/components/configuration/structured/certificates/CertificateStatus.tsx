import { CardHeader } from "@/components/ui/cards/CardHeader";
import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
import { CertificateRow } from "@/components/configuration/structured/CertificateRow";
import { QueryState } from "@/components/ui/loading";
import { useCertificates } from "@/hooks/configuration/use-certificates";
import { useTranslation } from "react-i18next";
export function CertificateStatus() {
  const { t } = useTranslation();
  const query = useCertificates();
  return (
    <section className="certificate-status grid min-w-0 gap-3">
      {query.data?.certificates.length === 0 && (
        <Notice variant="warning">
          {t("Сертификаты пока не найдены. Для ACME проверьте запуск экземпляра, DNS и журнал выдачи.")}
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
      {query.data?.certificates.map((certificate) => (
        <CertificateRow key={certificate.path} certificate={certificate} />
      ))}
    </section>
  );
}
