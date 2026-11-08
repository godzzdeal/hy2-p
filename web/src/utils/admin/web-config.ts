import { type IWebConfig } from "@/services/admin/admin-types";
export function updateWebConfig(previous: IWebConfig, next: IWebConfig): IWebConfig {
  if (previous.publicURL !== next.publicURL || !previous.publicURL) return next;
  let address: URL;
  try {
    address = new URL(previous.publicURL);
  } catch {
    return next;
  }
  const isDirect =
    ["localhost", "127.0.0.1", previous.domain].includes(address.hostname) &&
    Number(address.port || (address.protocol === "https:" ? 443 : 80)) === previous.port;
  if (!isDirect) return next;
  const scheme = next.mode === "http" ? "http" : "https";
  const hostname = next.domain || address.hostname;
  return { ...next, publicURL: scheme + "://" + hostname + ":" + next.port };
}
