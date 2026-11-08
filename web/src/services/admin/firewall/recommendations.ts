import { type IRecommendedPort } from "@/services/admin/firewall/ports";
export interface IPortSummary {
  port: number;
  protocol: IRecommendedPort["protocol"];
  purposes: IRecommendedPort["purpose"][];
  sources: string[];
  pending: boolean;
}
export function groupRecommendedPorts(ports: IRecommendedPort[]): IPortSummary[] {
  const groups = new Map<string, IPortSummary>();
  for (const item of ports) {
    const key = `${item.port}/${item.protocol}`;
    const group = groups.get(key) ?? {
      port: item.port,
      protocol: item.protocol,
      purposes: [],
      sources: [],
      pending: false,
    };
    if (!group.purposes.includes(item.purpose)) group.purposes.push(item.purpose);
    if (!group.sources.includes(item.source)) group.sources.push(item.source);
    group.pending ||= item.pending;
    groups.set(key, group);
  }
  return [...groups.values()];
}
