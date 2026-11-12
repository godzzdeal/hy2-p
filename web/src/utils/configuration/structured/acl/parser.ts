import {
  ACL_OUTBOUNDS,
  ACL_PROTOCOLS,
  EMPTY_ACL_RULE,
  NEW_ACL_RULE,
  type IAclRule,
  type TAclAddressType,
} from "./model";
import { isIpAddress, validateAclAddress, validateAclPorts } from "./validation";

export function parseAclRule(source: string): IAclRule {
  const text = source.trim();
  if (text.startsWith("#")) return { ...EMPTY_ACL_RULE, mode: "comment", text: text.slice(1).trimStart() };
  const match = /^([^\s(),]+)\(\s*([^(),]+?)\s*(?:,\s*([^(),]+?)\s*)?(?:,\s*([^(),]+?)\s*)?\)$/.exec(text);
  if (!match) return { ...EMPTY_ACL_RULE, mode: "text", text: source };
  const target = match[2].trim();
  const prefix = target.slice(0, target.indexOf(":"));
  let addressType: TAclAddressType = "domain";
  if (target === "all") addressType = "all";
  else if (prefix === "suffix" || prefix === "geoip" || prefix === "geosite") addressType = prefix;
  else if (target.includes("/")) addressType = "cidr";
  else if (target.includes(":") || /^[\d.]+$/.test(target)) addressType = "ip";
  const [protocol = "*", ports = "*", ...extra] = (match[3] ?? "*").trim().split("/");
  if (extra.length || !ACL_PROTOCOLS.some((value) => value === protocol) || !validateAclPorts(ports))
    return { ...EMPTY_ACL_RULE, mode: "text", text: source };
  let address = target;
  if (addressType === "all") address = "";
  else if (addressType === "suffix" || addressType === "geoip" || addressType === "geosite")
    address = target.slice(prefix.length + 1);
  if (!validateAclAddress(addressType, address) || (match[4] && !isIpAddress(match[4].trim())))
    return { ...EMPTY_ACL_RULE, mode: "text", text: source };
  return {
    ...EMPTY_ACL_RULE,
    outbound: match[1],
    addressType,
    address,
    protocol,
    ports,
    hijack: match[4]?.trim() ?? "",
  };
}

export function serializeAclRule(rule: IAclRule): string {
  if (rule.mode === "comment")
    return rule.text
      .split(/\r?\n/)
      .map((line) => "# " + line)
      .join("\n");
  if (rule.mode === "text") return rule.text;
  const address =
    rule.addressType === "all"
      ? "all"
      : ["suffix", "geoip", "geosite"].includes(rule.addressType)
        ? rule.addressType + ":" + rule.address.trim()
        : rule.address.trim();
  const protocol =
    rule.protocol === "*" && (!rule.ports || rule.ports === "*")
      ? "*"
      : rule.protocol + "/" + (rule.ports || "*");
  const parameters = [address];
  if (protocol !== "*" || rule.hijack) parameters.push(protocol);
  if (rule.hijack) parameters.push(rule.hijack.trim());
  return rule.outbound + "(" + parameters.join(", ") + ")";
}

export function updateAclRule(lines: string[], index: number, source: string): string[] {
  if (!Number.isInteger(index) || index < NEW_ACL_RULE || index >= lines.length) return lines;
  const next = [...lines];
  next.splice(index < 0 ? next.length : index, index < 0 ? 0 : 1, ...source.split(/\r?\n/));
  return next;
}

export function moveAclRule(lines: string[], index: number, direction: number): string[] {
  const target = index + direction;
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= lines.length ||
    Math.abs(direction) !== 1 ||
    target < 0 ||
    target >= lines.length
  )
    return lines;
  const next = [...lines];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function readAclLines(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || !value.every((line): line is string => typeof line === "string")) return null;
  return value;
}

export function aclOutboundNames(source: unknown): string[] {
  const names = [...ACL_OUTBOUNDS] as string[];
  if (Array.isArray(source))
    for (const entry of source) {
      const value: unknown = entry;
      if (value !== null && typeof value === "object" && "name" in value && typeof value.name === "string")
        names.push(value.name);
    }
  return Array.from(new Set(names));
}
