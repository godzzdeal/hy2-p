import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { parseDocument } from "yaml";
import type { IConfiguration } from "@/features/configuration/model";
import { ConfigField } from "./ConfigField";
import { readField, updateField } from "./model";
import { TRANSPORT_SECTIONS, CERTIFICATE_SECTIONS, NETWORK_SECTIONS } from "./schema";
import { CertificateMode, CertificateUpload, CertificateStatus } from "./certificates";
import { cn } from "@/shared/lib";
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
  const effectiveSection = section === "tls" || section === "acme" ? (isAcme ? "acme" : "tls") : section;
  const active = SECTIONS.find((item) => item.id === effectiveSection);
  return (
    <section
      className="card structured-config"
      id="config-fields"
      data-scroll-section
      data-scroll-label={t("Параметры Hysteria2")}
    >
      <div className="config-tabs" role="tablist" aria-label={t("Разделы конфигурации")}>
        {SECTIONS.filter((item) => item.id !== "tls" || !isAcme)
          .filter((item) => item.id !== "acme" || isAcme)
          .map((item) => (
            <button
              type="button"
              role="tab"
              aria-selected={effectiveSection === item.id}
              className={cn({ selected: effectiveSection === item.id })}
              key={item.id}
              onClick={() => setSection(item.id)}
            >
              {t(item.title)}
            </button>
          ))}
      </div>
      {(effectiveSection === "tls" || effectiveSection === "acme") && (
        <CertificateMode
          source={value.config}
          onChange={(config) => {
            onChange({ ...value, config });
            setSection(parseDocument(config).has("acme") ? "acme" : "tls");
          }}
        />
      )}
      {section === "auth" && (
        <div className="config-note">
          <label>
            {t("Источник аутентификации")}
            <select
              value={value.authMode ?? "panel"}
              onChange={(event) => onChange({ ...value, authMode: event.target.value as "panel" | "native" })}
            >
              <option value="panel">{t("Панель \u2014 пользователи, подписки и лимиты")}</option>
              <option value="native">{t("Нативный auth Hysteria2")}</option>
            </select>
          </label>
          <p>
            {isNative
              ? t(
                  "Панель не подменяет auth. Пользователи и лимиты панели не управляют внешней аутентификацией.",
                )
              : t(
                  "Панель использует HTTP-аутентификацию для сроков доступа и квот. Нативные параметры ниже не применяются.",
                )}
          </p>
        </div>
      )}
      {document.errors.length > 0 ? (
        <p className="inline-error">{t(document.errors[0].message)}</p>
      ) : (
        <div className="field-grid">
          {active?.fields
            .filter((field) => !field.when || readField(document, field.when.path) === field.when.value)
            .filter(() => effectiveSection !== "auth" || isNative)
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
