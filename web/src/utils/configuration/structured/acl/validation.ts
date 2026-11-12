import {
  ACL_MAX_PORT,
  ACL_MIN_PORT,
  IPV4_OCTETS,
  IPV4_MAX_OCTET,
  IPV4_BITS,
  IPV6_BITS,
  type IAclRule,
} from "./model";

export function isIpAddress(value: string): boolean {
  if (value.includes(":")) {
    try {
      return new URL("http://[" + value + "]").hostname.startsWith("[");
    } catch {
      return false;
    }
  }
  const parts = value.split(".");
  return (
    parts.length === IPV4_OCTETS &&
    parts.every((part) => /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= IPV4_MAX_OCTET)
  );
}

export function validateAclAddress(kind: IAclRule["addressType"], value: string): boolean {
  if (kind === "all") return true;
  const address = value.trim();
  if (!address || /[\s(),]/.test(address)) return false;
  if (kind === "ip") return isIpAddress(address);
  if (kind === "cidr") {
    const [ip, prefix, ...extra] = address.split("/");
    const maxPrefix = ip.includes(":") ? IPV6_BITS : IPV4_BITS;
    return (
      extra.length === 0 && isIpAddress(ip) && /^\d{1,3}$/.test(prefix ?? "") && Number(prefix) <= maxPrefix
    );
  }
  if (kind === "geoip") return /^[a-zA-Z][a-zA-Z_-]+$/.test(address);
  if (kind === "geosite") return /^[\p{L}\p{N}_@.!-]+$/u.test(address);
  return /^[\p{L}\p{N}*_-]+(?:\.[\p{L}\p{N}*_-]+)*\.?$/u.test(address);
}

export function validateAclPorts(value: string): boolean {
  if (!value || value === "*") return true;
  const parts = value.split("-");
  if (
    parts.length > 2 ||
    !parts.every((part) => /^\d+$/.test(part) && Number(part) >= ACL_MIN_PORT && Number(part) <= ACL_MAX_PORT)
  )
    return false;
  return parts.length === 1 || Number(parts[0]) <= Number(parts[1]);
}
