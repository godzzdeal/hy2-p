import { useQuery } from "@tanstack/react-query";
import { request, API_ROUTES, QUERY_KEYS, NETWORK } from "@/shared/http";
export const PORT_PURPOSES = {
  panel: "Вход в панель",
  vpn: "Подключение Hysteria2",
  "acme-http": "Проверка сертификата ACME по HTTP",
  "acme-tls": "Проверка сертификата ACME по TLS",
  "masquerade-http": "HTTP-сайт маскировки",
  "masquerade-https": "HTTPS-сайт маскировки",
} as const;
export interface IRecommendedPort {
  port: number;
  protocol: "tcp" | "udp";
  purpose: keyof typeof PORT_PURPOSES;
  source: string;
  pending: boolean;
}
export interface IPortReport {
  ports: IRecommendedPort[];
  warnings: string[];
}
export function useRecommendedPorts() {
  return useQuery({
    queryKey: QUERY_KEYS.firewallPorts,
    queryFn: () => request<IPortReport>(API_ROUTES.firewallPorts),
    refetchInterval: NETWORK.staleMs,
  });
}
