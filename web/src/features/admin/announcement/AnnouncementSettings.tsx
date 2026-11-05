import { useTranslation } from "react-i18next";
import { useAnnouncement } from "./model";
import { AnnouncementForm } from "./AnnouncementForm";
import { QueryState } from "@/shared/ui";
export function AnnouncementSettings() {
  const { t } = useTranslation();
  const query = useAnnouncement();
  return (
    <section id="subscription-announcement" data-scroll-section data-scroll-label={t("Подписка Happ")}>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.data && <AnnouncementForm initial={query.data} />}
    </section>
  );
}
