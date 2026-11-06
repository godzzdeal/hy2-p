import { type Document } from "yaml";
import { type IConfigField } from "@/features/configuration/structured/model";
import { readField } from "@/features/configuration/structured/model";
import { FIELD_DEFAULTS } from "@/features/configuration/structured/schema/documentation/defaults";
export function fieldAvailability(
  field: IConfigField,
  document: Document,
  isNative: boolean,
  isManagedHttp: boolean,
) {
  const certificate = document.has("acme") ? "acme." : "tls.";
  const isCertificate = field.path.startsWith("acme.") || field.path.startsWith("tls.");
  const isCertificateActive = !isCertificate || field.path.startsWith(certificate);
  const type = field.when
    ? field.when.path === "auth.type" && !isNative
      ? "http"
      : (readField(document, field.when.path) ?? FIELD_DEFAULTS[field.when.path])
    : undefined;
  const isModeActive = !field.when || type === field.when.value;
  let reason = "";
  if (field.managed || (isManagedHttp && ["acme.http.altPort", "acme.listenHost"].includes(field.path)))
    reason = "Это свойство задаёт панель при запуске ядра.";
  else if (!isNative && field.path.startsWith("auth."))
    reason = "Выберите «Настройки Hysteria2», чтобы редактировать auth.";
  else if (!isCertificateActive) reason = "Выберите соответствующий режим TLS / ACME.";
  else if (!isModeActive && field.when) reason = field.when.path + " = " + String(field.when.value);
  return { isVisible: isCertificateActive && isModeActive, reason };
}
