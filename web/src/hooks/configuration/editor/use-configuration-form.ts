import { useMemo, useState } from "react";
import { parseDocument } from "yaml";
import { useWebSettings } from "@/hooks/admin/use-admin";
import { DOCUMENTATION_SECTIONS } from "@/config/hysteria/structured/schema/documentation/sections";
import { useInstanceId } from "@/store/core/instance-store";
import { useUiStore } from "@/store/ui-store";
import { filterProperties } from "@/utils/configuration/structured/search";
import { readField, updateField } from "@/utils/configuration/structured/yaml/fields";
import type { IConfiguration } from "@/services/configuration/configuration-types";
export interface IConfigurationForm {
  value: IConfiguration;
  onChange: (value: IConfiguration) => void;
}
export function useConfigurationForm({ value, onChange }: IConfigurationForm) {
  const instanceId = useInstanceId();
  const web = useWebSettings();
  const [section, setSection] = useState("listen");
  const [search, setSearch] = useState("");
  const document = useMemo(() => parseDocument(value.config), [value.config]);
  const showError = useUiStore((state) => state.showError);
  const sections = DOCUMENTATION_SECTIONS.map((item) => ({
    ...item,
    fields: filterProperties(item.fields, search),
  })).filter((item) => item.fields.length);
  const active = sections.find((item) => item.id === section) ?? sections[0];
  const isAcme = document.has("acme");
  const challengeType = readField(document, "acme.type");
  const isManagedHttp = !!web.data?.container && (!challengeType || challengeType === "http");
  function onSet(path: string, next: unknown) {
    try {
      onChange({ ...value, config: updateField(value.config, path, next) });
    } catch (error) {
      showError(error);
    }
  }
  function onUploaded(cert: string, key: string) {
    onChange({
      ...value,
      config: updateField(updateField(value.config, "tls.cert", cert), "tls.key", key),
    });
  }

  return {
    instanceId,
    web,
    setSection,
    search,
    setSearch,
    document,
    sections,
    active,
    isAcme,
    isManagedHttp,
    onSet,
    onUploaded,
  };
}
