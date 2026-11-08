import { QUERY_KEYS } from "@/config/network";
import { versionApi } from "@/services/panel/version";
import { useQuery } from "@tanstack/react-query";

export function useBuildVersion() {
  return useQuery({ queryKey: QUERY_KEYS.panelVersion, queryFn: versionApi.read });
}
