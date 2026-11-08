import { firewallApi } from "@/services/admin/firewall/api";
import { useMutation } from "@tanstack/react-query";
export function useFirewall() {
  const read = useMutation({ mutationFn: firewallApi.read });
  const change = useMutation({ mutationFn: firewallApi.change, onSuccess: () => read.mutate() });
  return { read, change };
}
