import { AccountForm } from "@/components/admin/account/AccountForm";
import { QueryState } from "@/components/ui/QueryState";
import { useAccount } from "@/hooks/admin/use-admin";
export function AccountSettings() {
  const query = useAccount();
  return (
    <>
      <QueryState isLoading={query.isPending} error={query.error} />
      {query.data && <AccountForm username={query.data.username} />}
    </>
  );
}
