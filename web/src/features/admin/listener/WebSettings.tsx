import { useWebSettings } from "@/features/admin/model";
import { QueryState } from "@/shared/ui";
import { WebForm } from "./WebForm";
export function WebSettings() {
  const query = useWebSettings();
  return (
    <>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.data && <WebForm initial={query.data} />}
    </>
  );
}
