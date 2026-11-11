import { type IConfiguration } from "@/services/configuration/configuration-types";
import { readField, updateField } from "@/utils/configuration/structured/yaml/fields";
import { parseDocument } from "yaml";

export function setConnectionAddress(
  value: IConfiguration,
  host: string,
  isSniLinked: boolean,
): IConfiguration {
  let source = value.config;
  const document = parseDocument(source);
  if (!document.errors.length && document.has("acme")) {
    const domains = readField(document, "acme.domains");
    if (
      !domains ||
      (Array.isArray(domains) &&
        (domains.length === 0 || (domains.length === 1 && domains[0] === value.host)))
    ) {
      source = updateField(source, "acme.domains", host ? [host] : []);
    }
  }
  return {
    ...value,
    host,
    sni: isSniLinked ? host : value.sni,
    config: source,
  };
}
