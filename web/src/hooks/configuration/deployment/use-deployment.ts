import { NETWORK, QUERY_KEYS } from "@/config/network";
import { deploymentApi } from "@/services/configuration/deployment/deployment-api";
import { instanceKey } from "@/services/instances/scope";
import { useInstanceId } from "@/store/core/instance-store";
import { useQuery } from "@tanstack/react-query";
export function useDeployment() {
  const id = useInstanceId();
  return useQuery({
    queryKey: instanceKey(QUERY_KEYS.deployment, id),
    queryFn: () => deploymentApi.read(id),
    refetchInterval: NETWORK.corePollMs,
  });
}
