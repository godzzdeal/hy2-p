import { WebForm } from "@/components/admin/listener/WebForm";
import { QueryState } from "@/components/ui/loading";
import { useWebSettings } from "@/hooks/admin/use-admin";
export function WebSettings() {
  const query = useWebSettings();
  return (
    <>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.data && <WebForm initial={query.data} />}
    </>
  );
}
