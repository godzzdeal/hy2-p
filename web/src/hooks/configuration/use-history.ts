import { QUERY_KEYS } from "@/config/network";
import { configurationApi } from "@/services/configuration/configuration-api";
import { instanceKey } from "@/services/instances/scope";
import { useInstanceId } from "@/store/core/instance-store";
import { useQuery } from "@tanstack/react-query";

export function useHistory() {
  const id = useInstanceId();
  return useQuery({
    queryKey: instanceKey(QUERY_KEYS.history, id),
    queryFn: () => configurationApi.history(id),
  });
}
