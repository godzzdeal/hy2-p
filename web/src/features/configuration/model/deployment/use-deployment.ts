import { useInstanceId, instanceKey } from "@/features/instances/model";
import { useQuery } from "@tanstack/react-query";
import { NETWORK, QUERY_KEYS } from "@/shared/http";
import { deploymentApi } from "./deployment-api";
export function useDeployment() {
  const id = useInstanceId();
  return useQuery({
    queryKey: instanceKey(QUERY_KEYS.deployment, id),
    queryFn: () => deploymentApi.read(id),
    refetchInterval: NETWORK.corePollMs,
  });
}
