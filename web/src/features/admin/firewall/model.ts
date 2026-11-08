import { useMutation } from "@tanstack/react-query";
import { request, API_ROUTES } from "@/shared/http";
export interface IFirewall {
  protectedPorts?: number[];
  active: boolean;
  output: string;
}
export interface IPortRule {
  port: number;
  protocol: "tcp" | "udp";
  action: "allow" | "deny";
}
export function useFirewall() {
  const read = useMutation({ mutationFn: () => request<IFirewall>(API_ROUTES.firewall) });
  const change = useMutation({
    mutationFn: (body: IPortRule) => request<IFirewall>(API_ROUTES.firewall, { method: "POST", body }),
    onSuccess: () => read.mutate(),
  });
  return { read, change };
}
