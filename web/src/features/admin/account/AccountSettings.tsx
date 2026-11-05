import { useAccount } from "@/features/admin/model";
import { QueryState } from "@/shared/ui";
import { AccountForm } from "./AccountForm";
export function AccountSettings() {
  const query = useAccount();
  return (
    <>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.data && <AccountForm username={query.data.username} />}
    </>
  );
}
