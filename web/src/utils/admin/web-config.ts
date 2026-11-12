import { type IWebConfig } from "@/services/admin/admin-types";
export function updateWebConfig(previous: IWebConfig, next: IWebConfig): IWebConfig {
  let hostname = next.domain;
  try {
    hostname ||= new URL(previous.publicURL).hostname;
  } catch {
    hostname ||= typeof window === "undefined" ? "localhost" : window.location.hostname;
  }
  const scheme = next.mode === "http" ? "http" : "https";
  const target = hostname.includes(":") && !hostname.startsWith("[") ? "[" + hostname + "]" : hostname;
  return { ...next, publicURL: scheme + "://" + target + ":" + next.port };
}
