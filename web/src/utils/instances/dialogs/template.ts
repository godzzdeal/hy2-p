import { type IConfiguration } from "@/services/configuration/configuration-types";
import { updateField } from "@/utils/configuration/structured/yaml/fields";
export function instanceTemplate(source: IConfiguration, port: string): IConfiguration {
  return {
    ...source,
    port,
    config: updateField(updateField(source.config, "listen", ":" + port), "acme.dir", ""),
  };
}
