import { API_ROUTES } from "@/config/network";
import { request } from "@/services/http/client";

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
export const firewallApi = {
  read: () => request<IFirewall>(API_ROUTES.firewall),
  change: (body: IPortRule) => request<IFirewall>(API_ROUTES.firewall, { method: "POST", body }),
};
