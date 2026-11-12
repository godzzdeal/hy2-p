import { useConfigurationForm } from "@/hooks/configuration/editor/use-configuration-form";
import { readField } from "@/utils/configuration/structured/yaml/fields";
import { EmptyState } from "@/components/ui/status/EmptyState";
import { Card } from "@/components/ui/cards/Card";
import { CardBody } from "@/components/ui/cards/CardBody";
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
import { AclEditor } from "@/components/configuration/structured/acl";
import { AclSources } from "@/components/configuration/structured/acl/sources";
import { MimicTools } from "@/components/configuration/structured/tools/mimic";
import { CONFIGURATION_DOCS } from "@/config/hysteria/structured/schema/documentation/sections";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { useTranslation } from "react-i18next";
export function ConfigurationForm({
  value,
  onChange,
}: {
  value: IConfiguration;
  onChange: (value: IConfiguration) => void;
}) {
  const { t } = useTranslation();
  const {
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
  } = useConfigurationForm({ value, onChange });
  return (
    <Card
      className="structured-config"
      id="config-fields"
      data-scroll-section
      data-scroll-label={t("Параметры Hysteria2")}
    >
      <div className="config-technical-toggle py-3 px-4 flex items-center justify-between gap-3 border-b border-line max-tablet:items-start max-tablet:flex-col">
        <PropertySearch
          value={search}
          onChange={setSearch}
          count={sections.reduce((count, item) => count + item.fields.length, 0)}
        />
      </div>
      {active ? (
        <div className="configuration-layout grid grid-cols-config max-desktop:grid-cols-1">
          <ConfigNavigation sections={sections} value={active.id} onSelect={setSection} />
          <div className="configuration-fields min-w-0 border-l border-line max-desktop:border-l-0">
            <div className="configuration-section-title p-4 border-b border-line bg-surface-soft flex items-center justify-between gap-3 flex-wrap">
              <h2>{active.title}</h2>
              <a href={CONFIGURATION_DOCS + "#" + active.anchor} target="_blank" rel="noreferrer">
                {t("Документация")}
              </a>
            </div>
            <div
              key={active.id}
              className="configuration-section-scroll relative min-h-0 flex-1 overflow-y-auto scrollbar-stable"
            >
              <CardBody className="configuration-section-body gap-4">
                {active.id === "tls" && <CertificateStatus />}
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
                {active.id === "acl" && !search && <AclEditor document={document} onSet={onSet} />}
                {active.id === "acl" && !search && <AclSources document={document} onSet={onSet} />}
                {active.id === "mimic" && <MimicTools key={instanceId} source={value.config} />}
                {document.errors.length ? (
                  <p className="inline-error text-danger text-lg py-3 px-0 wrap-anywhere">
                    {t(document.errors[0].message)}
                  </p>
                ) : active.id === "outbounds" ? (
                  <OutboundsEditor
                    source={value.config}
                    search={search}
                    onChange={(config) => onChange({ ...value, config })}
                  />
                ) : (
                  <SectionFields
                    fields={
                      active.id === "acl" && !search
                        ? active.fields.filter(
                            (field) =>
                              !["acl.inline", "acl.file", "acl.geoip", "acl.geosite"].includes(field.path),
                          )
                        : active.fields
                    }
                    document={document}
                    isNative={value.authMode === "native"}
                    isManagedHttp={isManagedHttp}
                    search={search}
                    onSet={onSet}
                  />
                )}
                {active.id === "tls" && !isAcme && <CertificateUpload onUploaded={onUploaded} />}
              </CardBody>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState>{t("Свойства не найдены. Попробуйте имя из документации.")}</EmptyState>
      )}
    </Card>
  );
}
