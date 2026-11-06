import { type IConfiguration } from "@/features/configuration/model";
import { updateField } from "@/features/configuration/structured/model/yaml";
export function instanceTemplate(source: IConfiguration, port: string): IConfiguration {
  return {
    ...source,
    port,
    config: updateField(updateField(source.config, "listen", ":" + port), "acme.dir", ""),
  };
}
