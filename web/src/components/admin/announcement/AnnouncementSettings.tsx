import { AnnouncementForm } from "@/components/admin/announcement/AnnouncementForm";
import { QueryState } from "@/components/ui/loading";
import { useAnnouncement } from "@/hooks/admin/use-announcement";
import { useTranslation } from "react-i18next";
export function AnnouncementSettings() {
  const { t } = useTranslation();
  const query = useAnnouncement();
  return (
    <section id="subscription-announcement" data-scroll-section data-scroll-label={t("Подписка")}>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.data && <AnnouncementForm initial={query.data} />}
    </section>
  );
}
