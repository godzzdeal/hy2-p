import { Notice } from "@/components/ui/feedback";
import { CertificateMode } from "@/components/configuration/structured/certificates/CertificateMode";
import { CertificateStatus } from "@/components/configuration/structured/certificates/CertificateStatus";
import { CertificateUpload } from "@/components/configuration/structured/certificates/CertificateUpload";
import { AuthSettings } from "@/components/configuration/structured/form/AuthSettings";
import { PropertySearch } from "@/components/configuration/structured/form/fields/PropertySearch";
import { SectionFields } from "@/components/configuration/structured/form/fields/SectionFields";
import { ConfigNavigation } from "@/components/configuration/structured/form/navigation/ConfigNavigation";
import { OutboundsEditor } from "@/components/configuration/structured/outbounds/OutboundsEditor";
import { EchTools } from "@/components/configuration/structured/tools/EchTools";
import { StatsSecret } from "@/components/configuration/structured/tools/StatsSecret";
import {
  CONFIGURATION_DOCS,
  DOCUMENTATION_SECTIONS,
} from "@/config/hysteria/structured/schema/documentation/sections";
import { useWebSettings } from "@/hooks/admin/use-admin";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { useInstanceId } from "@/store/core/instance-store";
import { useUiStore } from "@/store/ui-store";
import { filterProperties } from "@/utils/configuration/structured/search";
import { readField, updateField } from "@/utils/configuration/structured/yaml/fields";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseDocument } from "yaml";
export function ConfigurationForm({
  value,
  onChange,
}: {
  value: IConfiguration;
  onChange: (value: IConfiguration) => void;
}) {
  const { t } = useTranslation();
  const instanceId = useInstanceId();
  const web = useWebSettings();
  const [showDescription, setDescription] = useState(true);
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
    onChange({ ...value, config: updateField(updateField(value.config, "tls.cert", cert), "tls.key", key) });
  }
  return (
    <section
      className="card structured-config"
      id="config-fields"
      data-scroll-section
      data-scroll-label={t("Параметры Hysteria2")}
    >
      <div className="config-technical-toggle">
        <PropertySearch
          value={search}
          onChange={setSearch}
          count={sections.reduce((count, item) => count + item.fields.length, 0)}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={showDescription}
            onChange={(event) => setDescription(event.target.checked)}
          />
          {t("Показывать пояснения")}
        </label>
      </div>
      {active ? (
        <div className="configuration-layout">
          <ConfigNavigation sections={sections} value={active.id} onSelect={setSection} />
          <div className="configuration-fields">
            <div className="configuration-section-title">
              <h2>{active.title}</h2>
              <a href={CONFIGURATION_DOCS + "#" + active.anchor} target="_blank" rel="noreferrer">
                {t("Документация")}
              </a>
            </div>
            {active.id === "tls" && (
              <CertificateMode
                source={value.config}
                address={value.host}
                email={web.data?.config.email}
                onChange={(config) => onChange({ ...value, config })}
              />
            )}
            {active.id === "auth" && <AuthSettings value={value} onChange={onChange} />}
            {active.id === "ech" && (
              <EchTools
                key={instanceId}
                keyPath={String(readField(document, "ech.keyPath") ?? "")}
                onSet={onSet}
              />
            )}
            {active.id === "trafficStats" && <StatsSecret key={instanceId} />}
            {active.id === "mimic" && (
              <Notice>
                {t(
                  "Mimic требует отдельной установки программы и модуля Linux. Обычный контейнер панели не получает права root для экземпляра.",
                )}
              </Notice>
            )}
            {document.errors.length ? (
              <p className="inline-error">{t(document.errors[0].message)}</p>
            ) : active.id === "outbounds" ? (
              <OutboundsEditor
                source={value.config}
                search={search}
                onChange={(config) => onChange({ ...value, config })}
              />
            ) : (
              <SectionFields
                fields={active.fields}
                document={document}
                isNative={value.authMode === "native"}
                isManagedHttp={isManagedHttp}
                search={search}
                showDescription={showDescription}
                onSet={onSet}
              />
            )}
            {active.id === "tls" && !isAcme && <CertificateUpload onUploaded={onUploaded} />}
            {active.id === "tls" && <CertificateStatus />}
          </div>
        </div>
      ) : (
        <p className="empty">{t("Свойства не найдены. Попробуйте имя из документации.")}</p>
      )}
    </section>
  );
}
