import { useMutation } from "@tanstack/react-query";
import { request, API_ROUTES } from "@/shared/http";
import { instanceRoute, useInstanceId } from "@/features/instances/model";
export interface IEch {
  keyPath: string;
  configList: string;
}
export interface IStatsSecret {
  listen: string;
  secret: string;
  running: boolean;
}
export function useCoreTools() {
  const id = useInstanceId();
  const read = useMutation({ mutationFn: () => request<IEch>(instanceRoute(API_ROUTES.ech, id)), gcTime: 0 });
  const generate = useMutation({
    mutationFn: (publicName: string) =>
      request<IEch>(instanceRoute(API_ROUTES.ech, id), { method: "POST", body: { publicName } }),
    gcTime: 0,
  });
  const stats = useMutation({
    mutationFn: () => request<IStatsSecret>(instanceRoute(API_ROUTES.statsSecret, id)),
    gcTime: 0,
  });
  return { read, generate, stats };
}
export async function copyValue(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}
