import { coreToolsApi } from "@/services/configuration/tools/api";
import { useInstanceId } from "@/store/core/instance-store";
import { useMutation } from "@tanstack/react-query";
export function useCoreTools() {
  const id = useInstanceId();
  const stats = useMutation({
    mutationFn: () => coreToolsApi.stats(id),
    gcTime: 0,
  });
  return { stats };
}
