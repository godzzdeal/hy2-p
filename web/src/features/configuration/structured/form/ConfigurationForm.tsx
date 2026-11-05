import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { parseDocument } from "yaml";
import { type IConfiguration } from "@/features/configuration/model";
import { ConfigField } from "../controls";
import { AuthSettings } from "./AuthSettings";
import { ConfigTab } from "./ConfigTab";
import { readField, updateField } from "../model";
import { TRANSPORT_SECTIONS, CERTIFICATE_SECTIONS, NETWORK_SECTIONS } from "../schema";
import { CertificateMode, CertificateUpload, CertificateStatus } from "../certificates";
import { useWebSettings } from "@/features/admin/model";
import { useUiStore } from "@/app/state";
const SECTIONS = [...TRANSPORT_SECTIONS, ...CERTIFICATE_SECTIONS, ...NETWORK_SECTIONS];
export function ConfigurationForm({
  value,
  onChange,
}: {
  value: IConfiguration;
  onChange: (value: IConfiguration) => void;
}) {
  const { t } = useTranslation();
  const web = useWebSettings();
  const [section, setSection] = useState("server");
  const document = useMemo(() => parseDocument(value.config), [value.config]);
  const showError = useUiStore((state) => state.showError);
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
  const isNative = value.authMode === "native";
  const isAcme = document.has("acme");
  const challengeType = readField(document, "acme.type");
  const isManagedHttp = web.data?.container && (!challengeType || challengeType === "http");
  const effectiveSection = section === "tls" || section === "acme" ? (isAcme ? "acme" : "tls") : section;
  const active = SECTIONS.find((item) => item.id === effectiveSection);
  return (
    <section
      className="card structured-config"
      id="config-fields"
      data-scroll-section
      data-scroll-label={t("Параметры Hysteria2")}
    >
      <nav className="config-tabs" aria-label={t("Разделы конфигурации")}>
        {SECTIONS.filter((item) => item.id !== "tls" || !isAcme)
          .filter((item) => item.id !== "acme" || isAcme)
          .map((item) => (
            <ConfigTab
              key={item.id}
              id={item.id}
              title={item.title}
              isSelected={effectiveSection === item.id}
              onSelect={setSection}
            />
          ))}
      </nav>
      {(effectiveSection === "tls" || effectiveSection === "acme") && (
        <CertificateMode
          source={value.config}
          onChange={(config) => {
            onChange({ ...value, config });
            setSection(parseDocument(config).has("acme") ? "acme" : "tls");
          }}
        />
      )}
      {section === "auth" && <AuthSettings value={value} onChange={onChange} />}
      {document.errors.length > 0 ? (
        <p className="inline-error">{t(document.errors[0].message)}</p>
      ) : (
        <div className="field-grid">
          {active?.fields
            .filter((field) => !field.when || readField(document, field.when.path) === field.when.value)
            .filter(() => effectiveSection !== "auth" || isNative)
            .filter(
              (field) => !isManagedHttp || !["acme.http.altPort", "acme.listenHost"].includes(field.path),
            )
            .map((field) => (
              <ConfigField
                key={field.path}
                field={field}
                value={readField(document, field.path)}
                onChange={(next) => onSet(field.path, next)}
              />
            ))}
        </div>
      )}
      {effectiveSection === "tls" && <CertificateUpload onUploaded={onUploaded} />}
      {(effectiveSection === "tls" || effectiveSection === "acme") && <CertificateStatus />}
    </section>
  );
}
