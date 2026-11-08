import { coreToolsApi } from "@/services/configuration/tools/api";
import { useInstanceId } from "@/store/core/instance-store";
import { useMutation } from "@tanstack/react-query";
export function useCoreTools() {
  const id = useInstanceId();
  const read = useMutation({ mutationFn: () => coreToolsApi.read(id), gcTime: 0 });
  const generate = useMutation({
    mutationFn: (publicName: string) => coreToolsApi.generate(publicName, id),
    gcTime: 0,
  });
  const stats = useMutation({ mutationFn: () => coreToolsApi.stats(id), gcTime: 0 });
  return { read, generate, stats };
}
