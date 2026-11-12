import { AnnouncementForm } from "@/components/admin/announcement/AnnouncementForm";
import { QueryState } from "@/components/ui/loading";
import { useAnnouncement } from "@/hooks/admin/use-announcement";
export function AnnouncementSettings() {
  const query = useAnnouncement();
  return (
    <section id="subscription-announcement">
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.data && <AnnouncementForm initial={query.data} />}
    </section>
  );
}
