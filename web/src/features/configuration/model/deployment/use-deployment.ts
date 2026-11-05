import { useQuery } from "@tanstack/react-query";
import { NETWORK, QUERY_KEYS } from "@/shared/http";
import { deploymentApi } from "./deployment-api";
export function useDeployment() {
  return useQuery({
    queryKey: QUERY_KEYS.deployment,
    queryFn: deploymentApi.read,
    refetchInterval: NETWORK.corePollMs,
  });
}
